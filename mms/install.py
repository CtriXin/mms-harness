#!/usr/bin/env python3
"""Install the fork's built UI with its exact upstream runtime and MMS adapter."""
import argparse
import hashlib
import json
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'mms/adapter'))
from config import DSH_VERSION, private_json


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--destination', type=Path, required=True)
    parser.add_argument('--mms-root', type=Path, required=True)
    parser.add_argument('--node', type=Path, required=True)
    parser.add_argument('--runtime-from', type=Path)
    parser.add_argument('--port', type=int, default=3092)
    args = parser.parse_args()
    root = args.destination.expanduser().resolve()
    protected = [args.mms_root.expanduser().resolve(), *[(Path.home()/'.config'/n).resolve() for n in ('mms', 'mms-next')]]
    if any(root == p or p in root.parents for p in protected):
        parser.error('Installation cannot write MMS configuration')
    if root.exists():
        parser.error('Destination exists; choose a fresh directory to preserve the previous installation')
    packages = ['ui-model-selection', 'ui-directory-picker-browse']
    for name in packages:
        if not (ROOT/'packages/client'/name/'lib/client.js').is_file():
            parser.error('Build the fork first: missing '+name)
    if not (ROOT/'apps/web/dist/index.html').is_file():
        parser.error('Build the fork Web assets first')
    node = args.node.expanduser().resolve()
    version = subprocess.check_output([str(node), '-p', 'process.versions.node'], text=True).strip()
    if tuple(map(int, version.split('.')[:2])) < (24, 2):
        parser.error('Node >=24.2 required')
    root.mkdir(parents=True, mode=0o700)
    shutil.copytree(ROOT/'mms', root/'source/mms', ignore=shutil.ignore_patterns('__pycache__', '.pytest_cache', 'node_modules'))
    runtime = root/'runtime'
    if args.runtime_from:
        original = args.runtime_from.resolve()
        package = json.loads((original/'node_modules/@deepseek-ai/dsh/package.json').read_text())
        expected = json.loads((ROOT/'mms/adapter/package-lock.json').read_text())
        if package['version'] != DSH_VERSION or json.loads((original/'package-lock.json').read_text()) != expected:
            parser.error('Runtime version or dependency lock differs from the pinned upstream')
        shutil.copytree(original, runtime, symlinks=True, ignore=shutil.ignore_patterns('mms-plugin', '*.tgz'))
    else:
        runtime.mkdir()
        for name in ['package.json', 'package-lock.json']:
            shutil.copy2(ROOT/'mms/adapter'/name, runtime/name)
        subprocess.run([str(node), str((node.parent/'npm').resolve()), 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], cwd=runtime, check=True)
    artifacts = {}
    # All client faces share this build's title/profile/commit, including the
    # layout and brand owners; mixing official npm faces would restore DSH's title.
    for package_path in sorted((ROOT/'packages').glob('*/*/package.json')):
        package = json.loads(package_path.read_text())
        destination = runtime/'node_modules'/package['name']/'lib'
        if not destination.is_dir():
            continue
        for artifact in sorted((package_path.parent/'lib').glob('client*.js*')):
            shutil.copy2(artifact, destination/artifact.name)
            artifacts[package['name']+'/'+artifact.name] = hashlib.sha256(artifact.read_bytes()).hexdigest()
    shutil.copytree(ROOT/'apps/web/dist', runtime/'node_modules/@deepseek-ai/dsh-web-frontend/dist', dirs_exist_ok=True)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    private_json(root/'installation.json', {
        'schema': 'mms.harness.installation.v1', 'dsh_version': DSH_VERSION,
        'fork': 'CtriXin/mms-harness', 'source_commit': commit, 'client_artifacts': artifacts,
        'python': sys.executable, 'node': str(node), 'runtime': str(runtime),
        'instance': str(root/'instance'), 'mms_root': str(args.mms_root.expanduser().resolve()),
        'workspace': str(root/'workspace'), 'model': 'deepseek-v4-flash', 'port': args.port,
    })
    launcher = root/'MMS Harness.command'
    launcher.write_text('#!/bin/sh\nexec '+shlex.join([sys.executable, str(root/'source/mms/adapter/service.py'), '--installation', str(root)])+' "$@"\n')
    launcher.chmod(0o700)
    print(launcher)


if __name__ == '__main__':
    main()
