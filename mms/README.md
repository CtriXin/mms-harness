# MMS Harness

English | [中文](README.zh.md)

MMS Harness is CtriXin's fork of DeepSeek Harness. GitHub and the `upstream` remote retain the upstream relationship. MMS owns product decisions and migrates existing behavior; plugin interfaces are one implementation technique, not a restriction against source changes.

The first migration includes verified MMS model routes, isolated credentials, Recipe checks on actual requests, a persistent effort control, searchable models/channels with input focus, and project lookup with direct paths and explicit confirmation. See the [migration inventory](MIGRATION.md) for original PRs and remaining work. Runtime evidence belongs to Stride task b5f588a91c604408.

Upstream updates first land on an isolated branch and pass MMS interaction and real-request checks before release. Upstream retains MIT licensing. Code and capability metadata imported under `vendor/` retain Apache-2.0 from MMS commit c357f6ce737f4713c27bc8e9f229cc6e5c2480bb. User configuration and credentials are not copied into the repository.

## Build and install

Run `pnpm install --frozen-lockfile`, then `DSH_CLIENT_TITLE="MMS Harness" pnpm run build`. `python3 mms/install.py` accepts `--destination`, `--mms-root`, `--node`, and optional `--runtime-from`. It installs into a fresh directory and creates `MMS Harness.command`. The installer uses locked upstream dependencies and installs this fork's client packages and Web assets from one build into a dedicated runtime. It does not modify existing installations. Installation metadata records the fork commit and client artifact SHA-256 values.

Double-click the launcher to start or reuse the service and open its browser. `start/stop/status/open` manage only that instance; stopping retains sessions; `upgrade` / `rollback` upgrade and switch back. The default listener is local-only `127.0.0.1:3092`; phone access is off by default and turned on with `/remote on`. Current capabilities: [STATUS](STATUS.md) (Chinese).
