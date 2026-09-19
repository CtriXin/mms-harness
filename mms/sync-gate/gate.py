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
import uuid
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ADAPTER = ROOT / 'mms/adapter'
REGISTRY = ROOT / 'mms/UPSTREAM-PATCHES.md'
LEAKY_ENV = ('MMS_CONFIG_ROOT', 'REAL_HOME', 'ORIGINAL_HOME', 'MMS_REAL_HOME', 'XDG_CONFIG_HOME')
# The fork's UI overlay, plus the upstream packages whose cells and services it
# relies on (their own suites prove what the overlay builds on is unchanged).
FORK_TESTS = ['packages/client/ui-mms/tests', 'packages/client/ui-directory-picker-browse/tests',
              'packages/client/ui-model-selection/tests', 'packages/client/ui-sidebar/tests/']
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
    out = run([str(node), '--test', 'test_stop.mjs'], cwd=ADAPTER, env=env)
    tail = [l.strip('ℹ# ').strip() for l in out.stdout.splitlines() if re.match(r'^(ℹ|#) (pass|fail) ', l)]
    record('O7 stop kills owned jobs (C13.03)', 'PASS' if out.returncode == 0 else 'FAIL', ' '.join(tail) or out.stdout[-300:])
    out = run([str(node), '--test', 'test_plan.mjs'], cwd=ADAPTER, env=env)
    tail = [l.strip('ℹ# ').strip() for l in out.stdout.splitlines() if re.match(r'^(ℹ|#) (pass|fail) ', l)]
    record('O8 plan mode is read-only (C13.15)', 'PASS' if out.returncode == 0 else 'FAIL', ' '.join(tail) or out.stdout[-300:])
    out = run([str(node), '--test', 'test_btw.mjs'], cwd=ADAPTER, env=env)
    tail = [l.strip('ℹ# ').strip() for l in out.stdout.splitlines() if re.match(r'^(ℹ|#) (pass|fail) ', l)]
    record('O9 /btw side question (C13.06/.07)', 'PASS' if out.returncode == 0 else 'FAIL', ' '.join(tail) or out.stdout[-300:])
    out = run(['npx', '--no-install', 'vitest', 'run', *FORK_TESTS], env=env)
    tail = [l.strip() for l in (out.stdout + out.stderr).splitlines() if l.strip().startswith(('Test Files', 'Tests'))]
    record('O3 fork UI overlay ui-mms + overlaid upstream (C14.01/.02, C12, C15)', 'PASS' if out.returncode == 0 else 'FAIL', ' · '.join(tail))
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
        # A plugin whose injected service never appears stays pending silently
        # (mms-plan-readonly on `planMode`, 2026-09-19); the host prints it once at boot.
        pending = [l for l in (inst.dest / 'web.log').read_text().splitlines() if l.startswith('mms-') and 'pending' in l]
        record('W3 every MMS plugin activated', 'FAIL' if pending else 'PASS',
               '; '.join(l.split(' (')[0] + ': ' + l.rsplit(': ', 1)[-1] for l in pending) or 'no pending mms-* entry')
        if passed:
            overlay_check(opener, f'http://127.0.0.1:{port}', html)
            plan_check(inst, opener, f'http://127.0.0.1:{port}')
            btw_check(inst, opener, f'http://127.0.0.1:{port}')
            stop_check(inst, opener, f'http://127.0.0.1:{port}')
    finally:
        proc.terminate()  # only the PID this gate started
        try:
            proc.wait(timeout=15)
        except subprocess.TimeoutExpired:
            proc.kill()
        log.close()


def rpc(opener, base, method, request):
    """One Remote unary call, exactly as the browser sends it (POST /api/<method>)."""
    body = json.dumps({'type': 'client-request', 'rpcId': str(uuid.uuid4()), 'method': method,
                       'payload': {'args': {'request': request}}}).encode()
    req = urllib.request.Request(f'{base}/api/{method}', data=body, headers={'content-type': 'application/json', 'origin': base})
    result = json.loads(opener.open(req, timeout=30).read())['result']
    if not result.get('ok'):
        raise RuntimeError(f'{method}: {result.get("error")}')
    return result['value']


def command(opener, base, session, line):
    """Run one slash command the way the Web client does (commands/execute)."""
    body = json.dumps({'type': 'client-request', 'rpcId': str(uuid.uuid4()), 'method': 'commands/execute',
                       'payload': {'args': {'agentId': session, 'line': line, 'submittedAttachments': []}}}).encode()
    req = urllib.request.Request(f'{base}/api/commands/execute', data=body, headers={'content-type': 'application/json', 'origin': base})
    result = json.loads(opener.open(req, timeout=30).read())['result']
    if not result.get('ok'):
        raise RuntimeError(f'{line}: {result.get("error")}')
    return result['value']['result']


def settle(inst: Instance, since: float, quiet=10, limit=150):
    """Wait until the turn started after `since` made a request and then went quiet."""
    path = inst.instance / 'transport.jsonl'
    deadline, last, count = time.time() + limit, time.time(), -1
    while time.time() < deadline:
        lines = [json.loads(l) for l in path.read_text().splitlines() if l.strip()] if path.exists() else []
        mine = [e for e in lines if datetime.fromisoformat(e['timestamp'].replace('Z', '+00:00')).timestamp() > since]
        if len(mine) != count:
            count, last = len(mine), time.time()
        elif count > 0 and time.time() - last > quiet:
            return count
        time.sleep(1)
    return count


def session_events(inst: Instance, session: str):
    """Decode one session's log (multi-frame zstd JSONL) with the zstd CLI."""
    logs = list((inst.instance / 'home/sessions').glob(f'*/{session}/session.v3.jsonl.zstd'))
    if len(logs) != 1:
        raise RuntimeError(f'session log for {session}: found {len(logs)}')
    out = run(['zstd', '-dcq', '--', str(logs[0])])
    if out.returncode:
        raise RuntimeError('zstd failed (brew install zstd): ' + out.stderr[-200:])
    return [json.loads(l) for l in out.stdout.splitlines() if l.strip()]


def bash_outcomes(events, after_seq=-1):
    """(seq, isError, text) for every bash tool result after `after_seq`."""
    calls = {e['data']['callId'] for e in events if e['type'] == 'tool/call' and e['data'].get('name') == 'bash'}
    found = []
    for e in events:
        if e['type'] != 'tool/result' or e['seq'] <= after_seq:
            continue
        for block in e['data']['message']['content']:
            if block.get('type') == 'tool-result' and block.get('toolCallId') in calls:
                text = ' '.join(c.get('text', '') for c in block.get('content', []))
                found.append((e['seq'], bool(block.get('isError')), text))
    return found


def plan_check(inst: Instance, opener, base):
    """L6: in plan mode even an exploratory bash call is denied by the MMS rule; after /plan off it runs.

    Asking for a write proved nothing: the model obeys plan guidance and never
    calls the tool (mutation 2026-09-19). Exploration is what plan mode invites,
    so a denied `ls` is the discriminating observation.
    """
    check = 'L6 C13.15 plan mode is read-only, /plan off restores'
    ask = '计划阶段先摸清情况：立刻用 bash 工具执行 `ls -la` 看一下当前目录，然后用一句话说明你看到了什么。不要写任何文件。'
    try:
        session = rpc(opener, base, 'session/create', {'cwd': str(inst.workspace)})['sessionId']
        command(opener, base, session, '/plan')
        start = time.time()
        rpc(opener, base, 'session/prompt', {'requestId': str(uuid.uuid4()), 'sessionId': session, 'mode': 'queue',
                                             'content': [{'type': 'text', 'text': ask}]})
        settle(inst, start)
        in_plan = bash_outcomes(session_events(inst, session))
        mark = max((seq for seq, _, _ in in_plan), default=-1)
        off = command(opener, base, session, '/plan off')
        start = time.time()
        rpc(opener, base, 'session/prompt', {'requestId': str(uuid.uuid4()), 'sessionId': session, 'mode': 'queue',
                                             'content': [{'type': 'text', 'text': '已退出计划模式。再用 bash 执行一次 `ls -la`，只回复 OK。'}]})
        settle(inst, start)
        after = bash_outcomes(session_events(inst, session), mark)
        denied = bool(in_plan) and all(err and 'Plan mode is read-only' in text for _, err, text in in_plan)
        restored = any(not err for _, err, _ in after)
        record(check, 'PASS' if denied and restored else 'FAIL',
               f'bash_in_plan={len(in_plan)} all_denied_by_mms={denied} plan_off={off.get("text")!r} '
               f'bash_after_off={len(after)} ran_after_off={restored}'
               + ('' if in_plan else ' (model made no bash call in plan mode: inconclusive)'))
    except (OSError, RuntimeError, KeyError) as e:
        record(check, 'FAIL', str(e)[:300])


def btw_check(inst: Instance, opener, base):
    """L7: /btw answers from this session's context while the main task keeps running, and does not stop it."""
    check = 'L7 C13.06/.07 /btw answers mid-task, main task unaffected'
    secret = f'BTW_{uuid.uuid4().hex[:6].upper()}'
    marker = f'gate_btw_{uuid.uuid4().hex[:8]}'
    running = lambda: run(['pgrep', '-f', marker]).returncode == 0
    try:
        session = rpc(opener, base, 'session/create', {'cwd': str(inst.workspace)})['sessionId']
        start = time.time()
        rpc(opener, base, 'session/prompt', {'requestId': str(uuid.uuid4()), 'sessionId': session, 'mode': 'queue', 'content': [
            {'type': 'text', 'text': f'请记住暗号 {secret}。然后用 bash 在前台执行 `sleep 20 && touch {marker}.txt`，等它完成后只回复 OK。'}]})
        for _ in range(90):
            if running(): break
            time.sleep(1)
        else:
            record(check, 'FAIL', 'main task never started its command (no marker process in 90s)')
            return
        answer = command(opener, base, session, '/btw 我刚才让你记住的暗号是什么？只回答暗号。')
        busy_during_btw = running()
        # settle() would read the silent `sleep` as a finished turn; wait for the file itself.
        for _ in range(120):
            if (inst.workspace / f'{marker}.txt').exists(): break
            time.sleep(1)
        written = (inst.workspace / f'{marker}.txt').exists()
        text = answer.get('text', '')
        passed = answer.get('kind') == 'success' and secret in text and '回答模型' in text and busy_during_btw and written
        record(check, 'PASS' if passed else 'FAIL',
               f'kind={answer.get("kind")} knows_secret={secret in text} attributed={"回答模型" in text} '
               f'main_busy_during_btw={busy_during_btw} main_finished={written}')
    except (OSError, RuntimeError, KeyError) as e:
        record(check, 'FAIL', str(e)[:300])


def stop_check(inst: Instance, opener, base):
    """L5: Stop kills the model's background job and nothing wakes the session afterwards."""
    marker = f'gate_stop_{uuid.uuid4().hex[:8]}'
    running = lambda: run(['pgrep', '-f', marker]).returncode == 0
    try:
        session = rpc(opener, base, 'session/create', {'cwd': str(inst.workspace)})['sessionId']
        rpc(opener, base, 'session/prompt', {'requestId': str(uuid.uuid4()), 'sessionId': session, 'mode': 'queue', 'content': [
            {'type': 'text', 'text': f'用 bash 在后台启动任务：sleep 25 && echo DONE > {marker}.txt ，然后用 job_output wait:true 等它完成，再告诉我结果。'}]})
        for _ in range(90):
            if running(): break
            time.sleep(1)
        else:
            record('L5 C13.03 stop kills background job, no wake', 'FAIL', 'model never started the background job (no marker process in 90s)')
            return
        time.sleep(3)
        rpc(opener, base, 'session/cancel', {'sessionId': session})
        stopped = time.time()
        time.sleep(35)  # past the job's 25 s deadline plus any wake-up turn
        evidence = [json.loads(l) for l in (inst.instance / 'transport.jsonl').read_text().splitlines() if l.strip()]
        after = [e for e in evidence if e.get('status') == 200
                 and datetime.fromisoformat(e['timestamp'].replace('Z', '+00:00')).timestamp() > stopped + 2]
        written = (inst.workspace / f'{marker}.txt').exists()
        passed = not written and not running() and not after
        record('L5 C13.03 stop kills background job, no wake', 'PASS' if passed else 'FAIL',
               f'marker_written={written} job_alive={running()} requests_after_stop={len(after)}')
    except (OSError, RuntimeError, KeyError) as e:
        record('L5 C13.03 stop kills background job, no wake', 'FAIL', str(e)[:300])


def overlay_check(opener, base, html):
    """The host must serve the fork's overlay row; otherwise every cell silently falls back to upstream."""
    # The page loads each row through the combo route with a content revision.
    m = re.search(r'/plugins/\?\?@deepseek-ai/dsh-client-ui-mms/client\.js&(?:amp;)?rev=[\w-]+', html)
    if not m:
        record('W2 fork UI overlay served (ui-mms)', 'FAIL', 'page does not load @deepseek-ai/dsh-client-ui-mms')
        return
    try:
        body = opener.open(base + m.group(0).replace('&amp;', '&'), timeout=10).read().decode()
    except OSError as e:
        record('W2 fork UI overlay served (ui-mms)', 'FAIL', str(e)[:300])
        return
    cells = ['sidebar.brand.name', 'conversation.input.model', 'conversation.hero.workspace.directoryFlow']
    missing = [c for c in cells if c not in body]
    record('W2 fork UI overlay served (ui-mms)', 'FAIL' if missing else 'PASS',
           f'{len(body)} bytes' + (f'; missing {missing}' if missing else '; 覆盖是否生效见 SYNC-GATE.md 手工项'))


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
