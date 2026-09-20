#!/usr/bin/env python3
"""Install the fork's built UI with its exact upstream runtime and MMS adapter."""
import argparse
import hashlib
import json
import os
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
    parser.add_argument('--shortcuts', action='store_true',
                        help='also link `mms-harness` onto PATH and the launcher into ~/Applications')
    args = parser.parse_args()
    root = args.destination.expanduser().resolve()
    protected = [args.mms_root.expanduser().resolve(), *[(Path.home()/'.config'/n).resolve() for n in ('mms', 'mms-next')]]
    if any(root == p or p in root.parents for p in protected):
        parser.error('Installation cannot write MMS configuration')
    if root.exists():
        parser.error('Destination exists; choose a fresh directory to preserve the previous installation')
    packages = ['ui-mms']
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
        # Fork-only client packages (never published) are added beside the
        # upstream ones; anything else absent from the runtime is skipped.
        fork_only = bool(package.get('private') and 'client' in package.get('dsh', {}))
        if not destination.is_dir():
            if not fork_only:
                continue
            destination.mkdir(parents=True)
        if fork_only:
            # The node half ships with this build too. Refreshing only
            # `client*.js` left a STALE host half behind whenever the runtime
            # was copied from an existing installation (`--runtime-from`),
            # because the destination already existed: a fork package that
            # grows host-side behavior would silently keep the old one.
            shutil.copy2(package_path, destination.parent/'package.json')
            for face in ('index.js', 'typert.host.js', 'typert.remote-client.js'):
                source = package_path.parent/'lib'/face
                if source.is_file():
                    shutil.copy2(source, destination/face)
                    artifacts[package['name']+'/'+face] = hashlib.sha256(source.read_bytes()).hexdigest()
        for artifact in sorted((package_path.parent/'lib').glob('client*.js*')):
            shutil.copy2(artifact, destination/artifact.name)
            artifacts[package['name']+'/'+artifact.name] = hashlib.sha256(artifact.read_bytes()).hexdigest()
    shutil.copytree(ROOT/'apps/web/dist', runtime/'node_modules/@deepseek-ai/dsh-web-frontend/dist', dirs_exist_ok=True)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    private_json(root/'installation.json', {
        'schema': 'mms.harness.installation.v1', 'dsh_version': DSH_VERSION,
        'fork': 'CtriXin/mms-harness', 'source_commit': commit, 'source_repo': str(ROOT), 'client_artifacts': artifacts,
        'python': sys.executable, 'node': str(node), 'runtime': str(runtime),
        'instance': str(root/'instance'), 'mms_root': str(args.mms_root.expanduser().resolve()),
        'workspace': str(root/'workspace'), 'model': 'deepseek-v4-flash', 'port': args.port,
    })
    launcher = root/'MMS Harness.command'
    launcher.write_text('#!/bin/sh\nexec '+shlex.join([sys.executable, str(root/'source/mms/adapter/service.py'), '--installation', str(root)])+' "$@"\n')
    launcher.chmod(0o700)
    print(launcher)
    if args.shortcuts:
        for link in link_shortcuts(launcher):
            print(link)


def link_shortcuts(launcher: Path):
    """Put the launcher where the operator will actually look for it.

    Three answers to two different questions. `mms-harness` on PATH takes the
    subcommands (`start`, `stop`, `status`, `remote`, `upgrade`). The bundle in
    `/Applications` is what a double-click, Spotlight or Launchpad opens; it
    can carry no arguments, so it can only ever mean `open`. A plain `.command`
    would not do: Launchpad and Spotlight list application bundles, and a
    `~/Applications` copy is a different folder from the `/Applications` the
    Finder sidebar shows — which is exactly how the last one went unfound.

    Off unless asked for, and `upgrade.py` never asks: it installs into a
    STAGING directory that is renamed away on cutover, so anything pointing
    there would dangle. The installation root does not move between upgrades,
    so shortcuts made once at install time keep working.

    A path already held by something that is not ours is left alone, and none
    of this is worth failing an otherwise complete installation over.
    """
    made = []
    command = Path.home()/'.local/bin'/'mms-harness'
    try:
        command.parent.mkdir(parents=True, exist_ok=True)
        if command.is_symlink():
            command.unlink()
        if command.exists():
            print(f'left alone (not a link): {command}', file=sys.stderr)
        else:
            command.symlink_to(launcher)
            made.append(command)
    except OSError as error:
        print(f'could not link {command}: {error}', file=sys.stderr)
    # `/Applications` is admin-writable for the installing user on a normal
    # macOS setup; `~/Applications` is the fallback, not the first choice.
    for folder in (SYSTEM_APPLICATIONS, Path.home()/'Applications'):
        if not os.access(folder, os.W_OK):
            continue
        try:
            made.append(write_app_bundle(folder/'MMS Harness.app', launcher))
        except OSError as error:
            print(f'could not write {folder}/MMS Harness.app: {error}', file=sys.stderr)
            continue
        break
    return made


def write_app_bundle(bundle: Path, launcher: Path) -> Path:
    """Write a minimal double-click bundle that opens this installation."""
    binary = bundle/'Contents/MacOS/mms-harness'
    binary.parent.mkdir(parents=True, exist_ok=True)
    (bundle/'Contents/Info.plist').write_text(PLIST)
    binary.write_text('#!/bin/sh\n# Opens this MMS Harness installation, starting the service if needed.\n'
                      'exec ' + shlex.join([str(launcher), 'open']) + '\n')
    binary.chmod(0o755)
    # Without this the bundle stays absent from Spotlight and Launchpad until
    # some later rescan notices it. Absent off macOS, where the bundle is
    # written anyway rather than reported as a failure the caller would retry.
    if Path(LSREGISTER).exists():
        subprocess.run([LSREGISTER, '-f', str(bundle)], check=False,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return bundle


SYSTEM_APPLICATIONS = Path('/Applications')

LSREGISTER = ('/System/Library/Frameworks/CoreServices.framework/Frameworks'
              '/LaunchServices.framework/Support/lsregister')

PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>MMS Harness</string>
  <key>CFBundleDisplayName</key><string>MMS Harness</string>
  <key>CFBundleIdentifier</key><string>com.ctrixin.mms-harness.launcher</string>
  <key>CFBundleExecutable</key><string>mms-harness</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
"""


if __name__ == '__main__':
    main()
