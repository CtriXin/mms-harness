#!/usr/bin/env python3
"""Checks that must pass after every upstream sync, before merging back to `mms`.

Offline checks cost no tokens. `--live` installs the current build into a
throwaway directory, sends a few real requests through the MMS routes, and
boots the Web UI on a random port. MMS configuration is only read.
See mms/SYNC-GATE.md for what each check proves and what it does not.
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ADAPTER = ROOT / 'mms/adapter'
REGISTRY = ROOT / 'mms/UPSTREAM-PATCHES.md'
LEAKY_ENV = ('MMS_CONFIG_ROOT', 'REAL_HOME', 'ORIGINAL_HOME', 'MMS_REAL_HOME', 'XDG_CONFIG_HOME')
FORK_TESTS = ['packages/client/ui-directory-picker-browse/tests', 'packages/client/ui-model-selection/tests',
              'packages/client/ui-sidebar/tests']
results: list[tuple[str, str, str]] = []


def record(check, status, detail=''):
    results.append((check, status, detail))
    print(f'[{status}] {check}' + (f' — {detail}' if detail else ''), flush=True)


def clean_env(node: Path):
    env = {k: v for k, v in os.environ.items() if k not in LEAKY_ENV}
    env['PATH'] = f'{node.parent}:{env.get("PATH", "")}'
    return env


def run(cmd, cwd=ROOT, env=None, timeout=900):
    return subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)


def upstream_base():
    for ref in ('upstream/master', 'upstream/main'):
        out = run(['git', 'merge-base', 'HEAD', ref])
        if out.returncode == 0:
            return out.stdout.strip()
    raise RuntimeError('No upstream remote; run `git fetch upstream` first')


def check_patch_registry():
    """Every upstream file we modify must be registered, so a sync starts from a known conflict list."""
    base = upstream_base()
    diff = run(['git', 'diff', '--name-status', base, 'HEAD', '--', '.', ':!mms'])
    modified = sorted(line.split('\t')[-1] for line in diff.stdout.splitlines() if line and line[0] in 'MRD')
    registered = set(re.findall(r'^\| `([^`]+)` \|', REGISTRY.read_text(), re.M)) if REGISTRY.exists() else set()
    missing = [f for f in modified if f not in registered]
    stale = sorted(registered - set(modified))
    if missing:
        record('O4 upstream patch registry', 'FAIL', f'{len(missing)} unregistered: ' + ', '.join(missing[:8]))
    else:
        record('O4 upstream patch registry', 'PASS', f'{len(modified)} modified upstream files, all registered'
               + (f'; {len(stale)} registry rows no longer modified: {", ".join(stale[:5])}' if stale else ''))


def offline(node: Path, build: bool, runtime_from: Path):
    env = clean_env(node)
    out = run([sys.executable, '-m', 'pytest', '-q', 'test_config.py'], cwd=ADAPTER, env=env)
    record('O1 adapter config (C01/C02)', 'PASS' if out.returncode == 0 else 'FAIL', out.stdout.strip().splitlines()[-1:][0] if out.stdout.strip() else out.stderr[-300:])
    # The plugin imports @deepseek-ai/dsh-llm: load the current source next to a
    # link to the pinned runtime's node_modules, never from the installed copy.
    with tempfile.TemporaryDirectory(prefix='mms-gate-plugin-') as tmp:
        os.symlink(runtime_from / 'node_modules', Path(tmp) / 'node_modules')
        shutil.copy2(ADAPTER / 'plugin.mjs', Path(tmp) / 'plugin.mjs')
        out = run([str(node), '--test', 'test_plugin.mjs', 'test_observe.mjs'], cwd=ADAPTER,
                  env={**env, 'MMS_DSH_TEST_PLUGIN': str(Path(tmp) / 'plugin.mjs')})
    tail = [l.strip('ℹ# ').strip() for l in out.stdout.splitlines() if re.match(r'^(ℹ|#) (pass|fail) ', l)]
    record('O2 adapter Recipe/observe (C03/C02)', 'PASS' if out.returncode == 0 else 'FAIL', ' '.join(tail) or out.stdout[-300:])
    out = run([str(node), '--test', 'test_remote.mjs'], cwd=ADAPTER, env=env)
    tail = [l.strip('ℹ# ').strip() for l in out.stdout.splitlines() if re.match(r'^(ℹ|#) (pass|fail) ', l)]
    record('O6 remote gateway, QR page, /remote (C07.01-.03)', 'PASS' if out.returncode == 0 else 'FAIL', ' '.join(tail) or out.stdout[-300:])
    out = run(['npx', '--no-install', 'vitest', 'run', *FORK_TESTS], env=env)
    tail = [l.strip() for l in (out.stdout + out.stderr).splitlines() if l.strip().startswith(('Test Files', 'Tests'))]
    record('O3 fork client packages (C14.01/.02, C12)', 'PASS' if out.returncode == 0 else 'FAIL', ' · '.join(tail))
    check_patch_registry()
    if build:
        out = run(['pnpm', 'run', 'build'], env={**env, 'DSH_CLIENT_TITLE': 'MMS Harness'}, timeout=3600)
        record('O5 build', 'PASS' if out.returncode == 0 else 'FAIL', (out.stdout + out.stderr)[-300:] if out.returncode else '')


class Instance:
    """A throwaway installation: its own runtime copy, credential store, settings and workspace."""

    def __init__(self, dest: Path, node: Path, mms_root: Path):
        self.dest, self.node = dest, node
        self.runtime, self.instance, self.workspace = dest / 'runtime', dest / 'instance', dest / 'workspace'
        self.workspace.mkdir(parents=True, exist_ok=True)
        self.routes = []
        out = run([sys.executable, str(ADAPTER / 'run.py'), '--instance', str(self.instance), '--mms-root', str(mms_root),
                   '--node', str(node), '--runtime', str(self.runtime), '--workspace', str(self.workspace), '--configure-only'],
                  cwd=ADAPTER, env=clean_env(node))
        if out.returncode:
            raise RuntimeError('configure failed: ' + out.stderr[-400:])
        self.routes = json.loads((self.instance / 'routes.json').read_text())['routes']
        self.credentials = self.instance / 'home/.credentials.yaml'
        self.pristine_credentials = self.credentials.read_text()

    def route(self, logical_model):
        return next(r for r in self.routes if r['logical_model'] == logical_model and r['rank'] == 0)

    def select(self, route, effort=None):
        # reasoningEffort is a settings-layer field in dsh; a config value is ignored.
        selection = {'provider': route['provider'], 'model': route['model']}
        if effort:
            selection['reasoningEffort'] = effort
        (self.instance / 'home/settings.yaml').write_text(json.dumps({'agent-default-model': selection}))
        self.credentials.write_text(self.pristine_credentials)

    def env(self):
        i = self.instance
        env = {k: os.environ[k] for k in ('LANG', 'LC_ALL', 'TMPDIR') if k in os.environ}
        env.update({'PATH': f'{self.node.parent}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin', 'HOME': str(i / 'user-home'),
                    'XDG_CONFIG_HOME': str(i / 'user-home/.config'), 'XDG_DATA_HOME': str(i / 'user-home/.local/share'),
                    'DSH_HOME': str(i / 'home'), 'DSH_TELEMETRY_DISABLED': '1',
                    'MMS_DSH_ROUTES': str(i / 'routes.json'), 'MMS_DSH_EVIDENCE': str(i / 'transport.jsonl')})
        return env

    def headless(self, *args, timeout=240):
        (self.instance / 'transport.jsonl').write_text('')
        cmd = [str(self.node), '--import', str(ADAPTER / 'observe.mjs'), str(self.runtime / 'node_modules/@deepseek-ai/dsh/lib/bin.js'),
               '--patch', str(self.instance / 'mms.patch.yml'), '--profile', 'headless', *args]
        out = run(cmd, cwd=self.workspace, env=self.env(), timeout=timeout)
        evidence = [json.loads(l) for l in (self.instance / 'transport.jsonl').read_text().splitlines() if l.strip()]
        return out, evidence


def ok_requests(evidence):
    return bool(evidence) and evidence[-1].get('status') == 200


def live(node: Path, mms_root: Path, runtime_from: Path, keep: bool):
    tmp = Path(tempfile.mkdtemp(prefix='mms-sync-gate-'))
    dest = tmp / 'install'
    try:
        out = run([sys.executable, str(ROOT / 'mms/install.py'), '--destination', str(dest), '--mms-root', str(mms_root),
                   '--node', str(node), '--runtime-from', str(runtime_from)], env=clean_env(node))
        if out.returncode:
            record('L0 install current build', 'FAIL', out.stderr[-400:])
            return
        record('L0 install current build', 'PASS', str(dest))
        inst = Instance(dest, node, mms_root)
        cwd = os.path.realpath(inst.workspace)

        flash = inst.route('deepseek-v4-flash')
        inst.select(flash)
        out, ev = inst.headless('用 bash 工具执行 pwd，然后只回复它的输出，不要别的文字。')
        got = out.stdout.strip().splitlines()[-1:] or ['']
        passed = out.returncode == 0 and os.path.realpath(got[0]) == cwd and ok_requests(ev)
        record('L1 C14.01 actual cwd', 'PASS' if passed else 'FAIL', f'pwd={got[0]!r} expected={cwd!r} requests={len(ev)}')

        gpt = inst.route('gpt-5.6-sol')
        inst.select(gpt, 'high')
        out, ev = inst.headless('只回复 OK')
        efforts = {e.get('reasoning_effort') for e in ev}
        passed = out.returncode == 0 and ok_requests(ev) and efforts == {'high'} and all(e['request_path'].endswith('/responses') for e in ev)
        record('L2 C12.02 effort reaches request', 'PASS' if passed else 'FAIL', f'efforts={sorted(map(str, efforts))} paths={sorted({e["request_path"] for e in ev})}')

        inst.select(flash)
        out, ev = inst.headless('--json', '记住暗号 GATE_SYNC_42。只回复 OK。')
        session = next((json.loads(l).get('sessionId') for l in out.stdout.splitlines() if '"sessionId"' in l), None)
        if session:
            out, ev = inst.headless('--session-id', session, '上一条消息里的暗号是什么？只回复暗号。')
        passed = bool(session) and 'GATE_SYNC_42' in out.stdout and ok_requests(ev)
        record('L3 C08.01 session resume', 'PASS' if passed else 'FAIL', f'session={bool(session)} reply={out.stdout.strip()[-40:]!r}')

        inst.select(gpt)
        store = json.loads(inst.credentials.read_text())
        store['refs'].pop(gpt['credential_ref'], None)
        inst.credentials.write_text(json.dumps(store))
        out, ev = inst.headless('只回复 OK')
        passed = out.returncode != 0 and 'MISSING_CREDENTIAL' in out.stderr and not ev
        record('L4 C01.02 credential fail-closed', 'PASS' if passed else 'FAIL', f'exit={out.returncode} requests={len(ev)}')
        inst.credentials.write_text(inst.pristine_credentials)

        record('L5 C13.03 stop kills background job, no wake', 'PENDING', 'mms stop package not built yet (UPSTREAM-DECISIONS 第 1 批)')

        web_smoke(inst)
    finally:
        if keep:
            print(f'kept: {tmp}')
        else:
            shutil.rmtree(tmp, ignore_errors=True)


def web_smoke(inst: Instance):
    """Client and pinned host must still talk: boot Web, load a fork-built client artifact by hash."""
    port = random.randint(61000, 62000)
    cmd = [str(inst.node), '--import', str(ADAPTER / 'observe.mjs'), str(inst.runtime / 'node_modules/@deepseek-ai/dsh/lib/bin.js'),
           '--patch', str(inst.instance / 'mms.patch.yml'), '--profile', 'web', '--no-open', '--port', str(port)]
    log = open(inst.dest / 'web.log', 'w')
    proc = subprocess.Popen(cmd, cwd=inst.workspace, env=inst.env(), stdout=log, stderr=subprocess.STDOUT)
    try:
        url = None
        for _ in range(90):
            time.sleep(1)
            m = re.search(rf'http://127\.0\.0\.1:{port}/\?token=\S+', (inst.dest / 'web.log').read_text())
            if m:
                url = m.group(0)
                break
            if proc.poll() is not None:
                break
        if not url:
            record('W1 Web boots with fork client', 'FAIL', 'no URL; see web.log: ' + (inst.dest / 'web.log').read_text()[-300:])
            return
        # The token URL answers 303 with an HttpOnly auth cookie; keep it across the redirect.
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
        try:
            html = opener.open(url, timeout=10).read().decode()
        except OSError as e:
            record('W1 Web boots with fork client', 'FAIL', f'port={port} {e}')
            return
        installed = json.loads((inst.dest / 'installation.json').read_text())
        title = re.search(r'<title>([^<]*)</title>', html)
        passed = bool(installed['client_artifacts']) and title is not None and 'MMS Harness' in title.group(1)
        record('W1 Web boots with fork client', 'PASS' if passed else 'FAIL',
               f'port={port} title={title.group(1) if title else None!r} artifacts={len(installed["client_artifacts"])}; UI 行为见 SYNC-GATE.md 手工项')
    finally:
        proc.terminate()  # only the PID this gate started
        try:
            proc.wait(timeout=15)
        except subprocess.TimeoutExpired:
            proc.kill()
        log.close()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--node', type=Path, default=Path(shutil.which('node') or 'node'))
    p.add_argument('--build', action='store_true', help='also run the full build (slow)')
    p.add_argument('--live', action='store_true', help='install into a temp dir and send real requests (costs tokens)')
    p.add_argument('--mms-root', type=Path, default=Path.home() / '.config/mms-next')
    p.add_argument('--runtime-from', type=Path, default=Path.home() / '.local/share/mms-harness/runtime',
                   help='pinned upstream runtime to copy; must match mms/adapter/package-lock.json')
    p.add_argument('--keep', action='store_true', help='keep the temp installation for debugging')
    args = p.parse_args()
    node = args.node.resolve()
    offline(node, args.build, args.runtime_from.expanduser().resolve())
    if args.live:
        live(node, args.mms_root.expanduser().resolve(), args.runtime_from.expanduser().resolve(), args.keep)
    failed = [r for r in results if r[1] == 'FAIL']
    pending = [r for r in results if r[1] == 'PENDING']
    print(f'\n{len(results) - len(failed) - len(pending)} pass · {len(failed)} fail · {len(pending)} pending')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
