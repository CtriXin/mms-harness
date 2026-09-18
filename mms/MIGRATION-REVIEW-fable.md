# Fable 独立核对：来源意见与本轮处理

用户将另一位 agent 的核对结果转交本 task。这里保留其判断和 Codex 的核对处理，供比较；没有调用、派发或代替 Fable 再次签署审查。总任务仍是 `b5f588a91c604408`，本轮仅更新清单与证据。

## 采纳的判断

采纳“按 PR 枚举会漏掉跨 PR 累积的行为契约”的判断。除 PR 台账外，新增 [guardrails/FEATURES/preferences 逐节覆盖](MIGRATION-CONTRACT-COVERAGE.md)，并把独立建议落到 [总任务](MIGRATION.md) 的稳定 ID。

原文说“补17项”，实际列出14个主要项和5个小项，共19项；19项均采纳为检查项。其“覆盖率约八成”是主观估计，不作为产品完整率或验收数字。原始文本及SHA-256在 [E20](MIGRATION-EVIDENCE.md#e20) 可追溯，未擅自把本次处理写成评审者原话。

## 必须更正或补充的事实

- [#337](https://github.com/CtriXin/multi-model-switch/pull/337)、[#343](https://github.com/CtriXin/multi-model-switch/pull/343)、[#344](https://github.com/CtriXin/multi-model-switch/pull/344)、[#347](https://github.com/CtriXin/multi-model-switch/pull/347) 当前均 MERGED；基线显式推进为 main 4.23.8 /dev 5.1.11。旧清单渲染时间晚于 PR 查询时间，未再次回读导致状态过期；本版同时记录实际回读与固定 commit。
- Codex stable gateway 的默认路径是 `~/.config/mms-next/codex-gateway/.codex`，不是评审引用的 `~/.config/mms/...`。当前 test_codex_hook_trust_contract.py 与 resolver 一致。
- preferences 帮助文档也残留旧根路径，FEATURES 有未发布、无安装包等旧限制；采纳能力语义并检查当前消费者，不把历史说明变成新要求。
- T9a 的 2636 是中间候选。已读最终 closeout：真实installer caller曾有helper-only漏检，后来增强；Preview随后修了Grok漏包。最终GitHub回读每PR8项CI成功；#344报告2638、#347报告3000，无新增失败。没有把本轮metadata回读冒充本轮重跑mutation。
- 原文中的敏感provider实例名不复制成新硬编码策略；保留保守默认、header/sticky/cache、账号绑定的通用合同，逐实际通道验收。

## 独立提出的19项

| 建议 ID | 独立指出的遗漏 | 本轮处理 |
|---|---|---|
| [C09.08](MIGRATION.md#c09) | Codex hook trust 稳定复用，不重复 Hooks need review | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C02.09](MIGRATION.md#c02) | Pi vision relay 注入、池隔离与空池可见 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C02.10](MIGRATION.md#c02) | 识图能力统一真值及未知与不支持的区别 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C09.09](MIGRATION.md#c09) | preferences.toml allowlist 覆盖与人工写入确认 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C09.10](MIGRATION.md#c09) | real HOME / Keychain OAuth 禁止自动恢复与回写 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C08.09](MIGRATION.md#c08) | 会话归档与恢复 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C08.10](MIGRATION.md#c08) | 整段或指定回复处分叉 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C08.11](MIGRATION.md#c08) | 消息复制与会话 Markdown 导出 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C13.10](MIGRATION.md#c13) | 普通会话自动压缩、立即压缩及失败重试 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C13.11](MIGRATION.md#c13) | 斜线命令与动态扩展补全 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C09.11](MIGRATION.md#c09) | diagnostics 的 CLI 与可视化消费入口 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C06.07](MIGRATION.md#c06) | Figma / Pilot MCP 默认关闭及显式 opt-in | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C06.08](MIGRATION.md#c06) | global hook/skill 优先，xmem global-only | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C09.12](MIGRATION.md#c09) | 敏感 provider 保守默认及 cache/sticky 身份合同 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C12.12](MIGRATION.md#c12) | 选择即复制及不安全上下文降级 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C15.06](MIGRATION.md#c15) | 厂商标记与许可、无图标回退 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C05.08](MIGRATION.md#c05) | 文件、引用、Skills 与草稿的定量边界 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C12.13](MIGRATION.md#c12) | 会话按 workspace 分组与折叠状态记忆 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |
| [C13.12](MIGRATION.md#c13) | 对话大纲与提问刻度导航 | 采纳；补具体失败/边界条件，source已核对；原版 T，fork 未迁 |

## 逐节补查额外发现

| 新 ID | 补入的行为 | 来源 |
|---|---|---|
| [C09.13](MIGRATION.md#c09) | 单一配置根及退出 legacy fallback | 本轮契约逐节核对 |
| [C01.09](MIGRATION.md#c01) | provider/account 路由排序与本地使用统计分工 | 本轮契约逐节核对 |
| [C06.09](MIGRATION.md#c06) | session surface 目录、来源预览及禁用草稿 | 本轮偏好文档核对 |
| [C14.09](MIGRATION.md#c14) | workspace 排序、改显示名、移除与原文件保护 | 本轮 FEATURES 逐行核对 |
| [C13.13](MIGRATION.md#c13) | 原生 confirm/select/input/editor 与等待状态 | 本轮 FEATURES 逐行核对 |
| [C13.14](MIGRATION.md#c13) | 运行详情的实际协议、context、Token/cache 与脱敏进程 | 本轮 FEATURES 逐行核对 |
| [C13.15](MIGRATION.md#c13) | 普通会话执行/只读规划的工具边界 | 本轮 FEATURES 逐行核对 |
| [C10.07](MIGRATION.md#c10) | 从已提交 HEAD 打完整源码分享包 | 本轮 #337 实际变化核对 |

## 候选移动与证据归属

| 旧 ID | 新归属 | 处理 |
|---|---|---|
| C25.04 | [C10.06](MIGRATION.md#c10)、[C10.07](MIGRATION.md#c10)、[C11.08](MIGRATION.md#c11)、[C24.03](MIGRATION.md#c24) | 已合并的T9a、源码分享、升级保护与文档分别记录；不再保留候选勾选项 |
| C25.05 | [C10.06](MIGRATION.md#c10)、[C11.08](MIGRATION.md#c11) | #347 Preview实际consumer与Grok完整打包纳入；fork仍未迁 |

#290、#330、#340 仍单列；#308 保留用户要求的“不合入实验”。已合并只改变原版来源状态，不能给 fork 直接打勾。

本版为25组/193检查项：R74、P87、T27、缺口2、候选3。fork已验仍15项。由165增至193来自新增30项、移出2个被拆分的候选ID，不代表本轮实现了28个新功能。

当前结论：独立评审的具体意见已逐项处理，清单对账这一轮完成；功能迁移、后续独立复核和真实用户验收仍未完成。
