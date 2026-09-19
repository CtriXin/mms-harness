# 上游文件就地修改登记

这是 `HANDOFF.md` 第三节要求的「已知会冲突清单」。

- `mms/sync-gate/gate.py` 的 O4 会检查：只要改到上游文件却没在这里登记，gate 就失败。
- 同步上游撞上冲突时，先看「冲突时怎么办」这一列。

首次登记于 2026-09-18，当时共 25 处。2026-09-19 起，界面相关的改动已挪进自有包 `packages/client/ui-mms`：它用 slot 优先级 `-10` 覆盖上游的组件，上游原来的组件仍然加载在下面。原来改过的 20 个上游文件，包括共享的 locale、`ui-model-selection`、`ui-directory-picker-browse`、sidebar 测试和快照，都已还原为上游原版，见 `packages/client/ui-mms/README.zh.md`。

剩下的 7 处都是上游没有扩展点、必须保留的改动：

| 文件 | 能力项 | 为什么改 | 状态 | 冲突时怎么办 |
|---|---|---|---|---|
| `.gitignore` | — | fork 自有的忽略项 | 必须留 | 两边的行都保留 |
| `AGENTS.md` | — | 开头加一段 MMS 指路，指向 `mms/HANDOFF.md` | 必须留 | 取上游版本，再把开头这段补回去 |
| `README.md` | C15 | 开头一行说明 fork 身份，正文在 `mms/README.md` | 必须留 | 取上游版本，再把开头这一行补回去 |
| `README.zh.md` | C15 | 同上 | 必须留 | 同上 |
| `README.i18n.yaml` | C15 | README 中英对照的 hash 记录 | 必须留 | 取任一版本，再运行 `pnpm run verify-translation-pairing --write README.md` 重新生成 |
| `tsconfig.client.json` | C12、C14.01、C15 | 在 client 聚合配置里加一行 `ui-mms` 引用。上游要求新 client 包必须登记在这里，否则它的测试无法通过 typecheck | 必须留 | 取上游版本，把 `{ "path": "./packages/client/ui-mms" }` 这一行补回去 |
| `pnpm-lock.yaml` | 同上 | `packages/client/ui-mms` 的 importer 条目。这个包只有 devDependencies，都是 workspace 里的包和上游已经锁定的版本 | 必须留 | **不要手工合并**：取上游版本，运行 `pnpm install --lockfile-only`，核对 diff 只多了 `packages/client/ui-mms` 这一段 |

`packages/client/ui-mms/` 是新增目录，不算上游文件，O4 不登记它。它的 `ModelSelect.tsx` 和 `DirectoryBrowser.tsx` 是上游组件的副本，同步上游时要对照原版，方法见该包 README 的「与上游保持同步」一节。
