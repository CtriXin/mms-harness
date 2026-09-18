# 上游覆盖 / 冲突决策表

规则见 `HANDOFF.md` 第五节：

- **A** = 上游原生已达标
- **B** = 同类但行为不同
- **C** = 真冲突

每一行只是建议，**机主回复前不执行**。回复后把决定写进「决定」列，再去更新 `MIGRATION.md` 对应项。

证据说明：

- **实测** 指 `COMPARE-PILOT-2026-09-18.md` 里真实跑过的。
- **源码** 指只读了 README 或代码、没有运行的。

## 第 1 批（2026-09-18，来自桶 A 实测 + 源码对照）

| 能力项 | 类 | 上游对应物 | 行为差异（到可验收那句） | 建议 | 风险 | 证据 | 决定 |
|---|---|---|---|---|---|---|---|
| C13.03 停止 / C08.07 不重放副作用 | B | `jobs/tool-jobs`（`completionDelivery=wakeup`，`maxConsecutiveWakes=3`） | 点停止只中止当前回合，不 kill 后台 job；job 完成后会自动开新回合继续原任务（实测第 5 轮写了 `notes2.md`）。MMS 期望的是停止后不再产生副作用 | 做一个自有包：在用户点停止时 kill 本会话的后台 job，并把这次停止后的唤醒压成 `quiet`。不改上游包 | 上游 jobs 的事件和配置名一变就要跟着改 | 实测 + 源码 | |
| C13.02 过程折叠 | A | `client/ui-chat`（完成后自动折叠；错误和最终答案不折叠） | 缺「全部折叠」按钮，其余达标 | 标「由上游满足」，全部折叠按钮不迁 | 低 | 实测 | |
| C13.03/.04 排队与插话 | A/B | `client/ui-conversation` QueueDock，`QueueAction` = edit/remove/steer | 不能重排，其余达标 | 标「由上游满足」，重排不迁（没见过真实需求） | 低 | 实测 + 源码 | |
| C13.06–.08 BTW 旁问 | 缺失 | 无 | — | 列进桶 B，作为独立包迁入 | 中 | 源码 | |
| C13.10 压缩带保留要求 | B | `compaction/command-compact`（"Usage: /compact (no arguments)"） | 不能透传 customInstructions | 以自有命令 `/mms-compact <保留要求>` 补充，不改上游命令 | 低 | 源码 | |
| C13.11 斜线命令 | B | `client/ui-commands` | 缺 `/btw` `/thinking` `/name` `/clear-queue` `/help` | 只迁 `/btw`（跟随 BTW）和 `/help`（中文入门），其余用 UI 已有入口，不迁 | 低 | 实测 | |
| C13.15 规划只读 | B | `plan/plan-mode`（"every tool remains available"） | 计划模式不限制工具；MMS 只放行 read/grep/find/ls | 做一个自有包：在 plan 状态下拦截写入类工具。或者接受上游语义，把 C13.15 改为「由沙箱与审批满足」 | 中：两种做法语义不同 | 源码 | |
| C05.01 预览 | B | `client/ui-sidebar-documentpreview` | 比 MMS 宽（多了 PDF/Office），但没有找到下载按钮 | 标「由上游满足」，下载按需补 | 低 | 实测 + 源码 | |
| C05.02–.04 版本快照 | B | `deliverables/workspace-changes` | 只保留本轮 diff，Host 重启后丢失（上游 README 写明是既定设计），没有跨版本比较 | 先不迁。等机主确认是否真的需要跨重启的版本历史 | 中 | 源码 | |
| C06.03 本机 Skills 合并 | B | `skill/skill-filesystem`（`agentsHome` 默认扫描 `~/.agents`） | 上游默认开启，MMS 默认关闭 | 需要机主定：跟上游（默认开）还是保持 MMS（默认关） | 中：影响每个会话看到哪些 Skill | 源码 | |
| C06.08 global 优先 | C | `skill-filesystem` 排名：项目 100 > 用户 400/500 > 内置 600 | 上游是项目优先，MMS 是全局优先 | 需要机主定。冲突在语义本身，不是代码 | 中 | 源码 | |
| C08.09 会话归档 | A | `api/workspace-controller` archive/unarchive | — | 标「由上游满足」 | 低 | 源码 | |
| C08.11 导出 | B | `session-log-export`（ZIP） | 导出的是原始日志 ZIP，不是 Markdown | 以自有包补一个 Markdown 导出，或者接受 ZIP | 低 | 实测 + 源码 | |

**本批填完，停下等机主回复。**
