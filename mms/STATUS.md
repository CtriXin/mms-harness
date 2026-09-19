# MMS Harness 现状（2026-09-19）

写给准备试用的机主，也写给下一个接手的 AI 会话。

这份文件只回答四件事：现在能用什么、怎么用、还缺什么、有哪些已知限制。

- 每一项的验收条件和证据在 [MIGRATION.md](MIGRATION.md)。
- 怎么继续干活、什么时候必须停下来问人，见 [HANDOFF.md](HANDOFF.md)。
- 每次改动后必跑的检查见 [SYNC-GATE.md](SYNC-GATE.md)。

**版本**：fork `CtriXin/mms-harness` 的 `mms` 分支 `ff39e0aefd`。

**host**：npm 上固定版本的 `@deepseek-ai/dsh` `0.1.6-alpha.2`。fork 只提供前端产物和 MMS 自有插件，host 版本不跟着 fork 走。

**本机 3092**：已装这个版本，只在这台 macOS 上验证过。

**迁移清单计数**（193 项里包括工程项和候选项，**不是完成百分比**）：已验 33、部分 30、未迁 122、未验 5、待核对 3。

---

## 1. 怎么用

### 装好以后

- 双击 `~/Applications/MMS Harness.command`，浏览器会打开 `http://127.0.0.1:3092`。
- 模型和通道直接读 `~/.config/mms-next`，只读，不另外配置。
- 会话和设置保存在 `~/.local/share/mms-harness/instance`，停止或升级都不会丢。

```bash
"$HOME/Applications/MMS Harness.command"                   # 打开（没在跑就先启动）
"$HOME/Applications/MMS Harness.command" status | stop     # 查看状态 / 停止
"$HOME/Applications/MMS Harness.command" upgrade --check   # 看有没有新版本
"$HOME/Applications/MMS Harness.command" upgrade           # 拉取源码、构建、升级
"$HOME/Applications/MMS Harness.command" rollback          # 换回上一个版本
"$HOME/Applications/MMS Harness.command" remote on|off|status|rotate
```

改了 MMS 的通道以后要重启一次（`stop` 再打开），Harness 才会用上。

### 新机器（比如云电脑）

构建产物不在 git 里，要先构建：

```bash
git clone -b mms git@github.com:CtriXin/mms-harness.git && cd mms-harness
pnpm install --frozen-lockfile
DSH_CLIENT_TITLE="MMS Harness" pnpm run build
python3 mms/install.py --destination ~/.local/share/mms-harness --mms-root ~/.config/mms-next --node "$(which node)"
```

- 需要 Node 24.2 以上，并且这台机器上要有 `~/.config/mms-next`。
- 以后更新直接运行 `upgrade`。
- **只在 macOS 上验证过**。启动器 `.command`、`/bin/ps`、`/sbin/ifconfig` 这几处在 Linux 上能不能用还没验证。

### 界面里

| 想做什么 | 怎么做 |
|---|---|
| 打开或添加项目 | 侧栏「添加工作区」→「找到你的项目」：输入项目名搜索，或者粘贴路径后按回车，最后点「打开」 |
| 换模型 / 换推理等级 | 输入框右下角：模型按钮可以搜名字或通道；旁边的 effort 按钮一次点击直接选档 |
| 设置新会话默认 | 模型菜单里的「设为新会话默认」。在会话里切模型只影响这个会话 |
| 先规划、不动手 | `/plan`：只能读、搜、问你、交计划，写文件和 bash 都会被拒绝。`/plan off` 退出 |
| 主任务在跑时问一句 | `/btw 问题`：不打断主任务，也不进入主对话；回答里写明是哪个模型答的、用了多少 token |
| 停止 | 点停止：模型在后台启动的任务会被一起结束，之后不会自己再开一轮 |
| 任务模板 | `/recipe list`、`/recipe use <id> {"变量":"值"}`、`/recipe import <绝对路径>` |
| 手机打开 | `/remote on` → 在本机浏览器打开卡片里的「扫码页」（5 分钟内有效）→ 用手机扫码。见 [REMOTE.md](REMOTE.md) |

---

## 2. 已有能力（实测过）

「怎么验证的」一列里，O/L/W 开头的编号是 [SYNC-GATE.md](SYNC-GATE.md) 里的自动检查，每次同步上游都会跑；「实测」是 2026-09-19 在临时实例上用真实模型做的一次性验证。

| 能力 | 条目 | 怎么验证的 |
|---|---|---|
| 用 MMS 审批过的模型路由，按选中的通道绑定凭据，缺凭据就停，不回退到别处 | C01.01、C01.02 | O1、L4 |
| 会话里切模型只影响本会话，新会话默认值要显式设置 | C01.06 | O11、L9，并做过 mutation |
| effort 按模型实际支持的档位显示：没有档位就隐藏；选的档位真的发到请求里 | C02.01、C02.04、C02.05 | L2，实测 |
| 默认 effort 改了以后，新会话立即生效 | C02.06 | 实测 |
| Recipe：解析、变量替换、实际请求前复核模型能力、恢复会话后状态还在 | C03.01–.03 | O2 |
| 手机远程访问：默认关闭；口令加 Host/Origin 校验；只在本机能打开的扫码页；手机上换口令不会把自己踢下线 | C07.01–.04 | O6，端到端 |
| 会话持久化，服务重启后能接着聊 | C08.01 | L3 |
| 请求失败时，界面显示原因和错误码 | C08.04 | 实测 |
| 崩溃后那一轮标为中断，不把工具再执行一遍 | C08.07 | 实测 |
| 会话记住自己用的模型，全局默认变了也不跟着变 | C09.05 | 实测 |
| 独立安装、后台服务、停止时保留会话 | C10.01、C10.02 | L0、W1 |
| 升级：新版本先预检，就绪了才切换，端口和会话保留；切换失败自动恢复；支持回滚；探测请求不走代理 | C11.01、.04–.07 | O10、L8，并做过 mutation |
| 模型和通道搜索、常驻 effort 按钮、改名时第一个字不被吞 | C12.01、C12.02、C12.06 | O3，实测 |
| `/btw` 回答里写明模型、用量和错误 | C13.07 | O9、L7 |
| 项目按名字或路径搜索，确认实际工作目录；路径无效时不会沿用旧目录 | C14.01、C14.02 | O3、L1 |
| 品牌名「MMS Harness」和版本号 | C15.01 | W1、W2 |
| 格式不认识的会话文件被跳过，文件本身不被改动 | C21.02 | 实测 |

## 3. 部分完成（能用，但有缺口）

| 能力 | 已有 | 缺什么 |
|---|---|---|
| 只读规划 `/plan`（C13.15） | 工具层只放行 6 个只读工具，L6 实测 | 界面上没有常驻的「这不是系统级沙箱」标识，目前只写在工具被拒时的提示里 |
| 旁问 `/btw`（C13.06） | 主任务运行中也能答，不进入主对话，L7 实测 | 「取消旁问和取消主任务互不影响」还没测；旁问卡片的折叠状态刷新后不保留（C13.08） |
| 停止与队列（C13.03） | 停止会结束后台任务、不会自己再开一轮（L5） | 忙碌状态下排队、插话、停止这三种情况还没做完整验收 |
| 提问与审批（C13.09） | 模型向你提问，端到端能走通 | 审批流程没测 |
| 手机远程（C07.05–.07） | 外网用 Tailscale 或隧道的引导；升级、回滚时带上口令 | 没用真手机测过（软键盘、微信内置浏览器、加到主屏幕）；没测真实跨网 |
| 升级（C11.02、C11.03） | 终端命令，带确认步骤和 `--check` | 应用内没有升级入口；fork 只有一条 `mms` 线，没有 Stable/Preview 之分 |
| 模型可用性（C01.07） | 整个通道加载失败时可见 | 看不到每个模型能不能用、为什么不能用 |
| 界面细节（C12.03–.05、C12.11、C14.04、C14.06） | 桌面端可用 | 弹窗关闭后焦点回到入口、390px 适配和 44px 触控目标、目录窗口键盘切层、每层截断提示 |
| 多 CLI 隔离（C09.02、C09.04） | dsh 自己是隔离的 | 其他 CLI（Codex、Claude Code 子代理）仍然读真实 HOME |

## 4. 还没有的（按建议顺序）

每项的上游对照依据见 [UPSTREAM-DECISIONS.md](UPSTREAM-DECISIONS.md) 第 4 批。

1. **界面交互补齐**（C12.04、C12.11、C14.06）：在 `ui-mms` 里做，规模小。
2. **模型级可用性和拒绝原因**（C01.07）：规模中等。
3. **Fleet「多问几个模型」**（C19，8 项）：上游有子代理和并行工作流，缺用户入口、worker 只读（可以复用 `/plan` 的只读规则）、指定的模型失效就停。
4. **其他 CLI 的私有 HOME 隔离**（C09.02）：给 provider 实例的 `env` 注入私有 HOME。
5. **独立日程**（C18，7 项）：上游只有会话内提醒，没有每天、每周这样的独立任务。
6. **持久 Bot 与长期记忆**（C16，9 项）以及计划步骤指定模型（C17，6 项）：上游没有这个概念，是最大的一块。
7. 其余几组：项目资料（C04）、成果预览（C05）、Skills 任务包（C06）、失败接续资料（C08.05/.06）、通知送达（C20）、Windows（C22），都还没开始。

## 5. 已知限制和没验证的环境

- **host 版本固定**：同步上游源码以后，新前端可能用到旧 host 没有的接口。gate 的 W1 和 L1–L9 就是为此设的。
- **没验证的环境**：真手机、真实跨网访问、Windows、Linux、云电脑。
- **上游本身的问题**（不在我们范围内）：
  - 一个损坏的会话文件会让整个会话搜索失败；
  - 失败提示的文字偏技术，比如直接显示 `MISSING_CREDENTIAL`。
- **指令结果卡片按纯文本显示**：`/btw`、`/recipe`、`/remote` 的结果里，链接点不了，Markdown 也不渲染。
- 上游文件被直接改动的还剩 7 处，都登记在 [UPSTREAM-PATCHES.md](UPSTREAM-PATCHES.md)。

## 6. 等机主决定的

| 事项 | 建议 |
|---|---|
| C05.06 成果预览的安全措施（CSP、只允许访问工作区内的文件） | 做成果预览时一起做 |
| 要不要导入 Pilot 和命令行的旧会话历史（C08.02/.03/.08） | 等试用后再定 |
| 本机旧备份 `~/.local/share/mms-harness-before-*`（每份都含完整 runtime） | 试用没问题的话，只留最新一份 |

## 7. 本轮新增的文件（给接手的人）

| 文件 | 是什么 |
|---|---|
| `packages/client/ui-mms/` | 前端覆盖包：品牌名、模型入口、项目窗口、「设为新会话默认」。用 slot 优先级 -10 叠在上游组件之上 |
| `mms/adapter/plugin-stop.mjs` | 停止时一起结束后台任务 |
| `mms/adapter/plugin-plan.mjs` | `/plan` 期间只允许只读工具 |
| `mms/adapter/plugin-btw.mjs` | `/btw` 旁问 |
| `mms/adapter/plugin-default-model.mjs` | 在会话里切模型不再改默认值；`/default-model` 显式设置默认 |
| `mms/adapter/plugin-remote.mjs`、`remote.mjs` | `/remote` 指令和局域网网关 |
| `mms/adapter/upgrade.py` | 升级和回滚 |
| `mms/sync-gate/gate.py` | 必跑检查：离线 O1–O11，实测 L0–L9，Web 检查 W1–W3 |
