"""Upgrade guards that the live L8 run cannot reach cheaply (C11.01, C11.06, C11.07)."""
import json
import os
import subprocess
import sys
from pathlib import Path
import urllib.error
import urllib.request

import pytest

import upgrade as up

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import install as inst


def repo_with_build(tmp_path, env):
    repo = tmp_path / 'repo'
    repo.mkdir()
    git = lambda *a: subprocess.run(['git', '-C', str(repo), *a], check=True, capture_output=True, text=True).stdout.strip()
    git('init', '-q')
    (repo / 'app.ts').write_text('one')
    (repo / 'mms').mkdir()
    (repo / 'mms/adapter.py').write_text('one')
    git('add', '.')
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'one')
    head = git('rev-parse', '--short=7', 'HEAD')
    (repo / '.dsh-build').mkdir()
    record = {'DSH_CLIENT_COMMIT_HASH': head, 'DSH_CLIENT_TITLE': 'MMS Harness', **env}
    (repo / up.RECORD).write_text(json.dumps({'environment': record}))
    return repo, git


def test_build_counts_only_when_built_from_this_code(tmp_path):
    repo, git = repo_with_build(tmp_path, {})
    assert up.build_matches(repo)[0]
    # mms/ is copied as source at install time, so changing it needs no rebuild.
    (repo / 'mms/adapter.py').write_text('two')
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'mms only')
    assert up.build_matches(repo)[0]
    (repo / 'app.ts').write_text('dirty')
    assert not up.build_matches(repo)[0]
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'client change')
    ok, why = up.build_matches(repo)
    assert not ok and '需要重新构建' in why


@pytest.mark.parametrize('env, reason', [({'DSH_CLIENT_GIT_DIRTY': 'true'}, '未提交'), ({'DSH_CLIENT_TITLE': 'DeepSeek Harness'}, 'DSH_CLIENT_TITLE')])
def test_dirty_or_unbranded_builds_are_refused(tmp_path, env, reason):
    repo, _ = repo_with_build(tmp_path, env)
    ok, why = up.build_matches(repo)
    assert not ok and reason in why


def test_missing_record_is_refused(tmp_path):
    assert not up.build_matches(tmp_path)[0]


def test_probe_refuses_redirects_away_from_loopback_and_ignores_proxies(monkeypatch):
    handler = up.LoopbackOnlyRedirects()
    req = urllib.request.Request('http://127.0.0.1:1/?token=x')
    assert handler.redirect_request(req, None, 303, 'See Other', {}, 'http://127.0.0.1:1/') is not None
    with pytest.raises(urllib.error.HTTPError):
        handler.redirect_request(req, None, 303, 'See Other', {}, 'http://evil.example/steal')
    # An unreachable environment proxy must not be used for the local probe.
    import http.server, threading
    server = http.server.HTTPServer(('127.0.0.1', 0), type('H', (http.server.BaseHTTPRequestHandler,), {
        'do_GET': lambda self: (self.send_response(200), self.end_headers(), self.wfile.write(b'ok')),
        'log_message': lambda *a: None}))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        for name in ('http_proxy', 'HTTP_PROXY', 'all_proxy'):
            monkeypatch.setenv(name, 'http://127.0.0.1:9')
        monkeypatch.delenv('no_proxy', raising=False)
        monkeypatch.delenv('NO_PROXY', raising=False)
        assert up.opener().open(f'http://127.0.0.1:{server.server_port}/', timeout=5).read() == b'ok'
    finally:
        server.shutdown()


def test_relocate_points_config_and_launcher_at_the_final_root(tmp_path):
    staging, root = tmp_path / '.x-staging', tmp_path / 'x'
    root.mkdir()
    (root / 'installation.json').write_text(json.dumps({
        'runtime': str(staging / 'runtime'), 'instance': str(staging / 'instance'), 'workspace': str(staging / 'workspace'),
        'mms_root': '/elsewhere', 'port': 55555}))
    (root / 'MMS Harness.command').write_text(f"exec py {staging}/source/mms/adapter/service.py --installation {staging}")
    up.relocate(root, staging, 3092)
    config = json.loads((root / 'installation.json').read_text())
    assert config['runtime'] == str(root / 'runtime') and config['instance'] == str(root / 'instance')
    assert config['mms_root'] == '/elsewhere' and config['port'] == 3092
    assert str(staging) not in (root / 'MMS Harness.command').read_text()


def shortcut_home(tmp_path, monkeypatch, applications=True):
    """A fake HOME and /Applications so shortcut writes never touch the real ones."""
    home = tmp_path/'home'; (home/'Applications').mkdir(parents=True)
    monkeypatch.setattr(Path, 'home', staticmethod(lambda: home))
    system = tmp_path/'system-applications'
    if applications:
        system.mkdir()
    monkeypatch.setattr(inst, 'SYSTEM_APPLICATIONS', system)
    launcher = tmp_path/'install'/'MMS Harness.command'
    launcher.parent.mkdir()
    launcher.write_text('#!/bin/sh\nexec true "$@"\n')
    return home, system, launcher


def test_shortcuts_land_on_path_and_in_applications(tmp_path, monkeypatch):
    """The launcher lived where nobody could find it: buried under ~/.local/share.

    A `~/Applications` copy does not fix it either — the Finder sidebar's
    「应用程序」 is `/Applications`, a different folder.
    """
    home, system, launcher = shortcut_home(tmp_path, monkeypatch)
    inst.link_shortcuts(launcher)
    command = home/'.local/bin/mms-harness'
    assert command.is_symlink() and command.resolve() == launcher.resolve()
    binary = system/'MMS Harness.app/Contents/MacOS/mms-harness'
    # A bundle, not a `.command`: Spotlight and Launchpad list applications.
    assert (system/'MMS Harness.app/Contents/Info.plist').is_file()
    # Double-clicking carries no arguments, so the bundle can only mean `open`.
    assert str(launcher) in binary.read_text() and binary.read_text().rstrip().endswith('open')
    assert binary.stat().st_mode & 0o111


def test_shortcuts_fall_back_to_the_user_applications_folder(tmp_path, monkeypatch):
    """No write access to /Applications is a reason to use ~/Applications, not to give up."""
    home, system, launcher = shortcut_home(tmp_path, monkeypatch, applications=False)
    inst.link_shortcuts(launcher)
    assert not system.exists()
    assert (home/'Applications/MMS Harness.app/Contents/MacOS/mms-harness').is_file()


def test_shortcuts_replace_our_old_link_but_never_someone_else_s_file(tmp_path, monkeypatch, capsys):
    """A stale link from the previous install is ours to move; a real file is not."""
    home, system, launcher = shortcut_home(tmp_path, monkeypatch)
    command = home/'.local/bin/mms-harness'
    command.parent.mkdir(parents=True)
    command.symlink_to(tmp_path/'an-older-installation')
    inst.link_shortcuts(launcher)
    assert command.resolve() == launcher.resolve()

    command.unlink(); command.write_text('someone else owns this name\n')
    inst.link_shortcuts(launcher)
    assert command.read_text() == 'someone else owns this name\n'
    # Recognised and reported as someone else's name, not attempted and blamed
    # on the filesystem: the operator has to know which of the two happened.
    assert 'left alone' in capsys.readouterr().err


def test_one_unwritable_shortcut_does_not_take_the_others_with_it(tmp_path, monkeypatch):
    """Shortcuts are a convenience; a complete installation must not fail for them."""
    home, system, launcher = shortcut_home(tmp_path, monkeypatch)
    (home/'.local').mkdir()
    (home/'.local/bin').write_text('not a directory\n')  # the PATH link cannot be made
    made = inst.link_shortcuts(launcher)
    assert not (home/'.local/bin').is_dir()
    # The bundle is unaffected, and the installation is still reported complete.
    assert made == [system/'MMS Harness.app']


def test_an_unwritable_bundle_path_falls_back_instead_of_failing(tmp_path, monkeypatch):
    """A shortcut that cannot be written is not a reason to fail the install."""
    home, system, launcher = shortcut_home(tmp_path, monkeypatch)
    (system/'MMS Harness.app').write_text('something else holds this name\n')
    made = inst.link_shortcuts(launcher)
    assert (home/'Applications/MMS Harness.app/Contents/MacOS/mms-harness').is_file()
    assert made == [home/'.local/bin/mms-harness', home/'Applications/MMS Harness.app']
