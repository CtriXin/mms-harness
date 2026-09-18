# 实测对比：fork dsh Web vs MMS Pilot（第 1 轮，2026-09-18）

这份只记本轮自己实测和核对的东西，不改 `MIGRATION.md` 的勾选。

## 测了什么

- **测的哪个实例**：本机已安装的 fork 实例，`127.0.0.1:3092`，版本 `0.1.6-alpha.2-e530fa4`（也就是已迁的三项能力）。用 ego-browser 真实操作。
- **用的项目**：新建了一个 scratch 项目（`README.md`、`data.csv`）。模型是 `deepseek-v4-flash · newapi-tokyo`，High 档。
- **跑了几轮**：5 轮真实请求，共 24 步。token 总量 248K，缓存命中率 95%。
- **Pilot 那边**：本轮没有起 Pilot 实例做同场对比。Pilot 一侧的行为引自 `MIGRATION.md` 的 R/P 证据等级，不是本轮重跑的结果。
- **源码对照**：另做了一份源码对照，覆盖桶 A 的 C05/C06/C08/C13/C14。这部分只读了源码，没有运行。

## 实测结果

| 场景 | fork 实测 | 结论 |
|---|---|---|
| 项目定位（C14.01） | 在「找到你的项目」里输入路径，点前往再点打开，工作区变成 `cmp-proj` | 通过 |
| 模型选择 | 共 68 条路由，每条标出通道（如 `newapi-tokyo`），备用通道另有标记；可以按模型名或通道搜索 | 能用。但同名模型最多重复出现 3 次，列表很长 |
| 带工具的任务 | 读 CSV、跑 shell、写 `summary.md` 再 `cat` 确认，文件确实落盘 | 通过 |
| 过程展示（C13.01/.02） | 默认折叠成「5 次工具调用 · 4 条消息」，最终答案始终可见；每轮带用量、用时、tok/s | 达标（未与 Pilot 同场比较） |
| 忙碌时追加消息（C13.03/.04） | 追加的消息进入队列，可以编辑、删除或插话发送，`Cmd+Enter` 全部插话；第一轮结束后自动送出 | 原生达标，不能重排 |
| 文件改动卡片（C05.02 部分） | 每轮显示「已编辑 N 个文件 +x/-y」，点开能看 diff | 本轮内可用；Host 重启后消失（源码 README 明示） |
| 预览（C05.01） | 右侧栏按标签页打开，Markdown 正确渲染，显示完整路径，可刷新 | 通过；没有找到下载按钮 |
| `/` 指令（C13.11） | 文件、目标、计划、反馈、压缩、权限、模型、下载日志、recipe | 缺 `/btw` `/thinking` `/name` `/clear-queue` `/help` |
| 停止（C13.03） | 工具执行中途点停止，界面显示「失败 · Error: wait aborted」 | **有差异，见下** |
| 窄屏 390×844 | `scrollWidth = 390`，没有横向溢出；对话、输入框、底栏都能用 | 通过；刷新后之前打开的预览会占满整屏 |

### 停止不等于停下（新发现）

1. 模型把 `sleep 45 && echo DONE_B > done_b.txt` 放成后台 job（`bash-1`）运行。
2. 我在 17:51 点了停止。当前回合中止，界面显示了中断。
3. 17:51:59，后台 job 照常写出了 `done_b.txt`。
4. 17:52:05，会话被 job 完成通知**自动唤醒，开了第 5 轮**。这一轮没有任何用户消息。模型在这一轮写了 `notes2.md`，并报告「完成」。

这是 dsh 的既定设计，不是 bug：`packages/jobs/tool-jobs/README.md:40-57`，其中 `completionDelivery` 默认为 `wakeup`，`maxConsecutiveWakes` 默认为 3。按下停止不会 kill 后台 job。

MMS 这边相关的合同是 C08.07「不重放副作用」和 C13.03「停止」。要不要改，已经放进 `UPSTREAM-DECISIONS.md` 等机主决定。

## dsh 有、Pilot 没有的（日常相关）

> 2026-09-18 更正：初稿把「会话归档与恢复」列为 Pilot 没有，这是错的。以下按 MMS origin/dev 的 `docs/mms-web/FEATURES.md` 逐项重核。

**Pilot 原文明确没有，dsh 有**

| 能力 | FEATURES.md 原文 |
|---|---|
| 子代理、结构化 Todo 展示 | 「完整 Kimi parity 仍缺……子代理/结构化 Todo 专用展示」 |
| PDF/Office 内容预览 | 「PDF/Office 的 Web 内容解析尚未实现」 |
| 会话内换模型或服务 | 「跨模型/服务切换需新建会话」；dsh 可以在会话里直接换 |

**FEATURES.md 没有提到、dsh 有**

「没提到」不等于 Pilot 一定没有，要进一步确认得看 Pilot 源码：

- 工作流 / Ralph loop
- `/goal` 长期目标
- 计划评审卡
- 后台 job
- 终端侧栏
- 浏览器侧栏
- 权限预设与沙箱
- 在外部应用打开

**两边都有，本轮不算作差异**

- 会话归档与恢复
- 分支（Pilot 能从指定回复处分支；dsh UI 只能从最后一条分支）
- Markdown 导出（dsh 导出的是 ZIP）
- Git 文本差异（dsh 用的是每轮改动卡片）
- 只读规划（Pilot 在工具层限制；dsh 不限制）
- 运行详情（Pilot 有协议和进程信息；dsh 只有 token 细分）
- 日程（MMS 5.x 有独立日程，C18）

## 这一轮的初步判断

> 2026-09-18 撤回初稿里「基础对话体验上 fork 不比 Pilot 差」这个结论。理由有三：本轮没有同场对比；Pilot 一侧大量引用的是 P 级证据（只有 PR 声称）；5 轮样本不够。本轮只能说 **fork 上以下几项实测可用**，**不能**说它跟 Pilot 比谁好谁差。

- **fork 实测可用**：项目定位、模型路由、带工具任务、过程折叠、排队和插话、改动卡片、Markdown 预览、390px 无横向溢出。
- **dsh 没有、又是机主点名要的**：
  - 手机或远程访问：fork 只监听 loopback。
  - BTW 旁问：没有。
  - 停止语义：见上一节。
  - `/compact` 不接受保留要求。
  - 计划模式不限制工具（`plan-mode/README.md:12`，"every tool remains available"）。
- **没测的**：真实手机跨网访问、Windows、Host 重启后的 interrupted 显示、Recipe 接收方视角、Pilot 同场对比（这项需要起隔离的 Pilot 实例）。
