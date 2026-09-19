# 上游覆盖 / 冲突决策表

规则见 `HANDOFF.md` 第五节。三类的含义：

- **A**：上游原生已达标。
- **B**：上游有同类能力，但行为不同。
- **C**：真冲突。

每一行只是建议，**机主回复前不执行**。回复后把决定写进「决定」列，再去更新 `MIGRATION.md` 对应项。

证据分四种：

- **实测**：`COMPARE-PILOT-2026-09-18.md` 中真实跑过。
- **UI**：在 3092 上点开界面看过，但没有发请求。
- **源码**：只读了 README 或代码，没有运行。
- **Pilot 原文**：引自 MMS origin/dev 的 `docs/mms-web/FEATURES.md`。

「A（待实测）」表示源码看起来达标，但在跑过对应用例之前，不在 `MIGRATION.md` 里勾选。

## 第 1 批（2026-09-18）：13 行，覆盖 18 项

| 能力项 | 类 | 上游对应物 | 行为差异（到可验收那句） | 建议 | 证据 | 决定 |
|---|---|---|---|---|---|---|
| C13.03 停止 / C08.07 不重放副作用 | B | `jobs/tool-jobs`（`completionDelivery=wakeup`，`maxConsecutiveWakes=3`） | 点停止只中止当前回合，不 kill 后台 job；job 完成后会自动开新回合（实测第 5 轮） | 做自有包：点停止时 kill 本会话的后台 job，并且这次停止后不再唤醒 | 实测 + 源码 | **同意做自有包**。验收：起后台 job → 点停止 → 断言 job 被 kill，且不会自动开新回合；列入「同步上游必跑」。**已完成**：`mms/adapter/plugin-stop.mjs`，gate O7 + L5 PASS，端到端 mutation 红→绿 |
| C13.02 过程折叠 | A | `client/ui-chat` | 缺「全部折叠」按钮 | 标「由上游满足」 | 实测 | 按建议 |
| C13.03/.04 排队与插话 | A/B | `ui-conversation` QueueDock，`QueueAction`=edit/remove/steer | 不能重排 | 标「由上游满足」，重排不迁 | 实测 + 源码 | 按建议 |
| C13.06–.08 BTW 旁问 | 缺失 | 无 | — | 进桶 B，做独立包 | 源码 | 按建议 · **已做** `/btw`（`plugin-btw.mjs`，C13.06 部分、C13.07 已验；C13.08 折叠状态未做） |
| C13.10 压缩带保留要求 | B | `compaction/command-compact`（不接受参数） | 不能透传保留要求 | 自有命令 `/mms-compact <保留要求>` | 源码 | 按建议 |
| C13.11 斜线命令 | B | `client/ui-commands` | 缺 `/btw` `/thinking` `/name` `/clear-queue` `/help` | 只迁 `/btw` 和 `/help` | 实测 | 按建议 |
| C13.15 规划只读 | B | `plan/plan-mode`（"every tool remains available"） | 计划模式不限制工具 | 做自有包：plan 状态下在工具层只放行 read/grep/find/ls | 源码 | **做自有包**（机主：沙箱+审批是降级，不选）· **已做** `plugin-plan.mjs`，gate L6 实测 |
| C05.01 预览 | B | `ui-sidebar-documentpreview` | 比 MMS 多 PDF/Office，但没有下载按钮 | 标「由上游满足」，下载按需补 | 实测 + 源码 | 按建议 |
| C05.02–.04 版本快照 | B | `deliverables/workspace-changes` | 只有本轮 diff，Host 重启后丢失，没有跨版本比较 | 先不迁 | 源码 | 按建议 |
| C06.03 本机 Skills 合并 | B | `skill-filesystem`（`agentsHome` 默认扫描 `~/.agents`） | 上游默认开启，MMS 默认关闭 | 需要机主定 | 源码 | **保持 MMS 默认关闭**：配置 `includeDefaultRoots`/`agentsHome`，不改上游包 |
| C06.08 global 优先 | **A**（原填 C，已更正） | `skill-filesystem` 排名：项目 100 < 用户 400/500 < 内置 600，数字小的优先 | 重核原文：FEATURES.md:52 写「同名项目 skill 覆盖共享 skill」，即项目优先；guardrails:261 写「同名 global 优先，MMF 动态版本只作缺失时的 fallback」，即全局高于内置。dsh 两条关系都一致。剩余差异是 xmem 不内置、退休 hook 不复活，这两点 dsh 本来就不做 | 标「由上游满足」。另外因为 C06.03 保持关闭，默认情况下用户 skill 根本不加载，全局高于内置这条只在开关打开后才生效 | 源码 + Pilot 原文 | 机主要求重核；已重核为 A，待确认 |
| C08.09 会话归档 | A | `api/workspace-controller` archive/unarchive | — | 标「由上游满足」 | 源码 | 按建议 |
| C08.11 导出 | B | `session-log-export`（ZIP） | 导出原始日志 ZIP，不是 Markdown | 自有包补 Markdown 导出，或接受 ZIP | 实测 + 源码 | 按建议（两个方案，默认先接受 ZIP，要 Markdown 再做） |

## 第 2 批（2026-09-18）：桶 A 剩余 34 项

合计：18 + 34 = 52 项，C05/C06/C08/C13/C14 五组全部覆盖。

| 能力项 | 类 | 上游对应物 | 行为差异 | 建议 | 证据 |
|---|---|---|---|---|---|
| C05.05 选段 / 图片选区进草稿 | 缺失 | 无（`insertReference` 只服务 `@` 补全） | 预览里不能把选段送进输入框，发送前也不核对版本 | 桶 B，低优先 | 源码 |
| C05.06 HTML 清理、CSP、sandbox、路径安全 | B | `HtmlBody.tsx:56`（`sandbox="allow-scripts"`，没有 same-origin）；`fs-local` | iframe 碰不到父页和 API，这点达标。但没有 CSP，外部 HTTPS 资源能加载；`fs-local` 明说绝对路径和 `..` 不受限，symlink 越界不会 fail closed | 自有包：给预览加 CSP，fs 走 `fs-sandbox` 限定在 workspace 内。属于安全项，不往后排 | 源码 |
| C05.07 本地引用预览、窄屏回输入 | B | `ui-reference`（`@` chip，不上传，点击打开预览） | 引用不上传，达标。预览到输入框的同步没有；390px 下引用流程没测 | 先测 390px，再决定 | 源码 |
| C05.08 定量边界 | B | `attachment-local`（20 图、每条 200 MiB、单图 20 MiB） | Pilot 原文：8 文件、20 引用、图片 8 MB、文本 64 KiB、Skills 20 个 / 200 KB、草稿 7 天。dsh 数值不同，没有 Skills 字节上限，也没有草稿 TTL | 只迁 Skills 上限（防止塞爆上下文）。其余接受 dsh 的数值，标 B-接受 | 源码 + Pilot 原文 |
| C06.01 任务型 bundled Skills | B | `skill/skill-office`（只有 docx/pptx/xlsx）、`tool-skill`、`ui-skill` | 机制已有，但 MMS 的任务型 Skills 没有内置进来 | 以 bundled root 挂上 MMS 的任务 Skills（`bundledSkillDir`），不改上游 | 源码 |
| C06.02 优先级与同名冲突可见 | B | `skill-filesystem`（被遮蔽的只写日志，"no API to inspect"） | 排序一致，但用户看不到「哪个覆盖了哪个」 | 自有包：在 Skill 列表里显示来源和被遮蔽项 | 源码 |
| C06.04 Weber 入口与登录态边界 | B | `browser-use/*`、`ui-sidebar-browser` | 有 provider 插槽，但没有 backend 路由，也不区分登录态和隔离浏览器 | 桶 B 后段；先确认机主在 fork 里是否需要浏览器操作 | 源码 |
| C06.05 选 Skill 只进草稿 | A（待实测） | `ui-skill` / `ui-commands`：chip 插入草稿，发送才运行 | 刷新和取消后的状态没验 | 实测后标 A | 源码 |
| C06.06 会话 scoped hooks、退休项不复活 | B | `hooks-claude-code` / `hooks-codex`（显式 `configPath`，不自动装） | 不自动全局安装，这点达标；没有退休项清单 | 标 B-接受：dsh 本来就不装全局 hook，退休项无从复活。清单不迁 | 源码 |
| C06.07 Figma/Pilot MCP 默认关闭 | B | `mcp-client`（"No server is enabled by default"） | 默认关闭，达标。没有 `MMS_ENABLE_*` 开关，也不清理旧会话生成物 | 标 B-接受：默认关闭是核心，开关用 dsh 配置代替 | 源码 |
| C06.09 surface 目录、禁用草稿 | B | `ui-settings-plugin-inventory`（只读） | 只读清单；不能按会话禁用 Skill，也没有偏好草稿 | 跟 C06.02 做同一个包 | 源码 |
| C08.01 会话持久 | A | `session-persistence-jsonl` | 已在 MIGRATION 勾选 | — | 前轮实测 |
| C08.02/.03 CLI 历史发现与采用 | 缺失 | 无 | — | 桶 B。Pilot 原文说「没有自动导入全部 mmf 历史」，价值待机主确认 | 源码 + Pilot 原文 |
| C08.04 失败提示、error-only 消息 | A（待实测） | `llm-retry`、`ui-chat` turn-error / retry | 错误和重试行显示在折叠外 | 需要造一个只有错误的回合，并验证成功后旧错误被清掉 | 源码 |
| C08.05 失败后生成接续资料 | 缺失 | 无 | — | 桶 B，跟 C08.06 一起 | 源码 |
| C08.06 换模型续原会话 / 新草稿 | B | `session-controller` `selectModel`、`fork` | 会话里可以直接换模型继续，**这点强于 Pilot**：Pilot 原文写「跨模型/服务切换需新建会话」。缺失败后「干净新草稿」的流程 | 换模型标「由上游满足」，新草稿并入 C08.05 | UI + Pilot 原文 |
| C08.08 旧 Pilot / Pi 历史可读 | 缺失 | 只有 dsh 自有格式的迁移 | — | 桶 B，只做只读导入，不承诺 native resume | 源码 |
| C08.10 指定回复处分叉 | B | API 支持任意已完成轮次锚点；UI 只允许最后一条 | 实测提示「仅可从已完成轮次的最后一条消息分支」。Pilot 原文支持指定回复处分支 | 自有 UI 包，调用上游 API | UI + 源码 |
| C13.01 流式、thinking/tools 分组、用量 | A | `ui-chat` | 工具失败时最终答案可见，实测过一次（wait aborted） | 标「由上游满足」 | 实测 |
| C13.05 中途引导 / 重启后空白回合 | B | checkpoint policy | 没找到「作废并准备重发」的流程 | 跟 C08.07 一起做重启测试后再定 | 源码 |
| C13.09 等待回复 / 批准真实接线 | A（待实测） | `ui-approval`、`ui-user-questions`、`user-approval` | — | 端到端跑一次审批 | 源码 |
| C13.12 大纲与提问刻度 | A（待实测） | `session-turn-outline`、`TurnNavigator.tsx` | UI 上看到了「轮次导航」；键盘/触屏操作和未读状态没验 | 实测后标 A | UI |
| C13.13 原生 confirm/select/input/editor | B | `tool-ask-user`（confirm / 单选 / 多选 / 自由文本） | 没有 editor 类型 | 标 B-接受，editor 不迁 | 源码 |
| C13.14 运行详情：协议、context、token/cache | B | `StatsPills`、`ui-trajectory` | 实测弹窗只有 token 细分和缓存命中；没有所选通道、模型、协议，也没有脱敏进程信息。Pilot 原文把这些放在同一处 | 自有包：在统计弹窗里补通道、协议和模型（数据来自 MMS 路由） | UI + Pilot 原文 |
| C14.01 按名字或路径搜项目 | 已迁 | fork 改了 `ui-directory-picker-browse` | 属于第三节里 25 处上游就地修改，要挪进自有包 | 列入就地修改的补救 | 实测 |
| C14.02 路径直达、无效路径不误用 | 已迁 | 同上 | 同上 | 同上 | 前轮实测 |
| C14.03 记住上次项目 / zoxide | B | `ui-workspace` registry | 实测新会话默认落在上次的项目。没有 MMS 项目历史和 zoxide 导入 | 上次项目标「由上游满足」；历史导入并入 C14.05 那个包，低优先 | UI |
| C14.04 目录树 | A（桌面，待实测手机） | `ui-directory-picker-browse`（多栏、隐藏文件、新建文件夹） | 实测桌面可用；手机和其他 OS 没验 | 手机远程做完后在 390px 复测 | 实测 |
| C14.05 同名文件夹按内容指纹定位 | 缺失 | 无 | — | 桶 B，低优先 | 源码 |
| C14.06 目录树键盘、截断提示、390px | B | 同上 | 键盘规格和截断提示没有文档 | 跟 C14.04 一起在 390px 复测 | 源码 |
| C14.07 原路径引用、拖入副本、正文位置 | B | `ui-reference`、`file-upload` | 原路径引用达标；上传件是附件卡片，不能插在正文里 | 标 B-接受 | 源码 |
| C14.08 草稿引用刷新恢复、过期附件清理 | B | `file-upload` 回执 | 没有清理过期导入副本 | 低优先 | 源码 |
| C14.09 workspace 排序、改名、移除 | B | `workspace-controller`、`ui-workspace` | 实测只有「重命名」「删除工作区」「新建会话」；源码有拖拽排序。没有复制路径、上移/下移按钮，也没有启动目录保护 | 只迁「启动目录不可移除」（防误删），其余接受 | UI + 源码 |

### 第 2 批需要机主拍板的

只有两条会改变方向，其余按建议走：

1. **C05.06 预览安全**：建议马上做（加 CSP，fs 限定在 workspace 内）。
2. **C08.02/.03/.08 旧历史导入**：Pilot 自己也没做全，要不要做？

## 第 3 批（2026-09-18）：C07 手机与远程访问，C 类，等机主决定

**上游立场**

- `packages/bundle/web-app/src/startup.ts:74-75` 会拒绝 `--host 0.0.0.0`，原文："intentionally not supported yet for safety: it would expose remote code execution to the network"。
- README:58 说绑定所有网卡就能从 LAN 访问，但 README:153 和代码都是拒绝。以代码为准。

**底层能力**

- `resolveLanTrust()`（`src/index.ts:125`）在绑定 `0.0.0.0` 时会采样 LAN IPv4，写进 `/api` 的 Host/Origin 信任边界。
- 每个 Host API 和 WebSocket 都要 token 换来的签名 cookie（实测是 303 跳转 + HttpOnly cookie，Max-Age 30 天）。
- 只有 CLI 这一层主动拦截。通过 config 传 host 的路径没有看到拦截，但没有实测。

**和 MMS 合同的差异**

| MMS 合同 | dsh 现状 |
|---|---|
| C07.01 默认关闭的开关 | 没有开关 |
| C07.03 二维码 | 没有 |
| C07.04 轮换 token 后当前窗口不断 | 每次启动都生成新的 process token，是否因此需要重新扫码没实测 |
| C07.05 外网使用引导 | 没有 |

**三个方案**

| 方案 | 做法 | 好处 | 风险 |
|---|---|---|---|
| A 绕过 CLI 检查 | 自有包通过 config 把 host 设成 `0.0.0.0`，复用 dsh 的 LAN 信任和 token；再补默认关闭的开关和二维码 | 改动最小 | **直接违背上游明写的安全决定**。上游以后如果在底层也加拦截，功能会突然失效。暴露面等于把 agent 的 shell 放到局域网上 |
| B 自有 LAN 网关（**建议**） | dsh 保持只听 loopback。MMS 起一个默认关闭的网关，转发 HTTP 和 WebSocket；自己管一个跨重启不变的 token，支持轮换、Host/Origin 校验和二维码；网关持有 dsh 的 process token，代用户完成鉴权 | 不碰上游的绑定决定，也不受它以后改动影响。认证语义（持久 token、轮换不断线）由我们掌控，正好对应 C07.02/.04 | 暴露面实质上和 A 一样，只是鉴权换成我们自己做；多一跳转发；工作量最大 |
| C 不开 LAN，只做隧道引导 | 用 `--trusted-host` 配合 Tailscale 或 SSH 端口转发，写使用引导 | 安全面最小，不需要写任何网络代码 | 手机要装 Tailscale；「同一 Wi-Fi 下扫码就能用」做不到 |

**建议**：B 作为主方案，C 写进 C07.05 的外网引导。不管选哪个，远程开关都默认关闭。开启时界面要写明「局域网内拿到 token 的人可以在这台电脑上执行命令」。

| 决定 |
|---|
| **B**（机主 2026-09-18）：自有 LAN 网关，dsh 保持 loopback；C 方案写进 C07.05 外网引导 |
