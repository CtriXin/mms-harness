#!/usr/bin/env python3
"""Upgrade or roll back one MMS Harness installation (C11.01-.07, C07.07).

    upgrade.py --installation ROOT --check          # what would change
    upgrade.py --installation ROOT [--no-build] [--yes]
    upgrade.py --installation ROOT --rollback [--yes]

Upgrade: (optionally pull and build the fork checkout) -> refuse artifacts that
were not built from this checkout's code -> install into a staging directory
-> boot the staging copy on a spare port with a COPY of the sessions and check
it is really ready -> only then stop the running service, keep the old
directory as `<root>-before-<commit>`, move staging into place, bring the
sessions, workspace and remote-access token along, and start on the original
port. If that start is not ready, the old installation is put back and
started. Rollback swaps the newest backup back in, carrying the current
sessions with it.

Probes talk only to 127.0.0.1, bypass environment proxies and refuse
redirects to any other host, so the instance token never leaves the machine.
"""
from __future__ import annotations

import argparse
import http.cookiejar
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
RECORD = '.dsh-build/client-build-environment.json'
CARRIED = ('instance', 'workspace', 'remote')  # user data that moves with every swap


class LoopbackOnlyRedirects(urllib.request.HTTPRedirectHandler):
    """The token URL answers 303 to itself; any other destination is refused."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urllib.parse.urlsplit(newurl).hostname != '127.0.0.1':
            raise urllib.error.HTTPError(newurl, code, 'redirect away from 127.0.0.1 refused', headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def opener():
    return urllib.request.build_opener(urllib.request.ProxyHandler({}), LoopbackOnlyRedirects(),
                                       urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()


def build_matches(repo: Path) -> tuple[bool, str]:
    """Artifacts count only if built from this checkout's code (mms/ is copied as source, not built)."""
    record_path = repo / RECORD
    if not record_path.is_file():
        return False, '没有构建记录：先在源码目录运行 pnpm run build'
    env = json.loads(record_path.read_text())['environment']
    built = env.get('DSH_CLIENT_COMMIT_HASH')
    if not built:
        return False, '构建记录里没有 commit'
    if env.get('DSH_CLIENT_GIT_DIRTY') == 'true':
        return False, f'产物是从有未提交改动的源码构建的（{built}-dirty）'
    if env.get('DSH_CLIENT_TITLE') != 'MMS Harness':
        return False, '产物不是用 DSH_CLIENT_TITLE="MMS Harness" 构建的'
    if subprocess.run(['git', '-C', str(repo), 'diff', '--quiet', built, 'HEAD', '--', '.', ':!mms']).returncode:
        return False, f'产物构建于 {built}，之后 mms/ 以外的代码又改过：需要重新构建'
    if git(repo, 'status', '--porcelain', '--untracked-files=no', '--', '.', ':!mms'):
        return False, '源码目录有未提交的改动'
    return True, f'产物构建于 {built}，与当前代码一致'


def ensure_built(repo: Path, node: str, build: bool) -> None:
    ok, why = build_matches(repo)
    if ok or not build:
        if not ok:
            raise SystemExit('拒绝升级：' + why)
        return
    print('重新构建（约 5–10 分钟）…', flush=True)
    env = {**os.environ, 'PATH': f'{Path(node).parent}:{os.environ.get("PATH", "")}', 'DSH_CLIENT_TITLE': 'MMS Harness'}
    for command in (['pnpm', 'install', '--frozen-lockfile'], ['pnpm', 'run', 'build']):
        if subprocess.run(command, cwd=repo, env=env).returncode:
            raise SystemExit('构建失败：' + ' '.join(command) + '；当前安装没有任何改动。')
    ok, why = build_matches(repo)
    if not ok:
        raise SystemExit('构建后仍不一致：' + why)


def free_port() -> int:
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def launcher(root: Path, *args: str, timeout=240) -> subprocess.CompletedProcess:
    config = json.loads((root / 'installation.json').read_text())
    return subprocess.run([config['python'], str(root / 'source/mms/adapter/service.py'), *args, f'--installation={root}'],
                          capture_output=True, text=True, timeout=timeout)


def ready(root: Path) -> tuple[bool, str]:
    """Started, page served with the fork title, every mms-* plugin active, ui-mms served."""
    out = launcher(root, 'start')
    url = out.stdout.strip().splitlines()[-1] if out.returncode == 0 and out.stdout.strip() else ''
    if not url.startswith('http://127.0.0.1:'):
        return False, '服务没有就绪：' + (out.stderr or out.stdout)[-300:].replace('\n', ' ')
    base = url.split('/?')[0]
    session = opener()
    try:
        html = session.open(url, timeout=15).read().decode()
    except OSError as e:
        return False, f'页面打不开：{e}'
    if '<title>MMS Harness</title>' not in html:
        return False, '页面标题不是 MMS Harness（前端产物不对）'
    log = (root / 'service.log').read_text(errors='replace')
    pending = [line.split(' (')[0] for line in log.splitlines() if line.startswith('mms-') and 'pending' in line]
    if pending:
        return False, '这些插件没有启动：' + ', '.join(pending)
    overlay = re.search(r'/plugins/\?\?@deepseek-ai/dsh-client-ui-mms/client\.js&(?:amp;)?rev=[\w-]+', html)
    if not overlay:
        return False, '页面没有加载 ui-mms'
    try:
        session.open(base + overlay.group(0).replace('&amp;', '&'), timeout=15).read()
    except OSError as e:
        return False, f'ui-mms 取不到：{e}'
    return True, base


def relocate(root: Path, old: Path, port: int) -> None:
    """Point installation.json and the launcher at `root` (install.py wrote paths for `old`)."""
    path = root / 'installation.json'
    config = json.loads(path.read_text())
    for key in ('runtime', 'instance', 'workspace'):
        value = Path(config[key])
        if value == old or old in value.parents:
            config[key] = str(root / value.relative_to(old))
    config['port'] = port
    temporary = path.with_suffix('.tmp')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
        f.write('\n')
    temporary.replace(path)
    command = root / 'MMS Harness.command'
    command.write_text(command.read_text().replace(str(old), str(root)))


def carry(source: Path, target: Path) -> None:
    """Copy the user's data from one installation into another, replacing the target's copy."""
    for name in CARRIED:
        if (target / name).exists():
            shutil.rmtree(target / name)
        if (source / name).exists():
            shutil.copytree(source / name, target / name, symlinks=True)


def backups(root: Path) -> list[Path]:
    found = [p for p in root.parent.glob(root.name + '-before-*') if (p / 'installation.json').is_file()]
    return sorted(found, key=lambda p: p.stat().st_mtime, reverse=True)


def confirm(lines: list[str], assume_yes: bool) -> None:
    print('\n'.join(lines))
    if assume_yes:
        return
    if input('继续吗？输入 y 确认，其他任何输入取消：').strip().lower() != 'y':
        raise SystemExit('已取消；当前安装没有任何改动。')


def swap_in(root: Path, candidate: Path, backup: Path, port: int) -> tuple[bool, str]:
    """Stop root, keep it as `backup`, move candidate in, carry data, start. Restore on failure."""
    stopped = launcher(root, 'stop')
    if stopped.returncode:
        raise SystemExit('当前服务停不下来，已放弃切换：' + stopped.stderr[-300:])
    root.rename(backup)
    candidate.rename(root)
    relocate(root, candidate, port)
    carry(backup, root)
    ok, detail = ready(root)
    if ok:
        return True, detail
    launcher(root, 'stop')
    failed = root.parent / (root.name + '-failed-' + time.strftime('%Y%m%d%H%M%S'))
    root.rename(failed)
    backup.rename(root)
    restored, restored_detail = ready(root)
    return False, (f'新版本没有就绪（{detail}），已恢复原安装'
                   + ('并重新启动' if restored else f'，但原安装也没能启动：{restored_detail}')
                   + f'。失败的新版本留在 {failed}')


def upgrade(root: Path, repo: Path, build: bool, assume_yes: bool, check_only: bool) -> None:
    config = json.loads((root / 'installation.json').read_text())
    installed = config['source_commit']
    if build:
        git(repo, 'fetch', '--quiet', 'origin')
    head = git(repo, 'rev-parse', 'HEAD')
    tracked = subprocess.run(['git', '-C', str(repo), 'rev-parse', '--verify', '--quiet', '@{upstream}'],
                             capture_output=True, text=True).stdout.strip()
    upstream = tracked if build and tracked else head
    ok, why = build_matches(repo)
    print(f'已安装：{installed[:10]}　源码：{head[:10]}（{repo}）' + (f'　远端：{upstream[:10]}' if upstream != head else ''))
    print('构建：' + why)
    if check_only:
        print('有新版本可装。' if upstream != installed or head != installed else '已经是最新。')
        return
    if build and upstream != head:
        if git(repo, 'status', '--porcelain', '--untracked-files=no'):
            raise SystemExit('源码目录有未提交改动，不能拉取远端；当前安装没有任何改动。')
        subprocess.run(['git', '-C', str(repo), 'pull', '--ff-only', '--quiet'], check=True)
        head = git(repo, 'rev-parse', 'HEAD')
    if head == installed:
        print('已经是最新，不需要升级。')
        return
    ensure_built(repo, config['node'], build)
    changes = git(repo, 'log', '--oneline', '--no-decorate', f'{installed}..{head}') if subprocess.run(
        ['git', '-C', str(repo), 'cat-file', '-e', installed + '^{commit}'], capture_output=True).returncode == 0 else '（本地没有已安装版本的 commit，无法列出改动）'
    confirm([f'将把 {root} 从 {installed[:10]} 升级到 {head[:10]}：', changes,
             '影响：服务会停止约半分钟，正在运行的任务会中断；会话、设置、工作区和远程访问口令会保留，端口不变。',
             f'原安装保留为 {root.name}-before-{head[:10]}，出问题可以运行 rollback 换回。'], assume_yes)
    staging = root.parent / f'.{root.name}-staging-{head[:10]}-{int(time.time())}'
    install = [config['python'], str(repo / 'mms/install.py'), '--destination', str(staging), '--mms-root', config['mms_root'],
               '--node', config['node'], '--port', str(free_port()), '--runtime-from', config['runtime']]
    out = subprocess.run(install, capture_output=True, text=True)
    if out.returncode and 'differs from the pinned upstream' in out.stderr:
        out = subprocess.run(install[:-2], capture_output=True, text=True)  # new host version: fresh npm ci
    if out.returncode:
        raise SystemExit('新版本安装失败，当前安装没有任何改动：' + out.stderr[-400:])
    # Probe with a copy of the real sessions, on a spare port, while the old service keeps running.
    carry(root, staging)
    if (staging / 'remote').exists():
        shutil.rmtree(staging / 'remote')  # no second gateway on the user's remote port during the probe
    ok, detail = ready(staging)
    launcher(staging, 'stop')
    if not ok:
        raise SystemExit(f'新版本预检没有通过（{detail}）；当前安装没有任何改动。预检目录：{staging}')
    for name in ('service.log', 'service.previous.log', 'service.pid'):
        (staging / name).unlink(missing_ok=True)
    # The probe's copy is stale by cutover time: the swap copies the data again after the service stops.
    for name in CARRIED:
        if (staging / name).exists():
            shutil.rmtree(staging / name)
    backup = root.parent / f'{root.name}-before-{head[:10]}'
    if backup.exists():
        backup = backup.with_name(backup.name + '-' + time.strftime('%Y%m%d%H%M%S'))
    ok, detail = swap_in(root, staging, backup, int(config['port']))
    if not ok:
        raise SystemExit(detail)
    print(f'升级完成：{head[:10]} 已在 {detail} 运行。原安装在 {backup}。')


def rollback(root: Path, assume_yes: bool) -> None:
    candidates = backups(root)
    if not candidates:
        raise SystemExit('没有可以换回的备份（' + root.name + '-before-*）。')
    target = candidates[0]
    current = json.loads((root / 'installation.json').read_text())
    previous = json.loads((target / 'installation.json').read_text())
    confirm([f'将把 {root} 从 {current["source_commit"][:10]} 换回 {previous["source_commit"][:10]}（{target.name}）。',
             '影响：服务会停止约半分钟；当前的会话、设置、工作区和远程访问口令会一起带过去，端口不变。',
             f'现在这个版本保留为 {root.name}-rolledback-{current["source_commit"][:10]}。'], assume_yes)
    keep = root.parent / f'{root.name}-rolledback-{current["source_commit"][:10]}'
    if keep.exists():
        keep = keep.with_name(keep.name + '-' + time.strftime('%Y%m%d%H%M%S'))
    # The backup already lives at root's sibling path; it takes root's name, so its paths are root-relative
    # only after relocate (install.py wrote them for root originally, so this is a no-op then).
    ok, detail = swap_in(root, target, keep, int(current['port']))
    if not ok:
        raise SystemExit(detail)
    print(f'已换回 {previous["source_commit"][:10]}，在 {detail} 运行。刚才的版本在 {keep}。')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--installation', type=Path, required=True)
    parser.add_argument('--from', dest='repo', type=Path, help='fork checkout to install from (default: the one this installation was built from)')
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--rollback', action='store_true')
    parser.add_argument('--no-build', action='store_true', help='do not fetch, pull or build; use the checkout as it is')
    parser.add_argument('--yes', action='store_true')
    args = parser.parse_args()
    root = args.installation.expanduser().resolve()
    config = json.loads((root / 'installation.json').read_text())
    if args.rollback:
        rollback(root, args.yes)
        return
    repo = (args.repo or Path(config.get('source_repo') or HERE.parents[1])).expanduser().resolve()
    if not (repo / 'mms/install.py').is_file() or not (repo / '.git').exists():
        raise SystemExit(f'{repo} 不是 MMS Harness 源码目录；用 --from 指定')
    upgrade(root, repo, not args.no_build, args.yes, args.check)


if __name__ == '__main__':
    main()
