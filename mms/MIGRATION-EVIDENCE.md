# MMS 全量迁移的证据索引

快照时间：2026-09-18T16:00:02+08:00。本页是 [总任务](MIGRATION.md) 的证据说明；能力状态只在总任务维护。R/P/T 是本清单的证据分级，与旧审计的迁移分类字母无关。

本机证据根目录：`/Users/xin/.local/share/stride/tasks/`。下列路径相对此目录；同机 agent 可直接读取。GitHub 读者无法读取本机报告，应将 R 当作“已阅读历史记录”，不能当作可独立重现的日志附件。没有把凭据、原始模型请求或私有服务地址发布进仓库。

<a id="e01"></a>
## E01 · 4.0 初版 Web/Pi 的实际运行与安装

记录 166 Web tests、4 subtests、473 fresh-user tests；真实 Pi + loopback model 验证同 route 复用、跨 route 隔离、历史、错误与设置保护；另有 clean HOME 安装、HTTP assets/hash 回读。

**边界：** 只覆盖当时版本与记录内用例。Web 主链是 Pi-only；loopback 不是实际外部 provider；不能推导当前全版本或所有 CLI 已验。

公开 PR：[#111](https://github.com/CtriXin/multi-model-switch/pull/111)。

- 本机 `855b1bed42aa43bb/components/mms-web/workspace/.ai/regression-reports/2026-09-09-mms-web-v4.md`；SHA-256 `faca4bebe8128a5aabde75bd2a78fea49d039532477853d6671dabdc9baa7600`。

<a id="e02"></a>
## E02 · 成果与项目资料 PR 的交付声明

#115 报告真实 Pi + local fixture 的成果生成、快照、比较、重启、过期引用拒绝以及 390px/CSP；#116 报告资料 revision、并发冲突、损坏保护与实际消费区分。

**边界：** 本轮读过 PR 正文，未重新打开每份原始执行日志，所以标 P。原 PR 对未知交付、旧历史、能力范围的限制继续有效。

公开 PR：[#115](https://github.com/CtriXin/multi-model-switch/pull/115)、[#116](https://github.com/CtriXin/multi-model-switch/pull/116)。

- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/115/metadata.json`；SHA-256 `c3bac814de5ce465485b2777b4cdb641621efa3032a27aab869028aea25f44a2`。
- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/116/metadata.json`；SHA-256 `8f034f179ee74b87449f1d769e434a7c03fa1e0ecdf719b259ed36ffc7459487`。

<a id="e03"></a>
## E03 · 项目定位、Recipe 与跨独立安装的 PR 声明

#128 报告项目名搜索、可选 zoxide、历史记忆和文件正文位置；#143 报告 v1/v2、变量、requirements、导出预览/清理、A→B→A 预检保护及新 HOME 导入。

**边界：** 仅 P；新 HOME 验证不等同两台真实机器。不能用 fork 的 parser 实测倒推原版整个 GUI 已验。

公开 PR：[#128](https://github.com/CtriXin/multi-model-switch/pull/128)、[#143](https://github.com/CtriXin/multi-model-switch/pull/143)。

- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/128/metadata.json`；SHA-256 `76dfafcf3e114720136e97d08d8e794ea67c0a48da1edd477d92a4c7a89d27dc`。
- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/143/metadata.json`；SHA-256 `fa3b3c2d71c88f21e96483a4213f0538bb129a4109463907a9543c3d4a193582`。

<a id="e04"></a>
## E04 · 分散的小 PR、当前 source/test 索引

每个 C 组保留关联 PR 和固定 dev 快照的 source/test 入口；PR 全表见 MIGRATION-PR-COVERAGE.md。已读取关键 PR 正文，并核对所有列出的 source/test 路径确实存在。

**边界：** 这是检索线索和 PR 声明 P，不是本轮逐个重跑全部 PR。#155 当时报告存在无关 fresh-user 失败；#329 的 viewport 记录不等同真实手机；adapter、敏感 relay 与缓存需逐路验证。

公开 PR：[#155](https://github.com/CtriXin/multi-model-switch/pull/155)、[#204](https://github.com/CtriXin/multi-model-switch/pull/204)、[#211](https://github.com/CtriXin/multi-model-switch/pull/211)、[#324](https://github.com/CtriXin/multi-model-switch/pull/324)、[#329](https://github.com/CtriXin/multi-model-switch/pull/329)。

<a id="e05"></a>
## E05 · context 单一来源

记录统一 resolver、四类 harness 消费端和 PR #233 的 653 fresh-user/CI 检查。

**边界：** 未在该记录中完成本机安装重启验证；不能用 metadata 存在证明真实 provider 接受对应窗口。

公开 PR：[#233](https://github.com/CtriXin/multi-model-switch/pull/233)。

- 本机 `b5f588a91c604408/workspace/.ai/regression-reports/2026-09-12-context-window-single-truth.md`；SHA-256 `4015fba379b7bcb0f02f81c2a3fedd4ef1a9d020d222a2421db242e1d3aa97eb`。

<a id="e06"></a>
## E06 · BTW 与聊天控制的限定证据

BTW 报告先有 UI/mock，后补 route-backed 回答与实际 MiniMax 通道；包含 12 route、18 backend、421 Web tests。#221 则报告 steer/interrupt/queue 等合约与测试。

**边界：** 旧 BTW 实际 smoke 时主任务已停止；忙碌主任务并发未跑，OpenAI-only fallback 仅 stub。后续 #258/#259 改为 native extension，旧实测不能直接签发当前 native 实现；故本清单 BTW 行降为 P。

公开 PR：[#221](https://github.com/CtriXin/multi-model-switch/pull/221)、[#258](https://github.com/CtriXin/multi-model-switch/pull/258)、[#259](https://github.com/CtriXin/multi-model-switch/pull/259)、[#281](https://github.com/CtriXin/multi-model-switch/pull/281)、[#286](https://github.com/CtriXin/multi-model-switch/pull/286)、[#294](https://github.com/CtriXin/multi-model-switch/pull/294)。

- 本机 `b5f588a91c604408/workspace/.ai/regression-reports/2026-09-11-btw-pilot-ui.md`；SHA-256 `eb45d4090e29e84ef23357bdcb72d5d22e32faa46a603f03dc0a5f32b33da0ee`。
- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/221/metadata.json`；SHA-256 `a58ba576ac6026ad40d522570cb3a32728056791bbdfc1a4208d72bd9bea032f`。

<a id="e07"></a>
## E07 · Fleet/#295 只读 worker 与真实调用链

记录 native Pi + loopback 只读 allowlist（read/grep/find/ls）、write/bash 拒绝、禁扩展；受控子进程实际 model preset、失败回收、owner/pending/history/memory 隔离；批准、once 日程和 390px 用例；最终 2908 pytest、750 fresh、255 Web。

**边界：** 有真实本地 runtime，但没有真实外部 provider 全矩阵。Windows Server CI 不等同桌面。#295 final delta 不是 Fleet 全部源码，直接提交也在历史 CSV 追踪。

公开 PR：[#295](https://github.com/CtriXin/multi-model-switch/pull/295)。

- 本机 `7b37a8aff257410b/components/fleet-repair/workspace/.ai/regression-reports/2026-09-17-fleet-repair.md`；SHA-256 `a1419d3038386cb32f739b6056f6a0d11fc9d72fe36cd98eb3a88b7eada1b847`。

<a id="e08"></a>
## E08 · 模型、effort、focus 与交互修复

真实 WebApp + fake child 验证 focus/dirty guard、effort 409 后保留菜单和重试、Bot pending callback、Fleet 无效选择不派发、日程 focus 和 390px 触控；报告 266 Web、79 backend。

**边界：** native confirm 的人工 Cancel 没有实按，部分通过返回值模拟。对话创建/主题/全部日程入口不能仅靠 focus 报告算全验；相关复合项保守标 P。

公开 PR：[#311](https://github.com/CtriXin/multi-model-switch/pull/311)、[#314](https://github.com/CtriXin/multi-model-switch/pull/314)、[#320](https://github.com/CtriXin/multi-model-switch/pull/320)、[#323](https://github.com/CtriXin/multi-model-switch/pull/323)、[#331](https://github.com/CtriXin/multi-model-switch/pull/331)、[#332](https://github.com/CtriXin/multi-model-switch/pull/332)。

- 本机 `7b37a8aff257410b/components/interaction-audit/workspace/.ai/regression-reports/2026-09-17-interaction-fixes.md`；SHA-256 `c046431b1afcd1cf4ab42d41df6c36ae0997100eb573296aaee5a033b481ccd0`。
- 本机 `7b37a8aff257410b/components/interaction-main/workspace/.ai/regression-reports/2026-09-17-shared-interactions.md`；SHA-256 `9ee4283010dcd894efe7a7d0181a54f0fc06dba7691a5c5628932800c742011f`。

<a id="e09"></a>
## E09 · T8 接线、目录与 CI

已读取现成报告：14 mutation 检查、真实 WebApp 目录路由/折叠/Arrow/390px、Windows 原子写及四个 Server 矩阵；最终 main 2560 / dev 2919 zero-failure 记录。

**边界：** 没有发起任何 Claude 交互。SSR/mock 与模拟 viewport 不是实体手机；部分产品保证仍须真实 provider。

公开 PR：[#325](https://github.com/CtriXin/multi-model-switch/pull/325)、[#326](https://github.com/CtriXin/multi-model-switch/pull/326)、[#333](https://github.com/CtriXin/multi-model-switch/pull/333)、[#334](https://github.com/CtriXin/multi-model-switch/pull/334)、[#335](https://github.com/CtriXin/multi-model-switch/pull/335)、[#336](https://github.com/CtriXin/multi-model-switch/pull/336)。

- 本机 `7b37a8aff257410b/components/claude-tail-main/workspace/.ai/regression-reports/2026-09-18-claude-tail.md`；SHA-256 `787336e2a38fde172535d0ea08a107f3af64b12bc22c1a17515d701765854ee4`。

<a id="e10"></a>
## E10 · 远程认证、真实本机升级与回滚

报告 96 targeted tests、5 mutation、真实 HTTP/guardian 鉴权；本机 4.22.4→4.23.5 安装恢复、11 会话保持、LAN/token 恢复、3 地址已认证 200/无认证 401、22 bundle hashes。

**边界：** 本轮只读取历史记录，没有重新升级安装。未用实体手机/外部电脑，未测试所有外网入口或外部模型。

公开 PR：[#338](https://github.com/CtriXin/multi-model-switch/pull/338)、[#339](https://github.com/CtriXin/multi-model-switch/pull/339)。

- 本机 `7b37a8aff257410b/components/update-auth-main/workspace/.ai/regression-reports/2026-09-18-update-auth.md`；SHA-256 `3eb8df3d5e164141345e2d028eee9b4a5d2a09c542ff70cd741b6bcc793b4357`。
- 本机 `7b37a8aff257410b/components/update-auth-main/workspace/.ai/regression-reports/2026-09-18-local-stable-recovery.md`；SHA-256 `30913b474327bf86c7ca23a98e1c488b0ddbc934ab92d305a393dc0197aac7f3`。

<a id="e11"></a>
## E11 · 失败会话干净接续

#341/#342 已 merge；96 focused、297 dev /122 main Web；真实 Pi + loopback 新会话仅 developer/user，原日志 hash 保持，390px focus。

**边界：** 没有升级本机安装；不是全部 provider 的故障恢复实跑。

公开 PR：[#341](https://github.com/CtriXin/multi-model-switch/pull/341)、[#342](https://github.com/CtriXin/multi-model-switch/pull/342)。

- 本机 `06c34adbc68845ca/components/main-recovery/workspace/.stride-output/RESULT.md`；SHA-256 `e19c1ab8c640202a41d127206f24d1ee7e18aaced326805d683caa4979eb093f`。

<a id="e12"></a>
## E12 · 保存默认 effort 即时刷新

#345/#346 已 merge 为 4.23.7 /5.1.10；真实 App→Settings→Models→ChannelModels→useLaunchFacts 调用链，3 tests/2 mutation，browser fixture max→high 不 reload；125/300 Web 与 731/751 fresh 记录。

**边界：** 真实表单链使用 fixture，不代表所有 provider；当时用户安装仍 4.23.5，不能把远端 merge 当本机生效。

公开 PR：[#345](https://github.com/CtriXin/multi-model-switch/pull/345)、[#346](https://github.com/CtriXin/multi-model-switch/pull/346)。

- 本机 `7b37a8aff257410b/components/effort-refresh-main/workspace/.ai/regression-reports/2026-09-18-effort-refresh.md`；SHA-256 `c06b672174b104ac5622fc4f108706e9e394c476e1d42315af365dcff9dcc27d`。

<a id="e13"></a>
## E13 · Bot、计划、通知与 retry 原始交付声明

#242 汇总 T1/T2/T3、129 focused tests、持久身份、幂等、中断、DAG/mailbox/memory、优先级与串行、worker 身份、执行前 30s/2m/8m 有界 retry、HMAC/inbox。

**边界：** 本轮读 PR 正文，未逐个打开 T2/T3 原始运行档；标 P。真实桌面通知弹出未验证，不能把通知 API 或系统设置当弹窗验收。

公开 PR：[#239](https://github.com/CtriXin/multi-model-switch/pull/239)、[#240](https://github.com/CtriXin/multi-model-switch/pull/240)、[#241](https://github.com/CtriXin/multi-model-switch/pull/241)、[#242](https://github.com/CtriXin/multi-model-switch/pull/242)、[#254](https://github.com/CtriXin/multi-model-switch/pull/254)、[#265](https://github.com/CtriXin/multi-model-switch/pull/265)。

- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/242/metadata.json`；SHA-256 `bef734fe34bda416707afbf5b7a6c11df264dc57c14745dd4057843d20ec47a9`。

<a id="e14"></a>
## E14 · 日程及计划步骤指定模型

已阅读 pinned dev 的 docs/mms-web/design/t5d/SUMMARY.md：实际 Kimi owner / DeepSeek worker / GLM override / MiniMax pending，基线错误与修后一次性会话路由、主会话记忆保持。日程 PR 报告 300s 实际两次触发及 259 focused tests。

**边界：** 计划 route 的具体运行记录属 R；日程其余各项目前仅 PR/测试声明 P。#302 最初有未挂载入口与未测 mobile 的限制，不能从设计图推导后续入口全通过。

公开 PR：[#278](https://github.com/CtriXin/multi-model-switch/pull/278)、[#302](https://github.com/CtriXin/multi-model-switch/pull/302)、[#306](https://github.com/CtriXin/multi-model-switch/pull/306)、[#310](https://github.com/CtriXin/multi-model-switch/pull/310)、[#331](https://github.com/CtriXin/multi-model-switch/pull/331)。

固定版本实录：[docs/mms-web/design/t5d/SUMMARY.md](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/design/t5d/SUMMARY.md)。

- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/278/metadata.json`；SHA-256 `69442f15436f225e6f46c542371d8f65822eaf9bfaf2ba0f8a5ade933ed6550a`。
- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/302/metadata.json`；SHA-256 `16da8be23213a3cacad99135e9713b62d778632916cca9cdfbd2690c3bb8ecdd`。
- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/306/metadata.json`；SHA-256 `07ee5e073fe32c80c94e219b4536d4999054f3e477edf412e7da1a8f0ba6459f`。
- 本机 `8b76aee15b3c41f7/workspace/.stride-output/dsh-audit/prs/310/metadata.json`；SHA-256 `fe3a87c7bde870f602f8f7ad3b5d916132e05caddb3bafe644a43859178a248d`。

<a id="e15"></a>
## E15 · Windows Native Preview

已有 35 tests 的 UTF-8/emoji/工具后回复修复记录，以及 Windows Server 验收记录；后续 E07/E09 有四个 Server job。

**边界：** Windows Desktop 实体用户的安装、目录、服务、升级全路径仍无完整证据；Server PASS 不算 desktop Ready。

公开 PR：[#231](https://github.com/CtriXin/multi-model-switch/pull/231)、[#244](https://github.com/CtriXin/multi-model-switch/pull/244)、[#246](https://github.com/CtriXin/multi-model-switch/pull/246)、[#248](https://github.com/CtriXin/multi-model-switch/pull/248)、[#249](https://github.com/CtriXin/multi-model-switch/pull/249)、[#250](https://github.com/CtriXin/multi-model-switch/pull/250)、[#251](https://github.com/CtriXin/multi-model-switch/pull/251)、[#256](https://github.com/CtriXin/multi-model-switch/pull/256)、[#318](https://github.com/CtriXin/multi-model-switch/pull/318)。

- 本机 `b5f588a91c604408/workspace/.ai/regression-reports/2026-09-14-v4213-windows-utf8-session-poll.md`；SHA-256 `d155e796b242f36eb0995324c82b2ca978a8f0a6beb9ce7149be3d161905144b`。

<a id="e17"></a>
## E17 · 当前 fork 与 MMS adapter 的实际验收

上一阶段实际执行：15 adapter tests、135 focused UI、94 brand tests、完整 build/typecheck；导入 approved bundle，真实 DeepSeek Low 经 /v1/messages budget 2048、GPT High 经 /v1/responses high；真实 pwd、Recipe 要求拒绝、独立安装重启续聊、390px；安装与源码的 126 client hashes 一致。精确 fork 功能 commit 和运行副本见本机报告。

**边界：** 只覆盖记录内场景。68 routes 导入不等于 68 实跑；model/effort/pwd 为已迁子集。新清单文档不会改变运行副本；LAN、Bot、Fleet、Windows 等尚未迁移验收。

- 本机 `b5f588a91c604408/workspace/.ai/regression-reports/2026-09-18-dsh-mms.md`；SHA-256 `1f0e17af4e3ffae6c7ed0078a8174d1409206bb2964ac72a57f5a0fd91627f2a`。
- 本机 `b5f588a91c604408/workspace/.ai/regression-reports/2026-09-18-mms-harness-fork.md`；SHA-256 `7eb6e528d6e2f119c373986515e533747e4a366548a8d70b35f38400bbd8cfb6`。

<a id="e18"></a>
## E18 · 跨 Stable/Preview 数据兼容及已知缺口

报告未知 owner 的列表/详情隔离及 schema2 roundtrip 不改写 Bot/schedule/memory。

**边界：** 历史报告明确 mutation 端点仍有残留，fresh gate 当时有一项 baseline failure。本轮未重核当前源码是否已修，故缺口保持待核对，不能直接断言当前仍有 bug，也不能签发全 ready。

公开 PR：[#271](https://github.com/CtriXin/multi-model-switch/pull/271)、[#272](https://github.com/CtriXin/multi-model-switch/pull/272)、[#273](https://github.com/CtriXin/multi-model-switch/pull/273)、[#274](https://github.com/CtriXin/multi-model-switch/pull/274)。

- 本机 `b5f588a91c604408/workspace/.ai/regression-reports/2026-09-16-t6a-channel-switch-gate.md`；SHA-256 `3cf46049fa73e7cee25ed023a76e61275f58ec6eda9b92627ae07dfef5acd691`。

<a id="e19"></a>
## E19 · 全部 PR 与 commit 的来源清点

旧审计 198 PR、702 unique commits、221 merges、51 direct/unattributed；本轮 GitHub 回读更新到 203 PR，按固定 main/dev 联集列出 758 commits/239 merges。检查每个 PR 有 C 组归属和每个 source/test 路径存在。

**边界：** 归属表和路径存在不等于代码审查、冲突重演或当前版重跑。旧审计的 plugin-only/不 fork 建议已失效；这里只继承事实索引，不继承该建议。

- 本机 `8b76aee15b3c41f7/workspace/docs/dsh-migration-audit/inventory.json`；SHA-256 `a01f91b052998a5ef19862cee303e91c9f0be03146e059e1a2c9bf5709006fe3`。
- 本机 `b5f588a91c604408/workspace/.stride-output/review-live-prs.json`；SHA-256 `f0a4f5fb8c1d14c86b6ccfa35d35fd7ec3a4640c97b2766eee70e51f653697be`。
- 本机 `b5f588a91c604408/workspace/.stride-output/migration-current-pr-detail.json`；SHA-256 `28e225b99a346e28ee77a71b7d636f965ff1fdec238b3b3ed61d6c69081e6b17`。
- 本机 `b5f588a91c604408/workspace/.stride-output/migration-pr-347.json`；SHA-256 `7b2b02b0e71b56a65ce8491ac2d5a75c9f7cf8f5df5ec49d6b66e95e4d39bb06`。

<a id="e20"></a>
## E20 · 用户转交的 Fable 独立核对

原文提出契约型漏项、19个具体建议项及新版本合并状态。本轮逐项按source核对，处理结果独立保存在 MIGRATION-REVIEW-fable.md。

**边界：** 这是用户提供的独立意见，不是本 agent 发起的审查。80%为评审者估计，不作为度量。原文Codex root路径与中间CI样本需按当前source修正。

- 本机 `b5f588a91c604408/workspace/.stride-output/review-fable-original.txt`；SHA-256 `3ae732ee365b68f7aea63d8cf589a0a225cbbca4f106d3530699c0626fd439c1`。

<a id="e21"></a>
## E21 · guardrails / FEATURES / preferences 与实际消费者

本轮逐节/逐行读取文档，检查当前 lib/mms_pi_support.py、lib/mms_core.py、lib/mms_launchers.py、vision relay、session_actions.py、Composer/App/files/skills/drafts 和关键测试断言；覆盖映射在 MIGRATION-CONTRACT-COVERAGE.md。

**边界：** 本轮为source inspection，没有重跑这些产品测试，新补项原则标 T。文档存在旧配置根、未发布/未安装/不可跨模型等过时段落，不能照抄；当前 resolver/tests 为 mms-next。普通文本预览64 KiB、Skills总量200000 UTF-8 bytes、图片预览8 MiB均核对到常量/消费者。

- 本机 `b5f588a91c604408/workspace/.stride-output/source-contracts/AGENT_GUARDRAILS.md`；SHA-256 `bd2342117359f8a8b47b11509e2ec19943161ea2a0b1a7173201ed67be211d44`。
- 本机 `b5f588a91c604408/workspace/.stride-output/source-contracts/FEATURES.md`；SHA-256 `c728abc2d467c0fa8e6a8554f1d7579d1ed6f4753835aa76935d090f1ab2f025`。
- 本机 `b5f588a91c604408/workspace/.stride-output/source-contracts/MMS_USER_PREFERENCES.md`；SHA-256 `5fdf1d1eb8b874b8c50cc5c1e5ff52becc63119f5bb97ae84fd3e99312a51f54`。

<a id="e22"></a>
## E22 · T9a / Preview / onboarding 最终交付

四PR已MERGED，本轮GitHub回读每PR最终8项CI全部SUCCESS。已读最终运行报告：shell installer真实copy/cleanup caller修前漏检，增强后分别红；staging/install两处flat guard mutation红；main732/dev752 fresh；Preview实际installed launcher import发现Grok漏包后补至81模块；分享zip实际解压和隔离启动。最终PR报告main2638、dev3000 tests零fail。

**边界：** Fable的2636是中间候选，未覆盖后来新增的全部consumer修复。读历史执行报告及实时CI元数据不等于本轮重跑，也不意味着这批功能已迁入fork或用户安装已更新。

公开 PR：[#337](https://github.com/CtriXin/multi-model-switch/pull/337)、[#343](https://github.com/CtriXin/multi-model-switch/pull/343)、[#344](https://github.com/CtriXin/multi-model-switch/pull/344)、[#347](https://github.com/CtriXin/multi-model-switch/pull/347)。

- 本机 `7b37a8aff257410b/components/t9a-closeout/workspace/.ai/regression-reports/2026-09-18-t9a-closeout.md`；SHA-256 `9b3fbef4e3da52f66e80bf0db32281c0dc0e538b8888457b87cae0f0ec856974`。
- 本机 `7b37a8aff257410b/components/t9a-dev-sync/workspace/.ai/regression-reports/2026-09-18-t9a-dev-sync.md`；SHA-256 `163df59b02c731055b93f979d6a6357d0c22281cab3d3f94f9f184276752097e`。
- 本机 `7b37a8aff257410b/components/onboarding-closeout/workspace/.ai/regression-reports/2026-09-18-onboarding-closeout.md`；SHA-256 `c813efd5451b4846fb882ce1be7a851c4ad024f4e0a75f2f8c7d6818e3ed16e2`。
- 本机 `b5f588a91c604408/workspace/.stride-output/review-merged-pr-details.json`；SHA-256 `14cebbc7eea2eefd70df0d41be82dad915afc4d0d1a5ab4050dc7b4c41210e91`。
