# 上游文件就地修改登记

这是 `HANDOFF.md` 第三节要求的「已知会冲突清单」。

- `mms/sync-gate/gate.py` 的 O4 会检查：只要改到上游文件却没在这里登记，gate 就失败。
- 登记不等于允许长期保留。「状态」一列写明是「待挪」（要挪进自有包）还是「必须留」（上游没有扩展点）。
- 同步上游撞上冲突时，先看这一列。

首次登记：2026-09-18。基线 `upstream/master` merge-base `ddefc45fbc`。

| 文件 | 能力项 | 为什么改 | 状态 | 冲突时怎么办 |
|---|---|---|---|---|
| `.gitignore` | — | fork 自有的忽略项 | 必须留 | 保留两边的行 |
| `AGENTS.md` | — | 加 MMS 指路 | 待挪：压到一行指向 `mms/HANDOFF.md` | 取上游版本，再补一行 |
| `README.md` | C15 | fork 身份说明 | 待挪：压到一行，正文放 `mms/README.md` | 取上游版本，再补一行 |
| `README.zh.md` | C15 | 同上 | 待挪 | 同上 |
| `README.i18n.yaml` | C15 | 双语配对记录 | 待挪：跟 README 一起 | 重新生成配对 |
| `packages/client/locale/src/locales/en.ts` | C14.01、C12 | 新增搜索和 effort 文案 | 待挪：改用自有 locale namespace | 保留上游全部 key，再追加我们的 |
| `packages/client/locale/src/locales/zh.ts` | C14.01、C12 | 同上 | 待挪 | 同上 |
| `packages/client/ui-directory-picker-browse/README.md` | C14.01 | 记录 fork 行为 | 待挪 | 取上游版本 |
| `packages/client/ui-directory-picker-browse/README.zh.md` | C14.01 | 同上 | 待挪 | 取上游版本 |
| `packages/client/ui-directory-picker-browse/README.i18n.yaml` | C14.01 | 同上 | 待挪 | 重新生成 |
| `packages/client/ui-directory-picker-browse/src/client/DirectoryBrowser.tsx` | C14.01、C14.02 | 项目搜索、路径直达、无效路径保留错误 | 待挪：评估能否做成 `ui-mms-project-picker` 并替换 picker 注册 | 逐段对照；以 O3 与 L1 为准 |
| `packages/client/ui-directory-picker-browse/src/client/DirectoryBrowser.module.css` | C14.01 | 搜索框样式 | 待挪 | 同上 |
| `packages/client/ui-directory-picker-browse/src/client/flow.ts` | C14.01、C14.02 | 旧异步响应不覆盖新输入 | 待挪 | 同上 |
| `packages/client/ui-directory-picker-browse/src/client/index.ts` | C14.01 | 导出 | 待挪 | 同上 |
| `packages/client/ui-directory-picker-browse/tests/client-flow.client.spec.tsx` | C14.01、C14.02 | 覆盖 fork 行为 | 随实现一起挪 | 保留上游用例，再追加我们的 |
| `packages/client/ui-directory-picker-browse/tests/directory-browser.client.spec.tsx` | C14.01 | 同上 | 随实现一起挪 | 同上 |
| `packages/client/ui-model-selection/README.md` | C12 | 记录 fork 行为 | 待挪 | 取上游版本 |
| `packages/client/ui-model-selection/README.zh.md` | C12 | 同上 | 待挪 | 取上游版本 |
| `packages/client/ui-model-selection/README.i18n.yaml` | C12 | 同上 | 待挪 | 重新生成 |
| `packages/client/ui-model-selection/src/client/ModelSelect.tsx` | C12.01、C12.02 | 模型搜索与 focus、常驻 effort 直接选档 | 待挪：评估以自有包替换模型选择 UI | 逐段对照；以 O3 与 L2 为准 |
| `packages/client/ui-model-selection/src/client/ModelSelect.module.css` | C12 | 样式 | 待挪 | 同上 |
| `packages/client/ui-model-selection/src/client/locales.ts` | C12 | 包内文案 | 待挪 | 保留上游 key，再追加 |
| `packages/client/ui-model-selection/tests/model-select.client.spec.tsx` | C12 | 覆盖 fork 行为 | 随实现一起挪 | 保留上游用例，再追加我们的 |
| `packages/client/ui-sidebar/tests/sidebar-root.client.spec.tsx` | C15 | 品牌名断言 | 待挪：改成读取 `DSH_CLIENT_TITLE`，不写死 | 取上游版本，重新跑 |
| `packages/client/ui-sidebar/tests/__snapshots__/sidebar-snapshot.client.spec.tsx.snap` | C15 | 品牌名快照 | 待挪：同上 | **不要手工合并快照**：取上游版本后重新生成，再核对只改了品牌 |
