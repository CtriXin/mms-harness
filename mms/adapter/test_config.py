from __future__ import annotations
import copy
import hashlib
import json
import os
import stat
import sys
from pathlib import Path
import pytest
sys.path.insert(0, str(Path(__file__).parent))
from config import convert_bundle, configure, read_config, safe_url, shared_skill_dirs
from run import launch_env
from mms_consumer_bundle import EXPECTED_BUNDLE_FILES, ConsumerBundleError


def payload():
    return {'component_revisions': {'bundle': 'test-bundle'}, 'payloads': {
        'router': {'runtime_ready': True, 'routes': {'deepseek-test': {'primary': {
            'provider_id': 'test', 'model_id': 'upstream-alias', 'api_key': 'test-private-value',
            'anthropic_base_url': 'https://example.test/anthropic', 'openai_base_url': 'https://example.test/v1'}}}},
        'policy': {'models': {}}, 'profile': {'profiles': {}}, 'lineup': {'routes': {}},
        'capabilities': {'models': [{'model': 'deepseek-test', 'supports_thinking': True, 'supports_vision': True,
            'context_window_tokens': 200000, 'max_output_tokens': 16000,
            'thinking_control': {'allowed_values': ['low','high'], 'supported': True}}]}}}


def bundle_dir(tmp_path, data):
    root = tmp_path/'mms'; g=root/'generated';g.mkdir(parents=True)
    manifest={'schema':'mms.model_registry.latest_approved.v1', 'files':{}}
    for k in ['bundle','model_registry','route','policy','profile','capability']:
        manifest[k+'_revision']='test-'+k
    for name, contract in EXPECTED_BUNDLE_FILES.items():
        relative, sensitivity=contract['canonical_path'],contract['sensitivity']
        f=root/relative;f.write_text(json.dumps(data['payloads'][name]))
        manifest['files'][name]={'canonical_path':relative,'sensitivity':sensitivity,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
    (g/'model-registry.latest-approved.json').write_text(json.dumps(manifest))
    return root


def test_selected_identity_protocol_and_effort_preserved():
    c=convert_bundle(payload()); r=c['routes'][0];p=c['providers'][r['provider']]
    assert p['api']=='anthropic-messages' and p['models'][0]['id']=='upstream-alias'
    assert p['models'][0]['reasoningEfforts']=={'low':'low','high':'high'}
    assert p['models'][0]['input']==['text','image']
    assert 'test-private-value' not in json.dumps({k:v for k,v in c.items() if k!='credentials'})


def test_missing_credentials_no_ambient_or_automatic_fallback():
    d=payload(); group=d['payloads']['router']['routes']['deepseek-test']
    backup=copy.deepcopy(group['primary']);backup['provider_id']='backup'
    group['primary']['api_key']='';group['fallbacks']=[backup]
    c=convert_bundle(d)
    assert len(c['routes'])==1 and c['routes'][0]['rank']==1
    assert len(c['excluded'])==1
    group['fallbacks']=[]
    with pytest.raises(ConsumerBundleError): convert_bundle(d)


def test_invalid_bundle_never_reads_legacy(tmp_path):
    root=bundle_dir(tmp_path,payload())
    (root/'model-routes.json').write_text('{}')
    (root/'generated/model-routes.json').write_text('{}')
    with pytest.raises(ConsumerBundleError,match='hash mismatch'): read_config(root)
    with pytest.raises(ConsumerBundleError,match='missing'): read_config(tmp_path/'missing')


def test_private_configuration_and_model_policy(tmp_path):
    d=payload();root=bundle_dir(tmp_path,d);instance=tmp_path/'instance'
    before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
    configure(root,instance,'deepseek-test')
    assert before=={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in before}
    assert stat.S_IMODE((instance/'home/.credentials.yaml').stat().st_mode)==0o600
    assert 'test-private-value' not in (instance/'mms.patch.yml').read_text()
    assert 'test-private-value' not in (instance/'routes.json').read_text()
    d['payloads']['policy']['models']['deepseek-test']={'visible':False}
    with pytest.raises(ConsumerBundleError): convert_bundle(d)


def test_clean_environment(tmp_path,monkeypatch):
    for k in ['ANTHROPIC_API_KEY','OPENAI_API_KEY','CODEX_HOME','CLAUDE_CONFIG_DIR','NODE_OPTIONS','MMS_CONFIG_ROOT','MMS_REAL_HOME']:
        monkeypatch.setenv(k,'must-not-inherit')
    e=launch_env(tmp_path,Path('/usr/bin/node'))
    assert 'must-not-inherit' not in e.values()
    assert e['HOME']==str(tmp_path/'user-home')


def test_zoxide_database_is_pointed_at_but_never_copied(tmp_path,monkeypatch):
    """The private HOME would hide the operator's own zoxide database (C14.03).

    The instance is told where it lives, read-only; every other host path stays
    isolated. Without a database, nothing is passed at all.
    """
    data=tmp_path/'host-zoxide'; data.mkdir()
    monkeypatch.setenv('_ZO_DATA_DIR',str(data))
    e=launch_env(tmp_path/'inst',Path('/usr/bin/node'))
    # No database yet: the search degrades rather than naming a missing path.
    assert '_ZO_DATA_DIR' not in e
    (data/'db.zo').write_bytes(b'')
    e=launch_env(tmp_path/'inst',Path('/usr/bin/node'))
    assert e['_ZO_DATA_DIR']==str(data)
    # The isolation the pointer must not widen.
    assert e['HOME']==str(tmp_path/'inst/user-home')
    assert e['XDG_DATA_HOME']==str(tmp_path/'inst/user-home/.local/share')


def test_zoxide_pointer_finds_the_platform_database_macos_included(tmp_path,monkeypatch):
    """macOS zoxide lives under Library/Application Support, NOT the XDG path.

    Resolving it the XDG way found an empty directory and the search silently
    returned nothing on the very machine this is for.
    """
    monkeypatch.delenv('_ZO_DATA_DIR',raising=False)
    monkeypatch.delenv('XDG_DATA_HOME',raising=False)
    home=tmp_path/'home'; monkeypatch.setattr(Path,'home',staticmethod(lambda:home))
    mac=home/'Library/Application Support/zoxide'; xdg=home/'.local/share/zoxide'
    mac.mkdir(parents=True); (mac/'db.zo').write_bytes(b'')
    expected=str(mac) if sys.platform=='darwin' else None
    e=launch_env(tmp_path/'inst',Path('/usr/bin/node'))
    if expected: assert e['_ZO_DATA_DIR']==expected
    # An operator whose database sits at the XDG path is still found.
    (mac/'db.zo').unlink(); xdg.mkdir(parents=True); (xdg/'db.zo').write_bytes(b'')
    assert launch_env(tmp_path/'inst',Path('/usr/bin/node'))['_ZO_DATA_DIR']==str(xdg)


@pytest.mark.parametrize('url',['https://secret@example.test/v1','https://example.test/v1?key=secret'])
def test_endpoint_rejects_credential_leaks(url):
    with pytest.raises(ValueError): safe_url(url)


def test_restart_preserves_user_dsh_credentials(tmp_path):
    root=bundle_dir(tmp_path,payload());instance=tmp_path/'instance'
    configure(root,instance,'deepseek-test')
    with pytest.raises(ValueError,match='must be parsed'):
        configure(root,instance,'deepseek-test')
    previous={'version':1,'refs':{'USER_OWN_KEY':'user-only-secret','MMS_DSH_STALE':'removed'},'records':{}}
    configure(root,instance,'deepseek-test',previous_credentials=previous)
    stored=json.loads((instance/'home/.credentials.yaml').read_text())
    assert stored['refs']['USER_OWN_KEY']=='user-only-secret'
    assert 'MMS_DSH_STALE' not in stored['refs']


@pytest.mark.parametrize('base,anth,expected',[
    ('https://example.test','https://example.test','https://example.test/v1'),
    ('https://example.test/v1','https://example.test','https://example.test/v1'),
    ('https://example.test/openai','https://example.test/anthropic','https://example.test/openai'),
])
def test_openai_endpoint_matches_mms_sdk_root(base,anth,expected):
    from config import protocol_for
    protocol,url,_=protocol_for('gpt-test',{'openai_base_url':base,'anthropic_base_url':anth})
    assert protocol=='openai_responses' and url==expected


def test_mms_shipped_capabilities_fill_missing_metadata_but_never_override_policy():
    d=payload();group=d['payloads']['router']['routes'].pop('deepseek-test')
    group['primary']['model_id']='gpt-5.6-sol';d['payloads']['router']['routes']['gpt-5.6-sol']=group
    c=convert_bundle(d);model=next(iter(c['providers'].values()))['models'][0]
    assert model['contextWindow']==1050000 and 'image' in model['input']
    assert 'high' in model['reasoningEfforts']
    d['payloads']['policy']['models']['gpt-5.6-sol']={'capabilities':{'vision':False}}
    assert next(iter(convert_bundle(d)['providers'].values()))['models'][0]['input']==['text']


def test_mms_effort_preference_reaches_dsh_settings_once(tmp_path):
    # dsh reads reasoningEffort only from the settings layer; a config value is ignored
    # (packages/core/agent-default-model/README.md). Seed it once, never over a user choice.
    d=payload(); d['payloads']['policy']['models']['deepseek-test']={'capabilities':{'reasoning_effort':'high'}}
    root=bundle_dir(tmp_path,d); instance=tmp_path/'instance'
    configure(root,instance,'deepseek-test')
    settings=(instance/'home/settings.yaml').read_text()
    assert 'agent-default-model:' in settings and 'reasoningEffort: "high"' in settings and 'model: "upstream-alias"' in settings
    patch=json.loads((instance/'mms.patch.yml').read_text())
    assert [r['config'] for r in patch if r.get('id')=='agent-default-model']==[{'provider':json.loads((instance/'routes.json').read_text())['routes'][0]['provider'],'model':'upstream-alias'}]
    user='ui-onboarding:\n  welcomeNoticeVersion: x\nagent-default-model:\n  provider: other\n  model: picked\n  reasoningEffort: low\n'
    (instance/'home/settings.yaml').write_text(user)
    configure(root,instance,'deepseek-test',previous_credentials=json.loads((instance/'home/.credentials.yaml').read_text()))
    assert (instance/'home/settings.yaml').read_text()==user
    other='ui-onboarding:\n  welcomeNoticeVersion: x\n'
    (instance/'home/settings.yaml').write_text(other)
    configure(root,instance,'deepseek-test',previous_credentials=json.loads((instance/'home/.credentials.yaml').read_text()))
    seeded=(instance/'home/settings.yaml').read_text()
    assert seeded.startswith(other) and 'reasoningEffort: "high"' in seeded


def test_ui_overlay_row_names_its_file_only_when_installed(tmp_path):
    # The overlay is outside dsh's dependency closure, so a bare package name
    # cannot resolve (ERR_MODULE_NOT_FOUND at boot); the row carries the file.
    root=bundle_dir(tmp_path,payload()); instance=tmp_path/'instance'
    rows=lambda: [r for p in json.loads((instance/'mms.patch.yml').read_text()) for r in p.get('insert',[]) if r['id']=='mms-ui']
    configure(root,instance,'deepseek-test')
    assert rows()==[]
    overlay=tmp_path/'runtime/node_modules/@deepseek-ai/dsh-client-ui-mms'
    configure(root,instance,'deepseek-test',previous_credentials=json.loads((instance/'home/.credentials.yaml').read_text()),ui_overlay=overlay)
    assert rows()==[{'id':'mms-ui','name':str(overlay/'lib/index.js')}]


def skill_root(path):
    """A skill root as the filesystem provider recognises one: `<root>/<name>/SKILL.md`."""
    path.mkdir(parents=True)
    (path/'a-skill').mkdir()
    (path/'a-skill'/'SKILL.md').write_text('---\nname: a-skill\n---\n', encoding='utf8')
    return path


def test_shared_skill_roots_reach_the_isolated_host(tmp_path, monkeypatch):
    """The private HOME empties every user-level skill root DSH would scan.

    Without this the Host sees only the skills that happen to live inside the
    opened workspace, and the operator's own library is invisible to it.
    """
    first = skill_root(tmp_path/'claude-skills'); second = skill_root(tmp_path/'agents-skills')
    monkeypatch.setenv('MMS_DSH_SKILL_DIRS', os.pathsep.join(
        [str(first), str(second), str(tmp_path/'absent'), str(first)]))
    configure(bundle_dir(tmp_path, payload()), tmp_path/'instance', 'deepseek-test')
    patch = json.loads((tmp_path/'instance/mms.patch.yml').read_text())
    entry = next(e for e in patch if e.get('id') == 'skill-filesystem')
    # Order is precedence; a root that does not exist is never named, and one
    # named twice is mounted once so precedence cannot depend on the spelling.
    assert entry['config']['customSkillDirs'] == [str(first), str(second)]
    # The Web bundle disables this row and lets each agent preset mount its own,
    # so configuring it without re-enabling it is silently inert — that is
    # exactly how this failed the first time, with no error anywhere.
    assert entry['disabled'] is False
    # The preset's own provider already owns the workspace and user roots; a
    # second copy of them in the global layer only duplicates their watchers.
    assert entry['config']['includeDefaultRoots'] is False


def test_no_shared_skill_root_leaves_the_provider_untouched(tmp_path, monkeypatch):
    """Naming nothing must not hand the Host an empty override to honour."""
    monkeypatch.setenv('MMS_DSH_SKILL_DIRS', str(tmp_path/'nowhere'))
    configure(bundle_dir(tmp_path, payload()), tmp_path/'instance', 'deepseek-test')
    patch = json.loads((tmp_path/'instance/mms.patch.yml').read_text())
    assert not any(e.get('id') == 'skill-filesystem' for e in patch)


def test_shared_skill_roots_default_to_the_operators_own_libraries(tmp_path, monkeypatch):
    """Unset means the two roots the operator's other agents already use."""
    monkeypatch.delenv('MMS_DSH_SKILL_DIRS', raising=False)
    home = tmp_path/'home'; monkeypatch.setattr(Path, 'home', staticmethod(lambda: home))
    monkeypatch.setenv('HOME', str(home))
    skill_root(home/'.agents/skills')
    # Only the root that exists is named, in the documented precedence order.
    assert shared_skill_dirs() == [str(home/'.agents/skills')]
    skill_root(home/'.claude/skills')
    assert shared_skill_dirs() == [str(home/'.claude/skills'), str(home/'.agents/skills')]
