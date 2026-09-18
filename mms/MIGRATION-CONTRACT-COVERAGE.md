# MMS 契约与功能枚举覆盖

本页给 [总任务](MIGRATION.md) 增加 PR 之外的两路枚举源：行为契约与用户功能，并补偏好覆盖合同。映射意味着已登记，不意味着这些行为已经在 fork 通过；逐项验证状态仍只在总任务维护。

源码基线：main `4.23.8` / dev `5.1.11`，详情见 [PR 台账](MIGRATION-PR-COVERAGE.md)。本表按 dev 文档逐节/逐行读取，并比较 main 差异；source/test 使用当前 `lib/` 路径。

## 不能直接照抄的旧文档

- `MMS_USER_PREFERENCES.md` 仍有旧 `~/.config/mms` 路径；当前 core resolver、preferences example、single-root 和 Codex trust 测试使用 `~/.config/mms-next`。偏好语义保留，旧根不作为实现要求。
- `FEATURES.md` 开头仍写未发布、仅 loopback、无安装更新、不能跨服务换模型、真实配置尚未对接；这些被后续 PR/运行记录覆盖，分别以 C01/C07/C08/C10/C11 的当前合同为准。
- `AGENT_GUARDRAILS.md` 的旧 issue/committee/提交等待/自动清理段落是工程治理记录，不是要移植的产品功能，也不能覆盖本任务当前 Stride、工作树保护与用户授权。
- main/dev 的未读状态、专注阅读描述不同；保留各自来源，C12.07/.08 按当前实际行为核对，不能把较旧 main 文案当作删除 Preview 能力的依据。
- 文档列出 capability 不代表真实模型实测，费用不是供应商账单；原生分叉不是 worktree 隔离，readonly planning 不是 OS sandbox。

## AGENT_GUARDRAILS.md：逐节

| 来源段落 | 迁移检查项 | 处理 |
|---|---|---|
| [目标](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L5) | [C09.01](MIGRATION.md#c09)、[C09.02](MIGRATION.md#c09)、[C09.13](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [受保护的稳定面](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L12) | [C01.09](MIGRATION.md#c01)、[C09.01](MIGRATION.md#c09)、[C09.10](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [高风险文件](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L24) | [C23.01](MIGRATION.md#c23)、[C23.03](MIGRATION.md#c23) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [保险窗口：private relay / sticky relay / upstream](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L40) | [C09.12](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [Anthropic-First / Cache Guardrail](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L48) | [C02.07](MIGRATION.md#c02)、[C09.12](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [这条链路的额外禁止事项](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L77) | [C09.12](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [这条链路的最小确认问题](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L86) | [C09.12](MIGRATION.md#c09)、[C09.11](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [这条链路的最低验证](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L96) | [C09.11](MIGRATION.md#c09)、[C23.01](MIGRATION.md#c23) | 行为合同已登记；按细项验证等级推进 |
| [Claude 额外限制](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L116) | [C23.01](MIGRATION.md#c23) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [禁止事项](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L127) | [C09.10](MIGRATION.md#c09)、[C09.13](MIGRATION.md#c09)、[C01.09](MIGRATION.md#c01) | 行为合同已登记；按细项验证等级推进 |
| [Single Config Root（2026-09-10，#177）](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L140) | [C09.13](MIGRATION.md#c09)、[C10.05](MIGRATION.md#c10) | 行为合同已登记；按细项验证等级推进 |
| [Global OAuth Hard Cut](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L150) | [C09.10](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [Codex Hook Trust No-Popup Contract](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L166) | [C09.08](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [Vision Capability Single Truth](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L181) | [C02.10](MIGRATION.md#c02) | 行为合同已登记；按细项验证等级推进 |
| [Context Window Single Truth](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L198) | [C02.03](MIGRATION.md#c02) | 行为合同已登记；按细项验证等级推进 |
| [Vision Relay Contract](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L223) | [C02.09](MIGRATION.md#c02) | 行为合同已登记；按细项验证等级推进 |
| [Claude Code 和 OpenCode 走 MCP](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L234) | [C02.08](MIGRATION.md#c02) | 行为合同已登记；按细项验证等级推进 |
| [User Preferences And Human Gate](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L246) | [C09.09](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [Hook / Skill Priority](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L257) | [C06.07](MIGRATION.md#c06)、[C06.08](MIGRATION.md#c06)、[C06.09](MIGRATION.md#c06) | 行为合同已登记；按细项验证等级推进 |
| [必须先停下来确认的情况](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L267) | [C23.01](MIGRATION.md#c23) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [允许的改动方式](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L278) | [C23.01](MIGRATION.md#c23) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [改动前检查](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L288) | [C23.01](MIGRATION.md#c23)、[C09.10](MIGRATION.md#c09) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [改动后最低验证](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L298) | [C23.01](MIGRATION.md#c23)、[C23.03](MIGRATION.md#c23)、[C09.11](MIGRATION.md#c09) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [Push 前 Fresh User Gate](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L309) | [C23.05](MIGRATION.md#c23)、[C09.08](MIGRATION.md#c09)、[C09.13](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [迭代与提交隔离](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L331) | [C24.02](MIGRATION.md#c24) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [交付要求](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L350) | [C23.04](MIGRATION.md#c23) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |
| [反例](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L358) | [C01.09](MIGRATION.md#c01)、[C09.10](MIGRATION.md#c09) | 行为合同已登记；按细项验证等级推进 |
| [一句话规则](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/AGENT_GUARDRAILS.md#L367) | [C23.01](MIGRATION.md#c23) | 工程约束/验收方法，保留适用原则；不恢复旧工作流 |

## FEATURES.md：逐条用户行为与限制

| 来源行 / 行为 | 迁移检查项 | 核对说明 |
|---|---|---|
| [L3 2026-09-08。本地真实 Pi Web 迭代，尚未公开发布。Web 为新增入口，复用 MMS 的模型解析、选中…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L3) | [C09.01](MIGRATION.md#c09)、[C10.01](MIGRATION.md#c10) | 历史intro；已发布与安装状态已过时 |
| [L9  /  开始工作  /  选工作文件夹、模型及独立通道；首条消息前选择真实支持的 effort，默认继承 MMS 生…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L9) | [C14.01](MIGRATION.md#c14)、[C02.04](MIGRATION.md#c02)、[C13.15](MIGRATION.md#c13) | cwd/model/channel/effort/普通只读规划 |
| [L10  /  Skills  /  新会话与续聊按当前 workspace 搜索、多选；`/skill:name` 补全；…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L10) | [C06.01](MIGRATION.md#c06)、[C06.02](MIGRATION.md#c06)、[C05.08](MIGRATION.md#c05) | 实际Skills全文注入与补全 |
| [L11  /  首次连接  /  在独立配置中填写地址与 Key → 拉取或手填模型 → 搜索勾选 → 脱敏预览保存 → 查…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L11) | [C01.03](MIGRATION.md#c01)、[C01.04](MIGRATION.md#c01) | 真实连接、取消清除临时Key、revision冲突 |
| [L12  /  模型库  /  同名模型分组，展开不同通道；显示原 Pi 模型输入/上下文/协议/effort；收藏、通道备…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L12) | [C12.01](MIGRATION.md#c12)、[C12.03](MIGRATION.md#c12)、[C01.06](MIGRATION.md#c01) | 模型分组和偏好；持久化范围核对当前实现 |
| [L13  /  运行状态  /  侧栏区分正在输出、执行工具、等待回答、未读「已完成」和已读「待命」；打开会话会自动滚到最新…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L13) | [C12.07](MIGRATION.md#c12)、[C13.14](MIGRATION.md#c13) | main/dev描述不同，不能仅凭历史文案取舍 |
| [L14  /  看执行过程  /  流式回复、提供方实际返回的 Thinking（可展开）、工具参数和结果、工具图片、错误和…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L14) | [C13.01](MIGRATION.md#c13)、[C13.13](MIGRATION.md#c13) | 真实Thinking/tool图片/原生交互 |
| [L15  /  文件夹与资料  /  会话按 workspace 分组并可折叠，记住展开状态；目录逐级浏览、文本/Markd…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L15) | [C12.13](MIGRATION.md#c12)、[C14.04](MIGRATION.md#c14)、[C05.01](MIGRATION.md#c05) | workspace分组/文件/diff |
| [L16  /  本地文件  /  系统文件选择器、粘贴绝对路径或 file:// 路径，直接引用原文件；图片缩略预览、移除、…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L16) | [C14.07](MIGRATION.md#c14)、[C14.08](MIGRATION.md#c14)、[C05.08](MIGRATION.md#c05) | 原路径与无路径附件分开 |
| [L17  /  消息控制  /  停止当前工作；工作中追加消息进入 follow-up 队列，查看和清空待发送队列  / ](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L17) | [C13.03](MIGRATION.md#c13)、[C13.04](MIGRATION.md#c13) | stop/follow-up队列 |
| [L18  /  会话管理  /  重命名、归档/恢复、整段或指定回复处分支、消息复制、Markdown 导出；浏览器刷新与进…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L18) | [C12.06](MIGRATION.md#c12)、[C08.09](MIGRATION.md#c08)、[C08.10](MIGRATION.md#c08)、[C08.11](MIGRATION.md#c08)、[C08.01](MIGRATION.md#c08) | 归档/分叉/导出/复制/持久化 |
| [L19  /  运行参数  /  Thinking、自动压缩、立即压缩（支持附加保留要求）、失败自动重试；查看模型/协议、上…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L19) | [C13.10](MIGRATION.md#c13)、[C13.14](MIGRATION.md#c13) | 普通会话压缩/retry/运行详情 |
| [L20  /  任务模板  /  导出首条任务说明、模型偏好和规划开关；接收方导入后选择自己的模型服务和文件夹，检查草稿再发…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L20) | [C03.01](MIGRATION.md#c03)、[C03.05](MIGRATION.md#c03)、[C03.07](MIGRATION.md#c03)、[C03.08](MIGRATION.md#c03) | Recipe不携带作者配置 |
| [L21  /  阅读与操作  /  连续工具分组与命令/路径摘要；同轮身份合并；消息操作 hover/focus；助手回复可…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L21) | [C12.08](MIGRATION.md#c12)、[C13.11](MIGRATION.md#c13)、[C13.12](MIGRATION.md#c13)、[C08.11](MIGRATION.md#c08) | 专注阅读/大纲/命令；补齐消息级操作 |
| [L22  /  草稿  /  普通新任务与会话草稿保留 7 天，刷新恢复文字、Skills、引用和附件；图片缩略图从本地服务…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L22) | [C14.08](MIGRATION.md#c14)、[C05.08](MIGRATION.md#c05) | 7天草稿和附件恢复 |
| [L24 等待回答只计入执行工具明确发起的问题，运行异常单独列出。进程 idle 不是错误；已归档会话可恢复。](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L24) | [C13.13](MIGRATION.md#c13)、[C08.09](MIGRATION.md#c08) | 等待由工具发起，idle不是错误 |
| [L28 `/help`、`/files`、`/plan on / off`、`/thinking LEVEL`、`/comp…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L28) | [C13.11](MIGRATION.md#c13) | 所有命令+动态列表+键盘选择 |
| [L32 模型与通道组合仍由 MMS 解析，不另建一套账号或 fallback 规则。运行详情把所选服务、通道、协议和原生缓存…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L32) | [C01.01](MIGRATION.md#c01)、[C03.05](MIGRATION.md#c03)、[C13.14](MIGRATION.md#c13) | 模型真值与导出责任边界 |
| [L36 - 真实 `~/.config/mms*` 仍只读接入，新 Web 尚未对接这份配置的编辑与 Registry 发布…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L36) | [C01.03](MIGRATION.md#c01)、[C01.04](MIGRATION.md#c01)、[C09.09](MIGRATION.md#c09) | 已有修改通道PR覆盖旧未接编辑限制 |
| [L37 - 当前原生 Web harness 为 Pi。不是 Claude/Codex/Kimi CLI 的通用适配器，也没…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L37) | [C09.01](MIGRATION.md#c09)、[C08.02](MIGRATION.md#c08)、[C08.03](MIGRATION.md#c08) | Web Pi-only不推导其它CLI均受控；历史adoption按后续实现 |
| [L38 - Thinking 只展示上游实际提供的内容；模型未提供时不制造思考文本。用量来自 Pi，费用不是供应商实际账单。](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L38) | [C13.14](MIGRATION.md#c13) | 不制造Thinking/实际账单 |
| [L39 - 普通本地文件引用无上传大小限制，不读入提示全文；仅保存原路径元数据，原文件改变后读取最新内容，原文件移动/删除则…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L39) | [C14.07](MIGRATION.md#c14)、[C14.08](MIGRATION.md#c14)、[C05.08](MIGRATION.md#c05) | 上限、路径、预览与PDF/Office限制分开 |
| [L40 - 当前会话运行参数可调，跨模型/服务切换需新建会话。完整 Kimi parity 仍缺会话全文搜索、批量会话操作、…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L40) | [C08.05](MIGRATION.md#c08)、[C08.06](MIGRATION.md#c08)、[C13.10](MIGRATION.md#c13) | 不能跨模型属于旧限制；全文搜索/批量等缺失不能冒充已有 |
| [L41 - 文件浏览和 diff 只读；隐藏文件、凭据、越界 symlink 和依赖目录过滤。没有直接编辑文件、提交 Git…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L41) | [C05.06](MIGRATION.md#c05)、[C14.04](MIGRATION.md#c14) | 文件/diff只读，过滤凭据和越界 |
| [L42 - 分支创建独立原生对话历史，工作文件夹仍共用，不等于 Git worktree 隔离。](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L42) | [C08.10](MIGRATION.md#c08) | 分叉共用workspace |
| [L43 - 只读规划由 Web 附加的 Pi extension 在 tool_call 上拦截写入/shell/其他工具，…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L43) | [C13.15](MIGRATION.md#c13) | 普通只读planning工具拦截，非OS sandbox |
| [L44 - 本地 HTTP 仅监听 127.0.0.1。开发启动需要现有 Pi/Node/Python 与前端构建；尚无面向…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L44) | [C07.01](MIGRATION.md#c07)、[C10.01](MIGRATION.md#c10)、[C11.01](MIGRATION.md#c11) | 旧loopback/未发布限制已被后续实现覆盖 |
| [L48 阅读 [Kimi Web 官方说明](https://github.com/MoonshotAI/kimi-cli/…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L48) | [C24.02](MIGRATION.md#c24) | 历史参考与许可声明，不据此复制第三方实现 |
| [L50 本轮 109 项 Web 测试及 4 项 subtests 通过；其中原生 Pi + 本地 provider fix…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L50) | [C23.04](MIGRATION.md#c23)、[C13.15](MIGRATION.md#c13)、[C08.10](MIGRATION.md#c08) | 历史fixture/浏览器证据，不能等同全部外部provider |
| [L52 模型选择迭代额外验证：首条请求默认 effort 和手选覆盖实际进入本地 provider；恢复会话保留 effor…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L52) | [C02.04](MIGRATION.md#c02)、[C06.02](MIGRATION.md#c06)、[C05.08](MIGRATION.md#c05) | effort实际生效、Skills总预算 |
| [L54 状态迭代参照本机 Glint 的 PaneAgentState 与 Pi bridge 的 agent_settle…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L54) | [C12.07](MIGRATION.md#c12)、[C13.14](MIGRATION.md#c13) | 历史native状态观察 |
| [L56 2026-09-08 补充：状态/主题与 hover/工具分组已通过 native Pi 和浏览器回归。模型连接向导…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L56) | [C01.03](MIGRATION.md#c01)、[C01.04](MIGRATION.md#c01)、[C01.02](MIGRATION.md#c01) | 历史双服务/取消/冲突/窄屏记录 |
| [L58 2026-09-08 阅读修复：连续 hover 复制区域、明确复制反馈、键盘/触屏入口；assistant 缺空格…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L58) | [C12.08](MIGRATION.md#c12)、[C08.11](MIGRATION.md#c08)、[C03.04](MIGRATION.md#c03) | 复制反馈、Markdown可读性与模板 |
| [L62 设置 → 模型与通道 → 管理通道模型：支持现有通道拉取模型、搜索、手工补充、勾选可用模型和保存 MMF 默认 ef…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L62) | [C01.04](MIGRATION.md#c01)、[C01.05](MIGRATION.md#c01)、[C01.06](MIGRATION.md#c01) | 编辑前预览/人工确认 |
| [L64 当前 effort 编辑以 Web 使用的 Pi 路由能力为准；不支持 Pi 或仍由旧版 model-policy.…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L64) | [C01.06](MIGRATION.md#c01)、[C02.04](MIGRATION.md#c02) | 旧高级工具限制被后续整合覆盖，保留真实能力拒绝 |
| [L66 2026-09-08 常用配置收尾：现有通道 URL/Key 可在同一模型设置页编辑并预览；模型列表连接检查与生成验…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L66) | [C01.04](MIGRATION.md#c01)、[C02.04](MIGRATION.md#c02) | 恢复自动、隔离验证的历史记录 |
| [L70 通道模型页新增能力列：可读取图片、上下文长度可直接编辑，与默认 effort 走同一条预览确认写入通道。每行显示这两…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L70) | [C02.02](MIGRATION.md#c02)、[C02.10](MIGRATION.md#c02) | 能力来源和人工编辑 |
| [L72 这里设置的识图能力现在是全局真值。`_pi_model_input_types()` 把用户设置排在最前，其次是 P…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L72) | [C02.10](MIGRATION.md#c02) | vision truth顺序 |
| [L74 Pi 的图片中转没有内置模型名单。候选池是当前通道里能力判定为能读图的模型，跟着你的配置走；识图时从池子里随机取，失…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L74) | [C02.09](MIGRATION.md#c02) | vision pool硬不变量 |
| [L76 侧栏工作区区域 hover 出现收起/展开全部，以及排序菜单（手动排序、按最后编辑时间）。每个文件夹 hover 出…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L76) | [C14.09](MIGRATION.md#c14)、[C12.13](MIGRATION.md#c12) | 排序/改显示名/移除并保留原文件与会话 |
| [L80 过程开关从会话末尾移到工作栏那一行，跟随滚动常驻，不再需要滚到底才能收起全部过程。](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L80) | [C13.02](MIGRATION.md#c13)、[C12.08](MIGRATION.md#c12) | 常驻过程开关 |
| [L82 侧栏 hover 改为槽位互换：会话行右侧的操作菜单占用状态点原来的位置，标题截断点不随 hover 移动；工作区操…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L82) | [C12.11](MIGRATION.md#c12)、[C12.06](MIGRATION.md#c12) | hover槽位/焦点环/disabled/danger交互 |
| [L84 设置 → 使用新增「选择即复制」，默认关闭。开启后在对话区选中文字即写入剪贴板。它写的是系统剪贴板，会覆盖原有内容，…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L84) | [C12.12](MIGRATION.md#c12) | 选择即复制默认关闭及LAN HTTP限制 |
| [L88 模型列表、最近在做和会话行的厂商标记来自 `@lobehub/icons-static-svg`（MIT），文件放在…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L88) | [C15.06](MIGRATION.md#c15) | MIT图标和首字母回退 |
| [L90 设置弹窗内不再有嵌套滚动。原来模型列表和通道模型表各自在几百像素的小窗里滚，外层不动。现在整个面板作为一个滚动区,内…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L90) | [C12.09](MIGRATION.md#c12)、[C12.11](MIGRATION.md#c12) | 设置单滚动区与三档宽度 |
| [L94 通道模型页的能力列改为一行:可读取图片与上下文长度并排。当某个模型的值和 MMF 目录里已知的能力不一致时,该行出现…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L94) | [C02.02](MIGRATION.md#c02) | 恢复目录默认需读取override之前事实 |
| [L96 设置弹窗改为单一滚动区后,模型详情面板会随滚动停在顶部,不再滑出视野。为此该面板的外框不再裁剪,圆角移到左右两栏自身…](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/FEATURES.md#L96) | [C12.09](MIGRATION.md#c12) | 详情面板sticky与外框裁剪 |

## MMS_USER_PREFERENCES.md：逐节

| 来源段落 | 检查项 | 当前合同 |
|---|---|---|
| [Path](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L5) | [C09.09](MIGRATION.md#c09)、[C09.13](MIGRATION.md#c09) | 文档旧根路径被source resolver纠正 |
| [Overlay Order](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L22) | [C09.09](MIGRATION.md#c09) | 四层覆盖、本次确认不落盘 |
| [Example](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L34) | [C09.09](MIGRATION.md#c09)、[C06.09](MIGRATION.md#c06) | 示例受实际allowlist与退休项约束 |
| [Allowed Keys](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L80) | [C09.09](MIGRATION.md#c09)、[C06.07](MIGRATION.md#c06)、[C06.09](MIGRATION.md#c06) | CLI/surface/assets过滤及opt-in |
| [Denied / Ignored Keys](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L146) | [C09.09](MIGRATION.md#c09)、[C09.10](MIGRATION.md#c09) | 不允许凭据和路由等混进偏好 |
| [Human Gate](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L158) | [C09.09](MIGRATION.md#c09) | 真实配置需用户确认、备份、审计 |
| [LLM / Agent Instructions](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L182) | [C09.09](MIGRATION.md#c09) | 只读解释/生成diff不等于写入许可 |
| [Lazy Session Assets](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L192) | [C06.08](MIGRATION.md#c06)、[C06.09](MIGRATION.md#c06) | 会话资产来源优先级；全局配置保护 |
| [WebUI 能力目录](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/MMS_USER_PREFERENCES.md#L216) | [C06.09](MIGRATION.md#c06) | 来源分组、CLI-scoped禁用、独立偏好草稿 |

## 其他核对入口

- CLI 诊断命令：当前 README 与 `lib/mms_core.py` 的 `doctor/models/routes/exposure/test/logs` 分派，见 C09.11；未实际执行联网 smoke。
- T9a / onboarding：main 专有的 [源码分享脚本](https://github.com/CtriXin/multi-model-switch/blob/56b6685543eb055baace4eeed00676bca3c82e32/scripts/make_share_zip.sh)，真实消费者与发布记录见 [E22](MIGRATION-EVIDENCE.md#e22)。
- 本页只是索引；新补契约多数标 T，是 source/test 已确认但本轮未重跑。不能因扫描逐节覆盖就标“零漏项”或签发全部ready。
