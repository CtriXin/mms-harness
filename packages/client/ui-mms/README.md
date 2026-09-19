---
description: "MMS Harness presentation overlay: the product name, a searchable model seat with a direct effort control, and a project-first folder dialog, layered over upstream DSH without editing it."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-mms

English | [中文](README.zh.md)

## Summary

MMS Harness changes three upstream surfaces. Instead of editing those packages in place, this package registers its own occupant for each slot cell at priority `-10`. The lowest priority renders, so upstream's occupant stays loaded underneath. Upstream packages stay byte-identical, which keeps weekly upstream syncs free of merge conflicts. If this package fails or is removed, each cell falls back to upstream on its own.

This package is fork-only and never published (`"private": true`). The `@deepseek-ai/dsh-client-` prefix only satisfies the workspace tooling.

## What it changes

| Cell | Upstream | MMS Harness |
|---|---|---|
| `sidebar.brand.name` | "DSH Local Build" + build badge | "MMS Harness" + the same build badge |
| `conversation.input.model` | one trigger: model + effort; effort is two clicks away | model trigger plus a separate effort trigger that opens the levels directly; the model pane has a search field (names, ids, channels) that takes focus on entry |
| `conversation.hero.workspace.directoryFlow`, `sidebar.workspaces.directoryFlow` | "Select Workspace Directory" folder browser | "Find your project": search the Host's existing projects by title or path, or type a path and press Enter; browsing never adopts a directory until Open |

The model seat reads and writes the same per-session `ctx.modelDirectories` directory that `ui-model-selection` owns, so `/model` and the seat keep showing one shared state. The dialog drives `ctx.uiWorkspace`, the same list/create calls upstream uses.

## How it is loaded

The package is outside dsh's dependency closure, so the patch row names its file:

```yaml
- insert:
    - id: mms-ui
      name: <runtime>/node_modules/@deepseek-ai/dsh-client-ui-mms/lib/index.js
```

The host takes the client manifest from the nearest `package.json`, the same way it resolves any path-named row. `mms/install.py` places the built package there, and `mms/adapter/run.py` adds the row only when the file exists. A bare package name here would fail at boot with `ERR_MODULE_NOT_FOUND`.

## Keeping it in sync with upstream

`ModelSelect.tsx` and `DirectoryBrowser.tsx` are copies of the upstream components with the MMS changes applied, and their specs are the upstream specs plus the MMS cases. When an upstream sync changes either original, compare it with the copy and carry over what applies. In `mms/sync-gate/gate.py`:
- O3 runs this package's tests alongside the untouched upstream suites.
- W2 checks that the host serves the overlay.
- The manual UI items in `mms/SYNC-GATE.md` check that it actually wins each cell.

The model seat's scope must inject every service `ModelDirectoryResolver` injects (`remote`, `remote.session`), because resolver methods run behind cordis's caller tracker. A test pins this; without it the seat crashes at render and silently falls back to upstream.

## Model Experience

Nothing here is model-visible. The effort chosen in the seat reaches requests through upstream's `session.selectModel`; `mms/sync-gate` L2 checks the effort on the wire.
