#!/usr/bin/env python3
"""Manage only this installation's foreground-independent DSH process."""
import argparse
import fcntl
import http.cookiejar
import json
import os
import re
import secrets
import signal
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path


def identity(pid, config):
    try:
        command = subprocess.check_output(['/bin/ps','-p',str(pid),'-o','command='],text=True).strip()
        return str(Path(config['runtime'])/'node_modules/@deepseek-ai/dsh/lib/bin.js') in command and str(Path(config['instance'])/'mms.patch.yml') in command
    except subprocess.CalledProcessError:
        return False


def ready_url(log):
    if not log.exists():
        return None
    matches = re.findall(r'dsh web: (http://127\.0\.0\.1:\d+/\?token=[\w-]+)', log.read_text(errors='replace'))
    return matches[-1] if matches else None


# Remote access (C07): off by default. A separate gateway process (remote.mjs)
# is the only listener beyond loopback; DSH itself never leaves 127.0.0.1.
def remote_paths(root):
    return root/'remote', root/'remote'/'settings.json', root/'remote'/'token', root/'remote.pid', root/'remote.log'


def remote_settings(root, config):
    settings = remote_paths(root)[1]
    data = json.loads(settings.read_text()) if settings.exists() else {}
    return {'mode': data.get('mode', 'off'), 'port': int(data.get('port', int(config['port']) + 1)),
            'hostnames': list(data.get('hostnames', []))}


def write_token(path):
    fd = os.open(path, os.O_CREAT | os.O_WRONLY | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write(secrets.token_urlsafe(32) + '\n')


def save_remote(root, data):
    folder, settings, token, _, _ = remote_paths(root)
    folder.mkdir(mode=0o700, exist_ok=True)
    settings.write_text(json.dumps(data, ensure_ascii=False))
    if not token.exists():
        write_token(token)


def gateway_identity(pid, root):
    try:
        command = subprocess.check_output(['/bin/ps', '-p', str(pid), '-o', 'command='], text=True).strip()
        return str(root/'source/mms/adapter/remote.mjs') in command and f'--installation={root}' in command
    except subprocess.CalledProcessError:
        return False


def gateway_running(root):
    pidfile = remote_paths(root)[3]
    pid = int(pidfile.read_text()) if pidfile.exists() else 0
    return bool(pid and gateway_identity(pid, root))


def stop_gateway(root):
    pidfile = remote_paths(root)[3]
    pid = int(pidfile.read_text()) if pidfile.exists() else 0
    if pid and gateway_identity(pid, root):  # only the exact gateway this installation started
        os.kill(pid, signal.SIGTERM)
        for _ in range(50):
            if not gateway_identity(pid, root): break
            time.sleep(.1)
    pidfile.unlink(missing_ok=True)


def start_gateway(root, config, dsh_url):
    """(Re)start the gateway for this DSH process; DSH issues a new token on every start."""
    stop_gateway(root)
    _, settings_file, token, pidfile, log = remote_paths(root)
    if remote_settings(root, config)['mode'] == 'off':
        return
    upstream = re.match(r'(http://127\.0\.0\.1:\d+)/', dsh_url).group(1)
    # Secrets travel by env and file, never argv, so they stay out of `ps`.
    env = {k: os.environ[k] for k in ('LANG', 'LC_ALL', 'TMPDIR') if k in os.environ}
    env.update({'PATH': '/usr/bin:/bin', 'MMS_REMOTE_SETTINGS': str(settings_file), 'MMS_REMOTE_TOKEN_FILE': str(token),
                'MMS_REMOTE_UPSTREAM': upstream, 'MMS_REMOTE_UPSTREAM_START': dsh_url})
    fd = os.open(log, os.O_CREAT | os.O_WRONLY | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as stream:
        process = subprocess.Popen([config['node'], str(root/'source/mms/adapter/remote.mjs'), f'--installation={root}'],
                                   stdin=subprocess.DEVNULL, stdout=stream, stderr=stream, env=env, start_new_session=True)
    pidfile.write_text(str(process.pid))
    for _ in range(50):
        if 'listening' in log.read_text(errors='replace') or process.poll() is not None:
            break
        time.sleep(.1)
    if process.poll() is not None:
        raise SystemExit('远程网关启动失败，请检查 ' + str(log))


def lan_addresses():
    """Non-internal IPv4 addresses: the same set remote.mjs binds."""
    out = subprocess.run(['/sbin/ifconfig'], capture_output=True, text=True).stdout
    return sorted({a for a in re.findall(r'inet (\d+\.\d+\.\d+\.\d+)', out) if not a.startswith('127.')})


def remote_command(root, config, args, dsh_url):
    data = remote_settings(root, config)
    folder, _, token, _, _ = remote_paths(root)
    action = args.remote_action
    if action == 'on':
        data['mode'] = 'lan'; save_remote(root, data)
    elif action == 'off':
        data['mode'] = 'off'; save_remote(root, data); stop_gateway(root)
    elif action == 'rotate':
        folder.mkdir(mode=0o700, exist_ok=True); write_token(token)
        print('已更换访问口令：之前发出的链接和已登录的设备都会立即失效。')
    elif action in ('add-host', 'remove-host'):
        name = (args.value or '').strip().lower()
        if not re.fullmatch(r'(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+', name):
            raise SystemExit('只接受域名本身，例如 wide-lions.trycloudflare.com（不含 http:// 和端口）')
        hosts = set(data['hostnames'])
        hosts.add(name) if action == 'add-host' else hosts.discard(name)
        data['hostnames'] = sorted(hosts); save_remote(root, data)
    if action in ('on', 'add-host', 'remove-host') and dsh_url:
        start_gateway(root, config, dsh_url)
    data = remote_settings(root, config)
    print(f"远程访问：{'开启（局域网）' if data['mode'] == 'lan' else '关闭'}；网关{'运行中' if gateway_running(root) else '未运行'}；端口 {data['port']}")
    if data['mode'] != 'lan':
        return
    key = token.read_text().strip()
    for address in lan_addresses():
        print(f"  局域网：http://{address}:{data['port']}/?{'k'}={key}")
    for name in data['hostnames']:
        print(f"  隧道：https://{name}/?k={key}")
    print('  拿到这个链接的人可以在这台电脑上执行命令。只发给自己的设备；泄露后运行 remote rotate。')
    print(f"  外网使用：用 Tailscale 或 SSH 转发把本机 127.0.0.1:{data['port']} 接出去，再用 remote add-host 登记隧道域名。")
    if not dsh_url:
        print('  MMS Harness 未运行；启动后网关自动开启。')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('action',choices=['start','stop','status','open','remote'],nargs='?',default='open')
    parser.add_argument('remote_action',nargs='?',choices=['status','on','off','rotate','add-host','remove-host'],default='status')
    parser.add_argument('value',nargs='?')
    parser.add_argument('--installation',type=Path,required=True)
    args=parser.parse_args()
    root=args.installation.resolve();config=json.loads((root/'installation.json').read_text())
    log=root/'service.log';pidfile=root/'service.pid'
    with (root/'service.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        pid=int(pidfile.read_text()) if pidfile.exists() else 0
        running=bool(pid and identity(pid,config))
        if args.action=='remote':
            remote_command(root,config,args,ready_url(log) if running else None);return
        if args.action=='status':
            print(json.dumps({'running':running,'pid':pid if running else None,'url':ready_url(log) if running else None,
                              'remote':remote_settings(root,config)['mode'],'gateway':gateway_running(root)},ensure_ascii=False));return
        if args.action=='stop':
            stop_gateway(root)
            if running:
                os.kill(pid,signal.SIGTERM)
                for _ in range(100):
                    if not identity(pid,config):break
                    time.sleep(.1)
                if identity(pid,config):raise SystemExit('DSH is still stopping; process was not force-killed')
            pidfile.unlink(missing_ok=True);print('MMS Harness 已停止；会话和配置已保留。');return
        started=not running
        if not running:
            if log.exists():log.rename(root/'service.previous.log')
            command=[config['python'],str(root/'source/mms/adapter/run.py')]
            for key in ['instance','mms_root','node','runtime','workspace','model','port']:
                command.extend(['--'+key.replace('_','-'),str(config[key])])
            fd=os.open(log,os.O_CREAT|os.O_WRONLY|os.O_TRUNC,0o600)
            with os.fdopen(fd,'w') as stream:
                process=subprocess.Popen(command,stdin=subprocess.DEVNULL,stdout=stream,stderr=stream,start_new_session=True)
            pid=process.pid;pidfile.write_text(str(pid))
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        for _ in range(200):
            url=ready_url(log)
            if url and identity(pid,config):
                try:
                    with opener.open(url,timeout=1) as response:
                        if response.status==200:
                            if started or not gateway_running(root):start_gateway(root,config,url)
                            if args.action=='open':webbrowser.open(url)
                            print(url);return
                except OSError:pass
            time.sleep(.1)
        raise SystemExit('DSH 未就绪，请检查 '+str(log))

if __name__=='__main__':main()
