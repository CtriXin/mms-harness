"""Upgrade guards that the live L8 run cannot reach cheaply (C11.01, C11.06, C11.07)."""
import json
import subprocess
import urllib.error
import urllib.request

import pytest

import upgrade as up


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
