# MMS 全量能力迁入 DSH fork：可勾选总任务

**Task：`b5f588a91c604408`。目标是把 MMS 自 4.0 起已开发的全部能力迁入 `CtriXin/mms-harness`，包括 5.x Bot / 计划 / 日程 / Fleet。** 本版已纳入用户转交的独立核对，并按 guardrails、FEATURES 与 preferences 逐节补查；总迁移尚未完成。pwd 与 effort 是已完成的子项，不是范围上限。

编制时间：2026-09-18T16:00:02+08:00。Git/PR 回读批次：2026-09-18T15:53:51+08:00。来源固定为 MMS main `4.23.8`、dev `5.1.11`；具体 commit、203 个 PR 及 758 个 commit 的归属在 [完整来源台账](MIGRATION-PR-COVERAGE.md)。本版由旧 4.23.7 /5.1.10 显式推进到新基线；前版保留在 Git 历史。核对处理见 [独立评审对照](MIGRATION-REVIEW-fable.md)，逐节覆盖见 [契约与功能枚举](MIGRATION-CONTRACT-COVERAGE.md)。

实现方式可以是 fork 内复用 DSH 原生能力、增加模块、修改 UI 或通过 MMS adapter 消费原能力；必须保留相应用户行为与边界并验收。复用不等于默认通过，也不要求机械复制全部旧代码。旧“不要 fork / 停止 5.x”建议已失效。

## 如何读勾选和证据

- `[x]`：该细项在 fork 中已有实际实现与指定范围的验证；不是说整组或原 MMS 全部 ready。
- `[ ]`：未迁、部分、未验或候选，继续保留；原版证据不足不能成为删掉迁移项的理由。
- 原版 **R**：本轮已读具体回归/运行记录；仅支持该记录的版本、设备和用例，不表示本轮重跑，也不保证当前版本没有退化。
- 原版 **P**：PR 正文报告已实现并通过验证，但本轮尚未重核全部原始执行证据。
- 原版 **T**：存在 source/test，尚缺对应执行证据。**缺口**：已有记录明确保留验收缺口，待当前源码重核。**候选**：未合并或未采用，不能冒充已交付。
- 每项引用 E 编号；精确证据与限制见 [证据索引](MIGRATION-EVIDENCE.md)。R 中仅引用 E17 的项要特别区分“当前 fork 已验”和“旧 MMS 独立验收”。

当前共 **25 组 / 193 项**（含工程/验收项和 3 个候选检查项，并非 193 个独立产品功能）。原版证据：R 74、P 87、T 27、缺口 2、候选 3。fork（2026-09-19 按条目重数）：已验 31、部分 32、未迁 122、未验 5、待核对 3。不能把这些项简单相加成产品完成百分比。

## 能力总览

| 组 | 范围 | 检查项 | fork 已勾选 |
|---|---|---:|---:|
| [C01](#c01) | 通道、账号与模型配置 | 9 | 2 |
| [C02](#c02) | capability、context、effort 与协议 | 10 | 2 |
| [C03](#c03) | Recipe 场景分享 | 8 | 3 |
| [C04](#c04) | 项目资料与本轮上下文来源 | 5 | 0 |
| [C05](#c05) | 成果、预览、快照与引用 | 8 | 0 |
| [C06](#c06) | Skills、Weber 与任务包 | 9 | 0 |
| [C07](#c07) | 手机、远程访问与认证 | 7 | 0 |
| [C08](#c08) | 会话历史、CLI adoption 与失败接续 | 11 | 1 |
| [C09](#c09) | 多 CLI launcher 与隔离运行 | 13 | 0 |
| [C10](#c10) | 安装、服务发现与生命周期 | 7 | 2 |
| [C11](#c11) | 升级、版本与回滚 | 8 | 0 |
| [C12](#c12) | 模型/effort/focus 与日常交互 | 13 | 2 |
| [C13](#c13) | 聊天、过程、队列与 BTW | 15 | 0 |
| [C14](#c14) | pwd、项目定位与文件引用 | 9 | 2 |
| [C15](#c15) | 品牌、中文帮助与入门 | 6 | 1 |
| [C16](#c16) | 持久 Bot 产品层 | 9 | 0 |
| [C17](#c17) | 计划、批准、协作与执行边界 | 6 | 0 |
| [C18](#c18) | 独立周期日程 | 7 | 0 |
| [C19](#c19) | Fleet 多模型意见与只读 worker（#295） | 8 | 0 |
| [C20](#c20) | 执行前重试、通知与送达 | 4 | 0 |
| [C21](#c21) | 发行通道与数据兼容 | 4 | 0 |
| [C22](#c22) | Windows 与跨平台 | 6 | 0 |
| [C23](#c23) | 验证资产与质量保障 | 5 | 0 |
| [C24](#c24) | 历史、上游同步与交付追溯 | 3 | 0 |
| [C25](#c25) | 未合并候选（单列，不冒充已交付） | 3 | 0 |

## 执行顺序与边界

| 四象限 | 任务 |
|---|---|
| 紧急且重要 | 完成此次独立对账；先保留 C09.08/.09/.10/.12/.13 与 C02.09/.10 等契约，再补 pwd、model、effort、focus 和 Recipe/会话/远程；不得让新增能力绕过认证、hook、配置与实际请求边界。 |
| 重要不紧急 | 其余全量能力继续逐组迁移，包括 Bot/计划/日程/Fleet、多 CLI、成果/资料、安装升级、跨平台；这只是顺序，不能据此排除。 |
| 紧急不重要 | 更新新增 PR 状态、修失效证据链接；不把文档数量当功能进度。 |
| 非紧急非重要 | 纯历史版号/生成物不作为独立新功能复制，保留追溯；未合并候选待对账。 |

没有证据可称为“原版已完整开发并验证”的：系统开机自启/崩溃守护、真实手机跨网全链路、所有 CLI 的完整 Web 驱动、自动 5→4 降级、Windows Desktop 全流程。相关已有子能力照常迁移，缺的验收明确保留；不凭设想给这些整项打勾。

#308 明确保留为不合入实验；#290 及 OPEN PR 放候选区。候选若被采用，应补实际能力项与证据；没有再次获得用户意图前，不把旧 CLOSED 自动等同“应该删掉”。

<a id="c01"></a>
## C01 · 通道、账号与模型配置

原 PR：[#113](https://github.com/CtriXin/multi-model-switch/pull/113)、[#127](https://github.com/CtriXin/multi-model-switch/pull/127)、[#135](https://github.com/CtriXin/multi-model-switch/pull/135)、[#155](https://github.com/CtriXin/multi-model-switch/pull/155)、[#175](https://github.com/CtriXin/multi-model-switch/pull/175)、[#204](https://github.com/CtriXin/multi-model-switch/pull/204)、[#211](https://github.com/CtriXin/multi-model-switch/pull/211)、[#236](https://github.com/CtriXin/multi-model-switch/pull/236)、[#285](https://github.com/CtriXin/multi-model-switch/pull/285)、[#324](https://github.com/CtriXin/multi-model-switch/pull/324)、[#345](https://github.com/CtriXin/multi-model-switch/pull/345)、[#346](https://github.com/CtriXin/multi-model-switch/pull/346)。

源码入口：[mms_web/connections.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/connections.py)；[mms_web/model_settings.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/model_settings.py)；[lib/mms_consumer_bundle.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_consumer_bundle.py)；[lib/mms_core.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_core.py)。

回归入口：[tests/test_mms_web_model_settings.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_model_settings.py)；[tests/test_model_routes_export.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_model_routes_export.py)；[tests/test_registry_runtime_resolver.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_registry_runtime_resolver.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C01.01 Router/Lineup/Profile/Policy 与 approved bundle 读取、revision/hash 校验**（原版 R；fork：已验；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：损坏/未批准/路径不符的导出拒绝消费；用户 policy 不被覆盖。
- [x] **C01.02 精确绑定选中通道凭据，缺失即停止**（原版 R；fork：已验；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：删除所选凭据后请求数不增加，不能落到全局 OAuth 或另一账号。
- [ ] **C01.03 模型服务首次连接、保存、校验与失败原因**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)、[E04](MIGRATION-EVIDENCE.md#e04)）。验收：从真实表单连接自己的服务；失败保留输入且指出缺项。
- [ ] **C01.04 通道新增、编辑、删除确认与最后一个通道保护**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：读写权限与配置审计生效；取消删除不改变配置。
- [ ] **C01.05 模型发现 replace、manual 边界与空结果保护**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：远端删模型后本地不残留；失败/空发现不清空人工配置。
- [ ] **C01.06 模型/通道/effort 默认值持久化与会话覆盖分离**（原版 R；fork：部分；[E01](MIGRATION-EVIDENCE.md#e01)、[E12](MIGRATION-EVIDENCE.md#e12)）。验收：重启默认值保留；当前会话和显式任务选择不被改写。
- [ ] **C01.07 模型列表友好通道名、实际可用性与真实阻塞原因**（原版 R；fork：部分；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：不可用模型不伪装可选，展示实际 launcher/provider 拒绝原因。
- [ ] **C01.08 慢只读发现/检查不阻塞其他操作，写入仍串行**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：慢发现期间其他操作响应；保存仍校验配置 revision 并拒绝过期写。
- [ ] **C01.09 provider/account 路由排序与本地使用统计分工**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：role primary > auto > fallback；同 role 使用较大 effective priority，family_priority_overrides 仅覆盖命中 family；model use_count/最近使用用于展示排序而非路由主键。保持 config/provider/account/source/auth_mode 的原意，显式选择不得被 UI 默认或 bridge 改写。

<a id="c02"></a>
## C02 · capability、context、effort 与协议

原 PR：[#114](https://github.com/CtriXin/multi-model-switch/pull/114)、[#127](https://github.com/CtriXin/multi-model-switch/pull/127)、[#168](https://github.com/CtriXin/multi-model-switch/pull/168)、[#185](https://github.com/CtriXin/multi-model-switch/pull/185)、[#194](https://github.com/CtriXin/multi-model-switch/pull/194)、[#199](https://github.com/CtriXin/multi-model-switch/pull/199)、[#209](https://github.com/CtriXin/multi-model-switch/pull/209)、[#213](https://github.com/CtriXin/multi-model-switch/pull/213)、[#216](https://github.com/CtriXin/multi-model-switch/pull/216)、[#227](https://github.com/CtriXin/multi-model-switch/pull/227)、[#233](https://github.com/CtriXin/multi-model-switch/pull/233)、[#345](https://github.com/CtriXin/multi-model-switch/pull/345)、[#346](https://github.com/CtriXin/multi-model-switch/pull/346)。

源码入口：[lib/mms_capability_resolver.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_capability_resolver.py)；[lib/mms_provider_profiles.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_provider_profiles.py)；[mms_web/launch_options.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/launch_options.py)；[lib/mms_pi_support.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_pi_support.py)；[lib/mms_vision_relay.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_vision_relay.py)。

回归入口：[tests/test_capability_resolver.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_capability_resolver.py)；[tests/test_context_window_single_truth.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_context_window_single_truth.py)；[tests/test_capability_request_shaping.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_capability_request_shaping.py)；[tests/test_pi_vision_relay.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_pi_vision_relay.py)；[tests/test_vision_relay_harnesses.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_vision_relay_harnesses.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C02.01 解析后的 context/input/output/reasoning 元数据导入 fork**（原版 R；fork：已验；[E05](MIGRATION-EVIDENCE.md#e05)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：有来源/hash；缺字段使用版本化 catalog，不凭模型名猜窗口。
- [ ] **C02.02 人工 capability 覆盖、批量逐行复核、未保存项保护**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：人工值优先；新增发现不重置已选项，待确认项不默认写入。
- [ ] **C02.03 统一 context resolver 与各 harness 消费一致性**（原版 R；fork：部分；[E05](MIGRATION-EVIDENCE.md#e05)、[E21](MIGRATION-EVIDENCE.md#e21)）。验收：UI、请求预算、各消费者一致；[1m] 仅作为规范化输入；resolver顺序为显式context-overrides→人工policy→approved→profile→provider缓存→有来源catalog→Claude家族规则；userSet不自动刷新、不校准封顶、不随意补[1m]，未知值由caller明确处理。
- [x] **C02.04 按实际模型暴露 effort，默认/关闭/不支持值可解释**（原版 R；fork：已验，2026-09-19 实测（临时实例，真实模型）：选 MiniMax-M3（无推理档位）后 effort 按钮消失，切回 gpt-5.6-sol 恢复；RPC 发不支持的 effort 未测；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：无硬编码假档位；清除覆盖及不支持值处理与 MMS 对齐。
- [x] **C02.05 真实请求中的 DeepSeek Low 与 GPT High**（原版 R；fork：已验；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：Anthropic budget=2048 与 Responses reasoning=high，实际响应成功。
- [x] **C02.06 保存共享默认 effort 后新任务即时刷新**（原版 R；fork：已验，2026-09-19 实测（临时实例，真实模型）：dsh 没有单独的「默认 effort」设置项，在会话里选的即为共享默认；把 effort 从 Medium 改成 High 后不刷新，新会话显示 High；[E12](MIGRATION-EVIDENCE.md#e12)）。验收：不 reload；真实保存调用链驱动新任务刷新，显式选择不变。
- [ ] **C02.07 Anthropic-first、Responses、URL 规范化与 cache transport 证据**（原版 R；fork：部分；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：协议/实际 request_path 可核对；自定义头/敏感 relay 另验，不能默默降级。
- [ ] **C02.08 识图借用与同通道 vision relay**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)、[E21](MIGRATION-EVIDENCE.md#e21)）。验收：不识图模型可经明确 relay 使用图片；凭据不进入工具结果，各 CLI 分别验证；Claude Code/OpenCode 的 MCP 共用同一个 relay_plan；session catalog 0600、MMS_VISION_RELAY_CONFIG，凭据仅进请求头；模型已识图/空池/禁用时不注册或删除旧server；Codex明确不接特殊 relay，见 C02.09/.10。
- [ ] **C02.09 Pi vision relay 注入、池隔离与空池可见**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：注入 MMS_PI_MAIN_MODEL_VISION 和 MMS_PI_VISION_POOL；池只取当前通道暴露且能力允许的 wire ID；主模型会识图则不注册工具；唯一开关 [vision_sidecar] enabled；每次随机排序并有界尝试其他候选，禁止内置模型名单/优先级；空数组表示已计算且无候选，必须提示；原生 Pi 无注入时扫描 models.json，不能借另一个账号。
- [ ] **C02.10 识图能力统一真值及未知与不支持的区别**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：manual_override/model_policy > Pi 实测 hints > provider_profile/approved_facts > 名称兜底；Web 人工开关到各 harness 的真实请求保持一致，Codex 不附加特殊 relay；不能绕过 caps 查表，conservative_fallback 表示未声明而非明确不支持，不新增第五份名单。

<a id="c03"></a>
## C03 · Recipe 场景分享

原 PR：[#111](https://github.com/CtriXin/multi-model-switch/pull/111)、[#143](https://github.com/CtriXin/multi-model-switch/pull/143)、[#199](https://github.com/CtriXin/multi-model-switch/pull/199)。

源码入口：[apps/mms-web/src/recipe-core.ts](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/recipe-core.ts)；[apps/mms-web/src/Recipe.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/Recipe.tsx)；[mms_web/recipe_requirements.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/recipe_requirements.py)。

回归入口：[tests/frontend/recipe-core.test.ts](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/frontend/recipe-core.test.ts)；[tests/test_mms_web_recipe_contract.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_recipe_contract.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C03.01 Recipe v1/v2 解析、变量替换与格式拒绝**（原版 P；fork：已验；[E03](MIGRATION-EVIDENCE.md#e03)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：兼容 v1 literal braces；缺变量/未知要求/预算超限明确拒绝。
- [x] **C03.02 实际请求模型与所选 Skills 的能力复核**（原版 P；fork：已验；[E03](MIGRATION-EVIDENCE.md#e03)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：有图像/推理/Skill 要求时检查实际 route；不满足则发请求前拒绝。
- [x] **C03.03 Recipe 使用状态持久化并随会话恢复**（原版 P；fork：已验；[E03](MIGRATION-EVIDENCE.md#e03)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：重启仍检查原要求；显式 clear 后才解除，偏好模型不覆盖用户选择。
- [ ] **C03.04 模板库、编辑、示例与期望结果**（原版 P；fork：部分；[E03](MIGRATION-EVIDENCE.md#e03)）。验收：完整 GUI 可发现、编辑、保存、导入，不只提供 slash 命令。
- [ ] **C03.05 导出预览、已知凭据与本机路径清理**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)）。验收：实际下载与最终预览一致；quoted credential 和样例也处理。
- [ ] **C03.06 文件变量拖入、导入和草稿刷新恢复**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)、[E04](MIGRATION-EVIDENCE.md#e04)）。验收：文件路径填入正确变量；刷新/取消不丢草稿，不自动发送。
- [ ] **C03.07 跨独立安装导入并用接收方配置运行**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)）。验收：新 HOME/安装用自己的通道完成同一模板；不携带作者 Key。
- [ ] **C03.08 planning 模式及延迟预检的过期确认防护**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)）。验收：A→B→A 不复用旧预检；需要计划时保持原交互语义。

<a id="c04"></a>
## C04 · 项目资料与本轮上下文来源

原 PR：[#116](https://github.com/CtriXin/multi-model-switch/pull/116)、[#134](https://github.com/CtriXin/multi-model-switch/pull/134)、[#143](https://github.com/CtriXin/multi-model-switch/pull/143)。

源码入口：[mms_web/project_materials.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/project_materials.py)；[apps/mms-web/src/ProjectMaterials.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/ProjectMaterials.tsx)。

回归入口：[tests/test_mms_web_project_materials.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_project_materials.py)；[tests/test_mms_web_context_flow.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_context_flow.py)；[tests/test_mms_web_context_evidence.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_context_evidence.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C04.01 按工作文件夹管理资料，新增/编辑/停用/删除**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：两个项目隔离；只影响后续轮次，删除需确认。
- [ ] **C04.02 资料 revision/hash、预算与损坏索引保护**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：两个窗口过期编辑冲突可见；损坏资料不注入不覆盖。
- [ ] **C04.03 本轮实际使用的资料/Skills/文件/附件/选段来源**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)、[E03](MIGRATION-EVIDENCE.md#e03)）。验收：绑定真实消息/工具 ID，区分列出、提交、真正消费和读取失败。
- [ ] **C04.04 历史来源不可改写及未知交付状态**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：旧历史不补造证据；取消、排队、发送结果未知分别保留。
- [ ] **C04.05 资料编辑自动 focus、空来源不展示假收据**（原版 R；fork：未迁；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：打开标题可立即输入，真实空来源不冒充已用资料。

<a id="c05"></a>
## C05 · 成果、预览、快照与引用

原 PR：[#115](https://github.com/CtriXin/multi-model-switch/pull/115)、[#128](https://github.com/CtriXin/multi-model-switch/pull/128)、[#155](https://github.com/CtriXin/multi-model-switch/pull/155)。

源码入口：[mms_web/artifact_history.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/artifact_history.py)；[mms_web/artifact_preview.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/artifact_preview.py)；[mms_web/artifacts.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/artifacts.py)；[mms_web/files.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/files.py)；[mms_web/skills.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/skills.py)；[apps/mms-web/src/drafts.ts](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/drafts.ts)。

回归入口：[tests/test_mms_web_artifact_history.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_artifact_history.py)；[tests/test_mms_web_artifact_flow.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_artifact_flow.py)；[tests/test_mms_web_local_files.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_local_files.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C05.01 Markdown/文本/CSV/图片/静态 HTML 预览和下载**（原版 P；fork：未验；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：DSH 已有基础能力，仍需跑 MMS 用例后才能勾选。
- [ ] **C05.02 write/edit 与命令实际改文件后保存版本快照**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：不以模型声明冒充文件已生成，只有实际内容进入版本。
- [ ] **C05.03 有界 blob、revision/hash 与重启保留**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：原文件修改或删除后旧快照仍可读；容量到限有明确提示。
- [ ] **C05.04 版本比较与当前文件/历史版本区分**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：不为旧会话伪造版本，可比较真实内容。
- [ ] **C05.05 文字选段和图片选区进入草稿**（原版 P；fork：未迁；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：先形成草稿；发送前核对内容版本，过期选段拒绝。
- [ ] **C05.06 HTML 清理、CSP、iframe sandbox 与路径安全**（原版 P；fork：未验；[E02](MIGRATION-EVIDENCE.md#e02)）。验收：不能调用本地 API/跳父页；symlink 与路径越界 fail closed。
- [ ] **C05.07 本地引用预览同步、窄屏引用后回输入**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：引用原文件不强制上传；桌面和390px均可操作。
- [ ] **C05.08 文件、引用、Skills 与草稿的定量边界**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：每消息最多 8 个文件和 20 个 workspace 引用；图片/截图预览 8 MiB、普通文本预览 64 KiB；Skills 一次20个、累计 UTF-8 200000 bytes；草稿 TTL 7天。普通本地原路径引用不因此变成上传大小限制；Bot artifact 文本上限是另一合同，不与64 KiB混用；变更上限需明确评估。

<a id="c06"></a>
## C06 · Skills、Weber 与任务包

原 PR：[#120](https://github.com/CtriXin/multi-model-switch/pull/120)、[#130](https://github.com/CtriXin/multi-model-switch/pull/130)、[#132](https://github.com/CtriXin/multi-model-switch/pull/132)、[#143](https://github.com/CtriXin/multi-model-switch/pull/143)、[#155](https://github.com/CtriXin/multi-model-switch/pull/155)、[#216](https://github.com/CtriXin/multi-model-switch/pull/216)、[#258](https://github.com/CtriXin/multi-model-switch/pull/258)。

源码入口：[mms_web/skills.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/skills.py)；[mms_web/starter_skills.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/starter_skills.py)；[mms_web/skill_catalog.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/skill_catalog.mjs)；[lib/mms_session_assets.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_session_assets.py)；[lib/mms_core.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_core.py)。

回归入口：[tests/test_mms_web_starter_skills.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_starter_skills.py)；[tests/test_managed_skill_imports.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_managed_skill_imports.py)；[tests/test_session_assets.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_session_assets.py)；[tests/test_user_preferences.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_user_preferences.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C06.01 任务型 bundled Skills 与可发现的选择入口**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)、[E04](MIGRATION-EVIDENCE.md#e04)）。验收：实际会话可读取并使用任务 Skill，不只目录存在。
- [ ] **C06.02 用户/项目/bundled 优先级与同名冲突来源**（原版 P；fork：部分；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：用户或项目覆盖可见；Recipe要求唯一可用 Skill。
- [ ] **C06.03 可选合并本机 Skills，默认关闭且只读源目录**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：开关作用于会话读取层，不强装、不改全局 Skills。
- [ ] **C06.04 Weber 统一入口、浏览器 backend 与登录态边界**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：选择合适 backend；不拿隔离浏览器冒充已登录操作。
- [ ] **C06.05 选择 Skill/工作包只准备草稿，不隐式执行**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)、[E04](MIGRATION-EVIDENCE.md#e04)）。验收：明确发送才运行，刷新和取消保留预期状态。
- [ ] **C06.06 会话 scoped 扩展/hooks 及退休项不复活**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：保留能力，禁止重新强装退休全局 hooks/token-saver。
- [ ] **C06.07 Figma / Pilot MCP 默认关闭及显式 opt-in**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：检测到安装也不注入；只有 MMS_ENABLE_MCP_FIGMA / MMS_ENABLE_FIGMA_MCP 或 MMS_ENABLE_MCP_PILOT / MMS_ENABLE_PILOT_MCP 的显式启用才进入会话；surface 禁用优先，关闭后清除旧会话生成项，不改全局安装。
- [ ] **C06.08 global hook/skill 优先，xmem global-only**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：同名 global 优先于 MMS 动态 session assets，MMS 仅补缺失；xmem 不 bundle/安装/注入；退休 hook 不复活；NSR 与全局行为保持兼容，仅低频 continuation，安装不等于已启动任务循环。
- [ ] **C06.09 session surface 目录、来源预览及禁用草稿**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：展示动态注入/全局继承/其它检测来源及高级路径、disable_key；CLI-scoped global Skill 过滤只影响该会话，不删全局文件；支持分组禁用和独立偏好草稿保存。环境变量 > managed assets > bundled > legacy fallback 的实际优先级明确，ECC/OMC 等重包仍 opt-in。

<a id="c07"></a>
## C07 · 手机、远程访问与认证

原 PR：[#149](https://github.com/CtriXin/multi-model-switch/pull/149)、[#169](https://github.com/CtriXin/multi-model-switch/pull/169)、[#181](https://github.com/CtriXin/multi-model-switch/pull/181)、[#186](https://github.com/CtriXin/multi-model-switch/pull/186)、[#283](https://github.com/CtriXin/multi-model-switch/pull/283)、[#317](https://github.com/CtriXin/multi-model-switch/pull/317)、[#329](https://github.com/CtriXin/multi-model-switch/pull/329)、[#338](https://github.com/CtriXin/multi-model-switch/pull/338)、[#339](https://github.com/CtriXin/multi-model-switch/pull/339)。

源码入口：[mms_web/remote_access.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/remote_access.py)；[apps/mms-web/src/RemoteAccess.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/RemoteAccess.tsx)。

回归入口：[tests/test_mms_web_remote_access.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_remote_access.py)；[tests/test_mms_web_remote_access_cookie.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_remote_access_cookie.py)；[tests/test_mms_web_update_auth_transport.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_update_auth_transport.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C07.01 默认关闭的 LAN 访问开关、模式持久化与地址展示**（原版 R；fork：已验，应用内 `/remote` 与 CLI，见 [REMOTE](REMOTE.md)；[E10](MIGRATION-EVIDENCE.md#e10)）。验收：开启后监听正确接口，关闭后释放；本机入口仍可用。
- [x] **C07.02 认证 token、Host/Origin 与无凭据拒绝**（原版 R；fork：已验，gate O6 + 端到端，见 [REMOTE](REMOTE.md)；[E10](MIGRATION-EVIDENCE.md#e10)）。验收：读写/附件/批准均鉴权；不因开放监听绕过保护。
- [x] **C07.03 二维码与远程地址使用入口**（原版 P；fork：已验，本机限定扫码页，二维码解码逐字核对，口令不进会话日志；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：二维码连接正确地址；敏感 token 不进入公开日志。
- [ ] **C07.04 开启远程或轮换 token 后当前窗口不断登录**（原版 R；fork：部分，本机窗口始终不受影响、服务重启后远端 cookie 保持已实测，轮换后远端旧 cookie 立即 401；应用内轮换未做；[E10](MIGRATION-EVIDENCE.md#e10)）。验收：当前窗口 cookie 正确更新，旧 token/无 cookie 拒绝。
- [ ] **C07.05 外网使用引导位于远程总开关下**（原版 P；fork：部分，`remote status` 与 REMOTE.md 给出 Tailscale / 隧道引导，未实测跨网；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：说明实际可用入口；不能把引导当成已部署公网隧道。
- [ ] **C07.06 移动端弹层、visualViewport 与软键盘适配**（原版 P；fork：部分；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：390px 已验目录/effort；真实手机键盘和内置浏览器仍需独立验收。
- [ ] **C07.07 远程模式下升级/回滚认证保持**（原版 R；fork：部分，2026-09-19 `mms/adapter/upgrade.py`，launcher `upgrade` / `rollback`；gate O10、L8：升级和回滚都带上 remote/ 口令，手机不用重新扫码；开着远程时的端到端未测；[E10](MIGRATION-EVIDENCE.md#e10)）。验收：guardian仅用当前实例token，拒绝其他凭据/代理/重定向。

<a id="c08"></a>
## C08 · 会话历史、CLI adoption 与失败接续

原 PR：[#111](https://github.com/CtriXin/multi-model-switch/pull/111)、[#149](https://github.com/CtriXin/multi-model-switch/pull/149)、[#159](https://github.com/CtriXin/multi-model-switch/pull/159)、[#189](https://github.com/CtriXin/multi-model-switch/pull/189)、[#199](https://github.com/CtriXin/multi-model-switch/pull/199)、[#279](https://github.com/CtriXin/multi-model-switch/pull/279)、[#286](https://github.com/CtriXin/multi-model-switch/pull/286)、[#341](https://github.com/CtriXin/multi-model-switch/pull/341)、[#342](https://github.com/CtriXin/multi-model-switch/pull/342)。

源码入口：[mms_web/sessions.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/sessions.py)；[mms_web/cli_sessions.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/cli_sessions.py)；[mms_web/session_recovery.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/session_recovery.py)；[mms_web/session_actions.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/session_actions.py)；[apps/mms-web/src/SessionTools.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/SessionTools.tsx)。

回归入口：[tests/test_mms_web_sessions_pi_driver.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_sessions_pi_driver.py)；[tests/test_mms_web_adopt_cli_session.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_adopt_cli_session.py)；[tests/test_mms_web_session_recovery.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_session_recovery.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C08.01 新会话持久化、关浏览器/重启服务后续聊**（原版 R；fork：已验；[E01](MIGRATION-EVIDENCE.md#e01)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：fork自己的会话、模型、Recipe状态保留且真实请求继续成功。
- [ ] **C08.02 Pi CLI 历史只读发现、导入及去重**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：不修改原 CLI 日志，不把只读查看冒充接管原进程。
- [ ] **C08.03 从 CLI 历史复制采用并继续原上下文**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：显式采用；原进程/原日志保持，导入丢失项明确说明。
- [x] **C08.04 失败/重试耗尽提示及 error-only 终端消息可见**（原版 R；fork：已验，2026-09-19 实测（临时实例，真实模型）：删掉临时实例里一个通道的凭据后发消息，界面显示「本轮运行失败」、具体原因和 MISSING_CREDENTIAL；提示文字偏技术；[E11](MIGRATION-EVIDENCE.md#e11)）。验收：失败不能显示空白或成功，成功后清除旧失败提示。
- [ ] **C08.05 不用旧模型生成接续资料，支持编辑/复制**（原版 R；fork：未迁；[E11](MIGRATION-EVIDENCE.md#e11)）。验收：本地有界历史、脱敏、保留未执行/取消/未知结果。
- [ ] **C08.06 换模型续原会话或创建干净新草稿**（原版 R；fork：未迁；[E11](MIGRATION-EVIDENCE.md#e11)）。验收：显式发送才创建/执行；普通草稿和原会话保留。
- [x] **C08.07 重启后进行中任务显示 interrupted，不重放副作用**（原版 R；fork：已验，2026-09-19 实测（临时实例，真实模型）：前台 bash 运行中 SIGKILL host，重启后对原会话发消息，日志补上 `turn/end interrupted` 和 bash 的中断错误结果，bash 调用只有 1 次，标记文件未写出（没有重放）；[E07](MIGRATION-EVIDENCE.md#e07)、[E11](MIGRATION-EVIDENCE.md#e11)）。验收：逐场景区分记录保留、可续接和仍在运行；DSH需等价测试。
- [ ] **C08.08 原 Pilot/旧 Pi 历史可读与迁移回滚**（原版 T；fork：未迁；[E18](MIGRATION-EVIDENCE.md#e18)）。验收：迁移前后日志 hash不变；不宣称跨格式无损 native resume。
- [ ] **C08.09 会话归档与恢复**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：归档从活跃列表隐藏，可检索恢复；原 native history/工作目录/附件保留，刷新和服务重启后保持；与删除及 worker 内部归档区分。
- [ ] **C08.10 整段或指定回复处分叉**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：可从指定 event/reply 创建独立 native 对话历史，原历史不修改；默认仍共用 workspace，不承诺 Git worktree 或文件隔离；边界非法/运行中不可操作时明确拒绝。
- [ ] **C08.11 消息复制与会话 Markdown 导出**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：复制选中消息或代码，导出真实会话文本；失败有相应反馈，不导出凭据或伪造未完成结果，已归档和分支数据按其真实记录处理。

<a id="c09"></a>
## C09 · 多 CLI launcher 与隔离运行

原 PR：[#152](https://github.com/CtriXin/multi-model-switch/pull/152)、[#153](https://github.com/CtriXin/multi-model-switch/pull/153)、[#164](https://github.com/CtriXin/multi-model-switch/pull/164)、[#168](https://github.com/CtriXin/multi-model-switch/pull/168)、[#175](https://github.com/CtriXin/multi-model-switch/pull/175)、[#199](https://github.com/CtriXin/multi-model-switch/pull/199)、[#204](https://github.com/CtriXin/multi-model-switch/pull/204)、[#205](https://github.com/CtriXin/multi-model-switch/pull/205)、[#208](https://github.com/CtriXin/multi-model-switch/pull/208)、[#212](https://github.com/CtriXin/multi-model-switch/pull/212)、[#213](https://github.com/CtriXin/multi-model-switch/pull/213)、[#215](https://github.com/CtriXin/multi-model-switch/pull/215)、[#216](https://github.com/CtriXin/multi-model-switch/pull/216)、[#227](https://github.com/CtriXin/multi-model-switch/pull/227)、[#228](https://github.com/CtriXin/multi-model-switch/pull/228)、[#231](https://github.com/CtriXin/multi-model-switch/pull/231)、[#244](https://github.com/CtriXin/multi-model-switch/pull/244)、[#248](https://github.com/CtriXin/multi-model-switch/pull/248)、[#292](https://github.com/CtriXin/multi-model-switch/pull/292)、[#308](https://github.com/CtriXin/multi-model-switch/pull/308)。

源码入口：[lib/mms_adapter_registry.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_adapter_registry.py)；[lib/mms_launchers.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_launchers.py)；[lib/mms_session.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_session.py)；[lib/mms_bridge.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_bridge.py)；[lib/mms_core.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_core.py)；[lib/mms_pi_support.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_pi_support.py)。

回归入口：[tests/test_pi_launcher.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_pi_launcher.py)；[tests/test_opencode_launcher.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_opencode_launcher.py)；[tests/test_grok_launcher.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_grok_launcher.py)；[tests/test_codex_reasoning_effort_launch.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_codex_reasoning_effort_launch.py)；[tests/test_codex_hook_trust_contract.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_codex_hook_trust_contract.py)；[tests/test_mms_claude_oauth_hard_cut.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_claude_oauth_hard_cut.py)；[tests/test_user_preferences.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_user_preferences.py)；[tests/test_single_config_root.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_single_config_root.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C09.01 从 fork 使用 MMS 管理的多 CLI 启动能力**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：Pi/Codex/Claude/OpenCode/Grok逐 adapter验证，不把Web Pi-only夸大成多harness Web。
- [ ] **C09.02 每会话 private HOME/config/env 与凭据注入**（原版 R；fork：部分；[E01](MIGRATION-EVIDENCE.md#e01)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：DSH已独立隔离；其他CLI继承相同fail-closed边界后才通过。
- [ ] **C09.03 启动错误、可用性、程序位置与私有运行时诊断**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：PATH缺项/npm缓存/global安装位置分别识别，不能静默换账号。
- [ ] **C09.04 协议/bridge/header/cache 敏感通道合同**（原版 P；fork：部分；[E04](MIGRATION-EVIDENCE.md#e04)、[E21](MIGRATION-EVIDENCE.md#e21)）。验收：保留实际协议和有效header，cache path可核对；DSH非全部relay已验；MMS→敏感relay的header、sticky/cache边界见C09.12；真实 request_path 缺失不得算路由验收通过。
- [x] **C09.05 session resume/最后使用模型与通道状态**（原版 R；fork：已验，2026-09-19 实测（临时实例，真实模型）：会话用 deepseek-v4-flash 发过请求，关着时把全局默认改成 gpt-5.6-sol 并重启，原会话下一次请求仍是 deepseek-v4-flash，新会话用 gpt-5.6-sol；[E01](MIGRATION-EVIDENCE.md#e01)）。验收：明确resume目标，不回落其他会话或全局默认。
- [ ] **C09.06 本机配置根和公开/开发命令边界**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：命令指向明确安装；旧说明不覆盖当前实际产品契约。
- [ ] **C09.07 进程 shutdown/双 Ctrl-C/子进程 pipes 可靠性**（原版 P；fork：未验；[E04](MIGRATION-EVIDENCE.md#e04)、[E15](MIGRATION-EVIDENCE.md#e15)）。验收：退出回收本实例，不杀其他服务；Windows单独测。
- [ ] **C09.08 Codex hook trust 稳定复用，不重复 Hooks need review**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：gateway CODEX_HOME 固定 <selected config root>/codex-gateway/.codex（当前默认 ~/.config/mms-next）；每 PID 会话只做 wrapper/tmp，.codex 链接稳定目录。bypass 同时传 approvals/sandbox 与 hook-trust 两个 flag；真实 hooks.json trust 优先于 stale sibling；hash drift 用 app-server hooks/list currentHash 校正，仅允许 MMS-managed hook hash；批准一次只回写稳定 gateway，后续不重复弹窗；不扩大为自动信任任意用户 hook。
- [ ] **C09.09 preferences.toml allowlist 覆盖与人工写入确认**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：config → override → preferences allowlist → 本次确认 → launcher；thinking_mode/reasoning_effort/bypass/nsr_mode/agent_pack/pi_btw、禁用 CLI/surfaces 和 assets.roots 按 schema 消费，已退休字段不复活。credentials/routes/account/proxy/OAuth/HOME 等被忽略；配置根以 resolver 为准（当前 mms-next），不是旧帮助文档的 mms；代理只出预览或 diff，真实写入必须有人工确认、备份、审计与写后核对。
- [ ] **C09.10 real HOME / Keychain OAuth 禁止自动恢复与回写**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：launch/probe/retry/bridge/resume 失败仍留在所选 runtime；不得读取 ~/.claude.json、Keychain OAuth、~/.codex/auth.json、~/.gemini 等当恢复池，也不得把隔离 session 的 auth-bearing state 回写 real/global HOME；仅显式人工 login/import-auth 可进入对应授权流程；非认证继承也须 schema/allowlist 排除 token/account identity/owner fingerprint。
- [ ] **C09.11 diagnostics 的 CLI 与可视化消费入口**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：doctor [full]、models、routes、exposure、test --provider ... --cli ...、logs 可发现；区分只读诊断和真实 provider smoke，保留实际 runtime/protocol/request_path/cache/认证隔离证据且脱敏，不把 CLI 列表等同全部调用已成功。
- [ ] **C09.12 敏感 provider 保守默认及 cache/sticky 身份合同**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：敏感 relay 不默认开 1M、不默认新增 Anthropic endpoint probe；manual/remote/fallback 模型来源变化需针对性 smoke。保留 Codex/Claude 客户端头、channel_affinity、metadata.user_id 字符串及 prompt_cache_key；账号绑定核对 proxy log/管理端 key 可见性；只有对应真实 smoke 支持时才放宽，Qwen Anthropic 路径 cache_control 不能被统一剥除。
- [ ] **C09.13 单一配置根及退出 legacy fallback**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：所有 MMS 消费者由同一 resolver 选择配置根，当前默认 ~/.config/mms-next；隔离 HOME 内也不静默回落 ~/.config/mms；gateway/accounts 是状态目录，不能误当独立配置真值。旧 CCS 只可清理不恢复入口；fork 消费 approved bundle 不建立另一份可漂移账号库。

<a id="c10"></a>
## C10 · 安装、服务发现与生命周期

原 PR：[#120](https://github.com/CtriXin/multi-model-switch/pull/120)、[#122](https://github.com/CtriXin/multi-model-switch/pull/122)、[#137](https://github.com/CtriXin/multi-model-switch/pull/137)、[#147](https://github.com/CtriXin/multi-model-switch/pull/147)、[#153](https://github.com/CtriXin/multi-model-switch/pull/153)、[#163](https://github.com/CtriXin/multi-model-switch/pull/163)、[#183](https://github.com/CtriXin/multi-model-switch/pull/183)、[#189](https://github.com/CtriXin/multi-model-switch/pull/189)、[#192](https://github.com/CtriXin/multi-model-switch/pull/192)、[#200](https://github.com/CtriXin/multi-model-switch/pull/200)、[#202](https://github.com/CtriXin/multi-model-switch/pull/202)、[#205](https://github.com/CtriXin/multi-model-switch/pull/205)、[#226](https://github.com/CtriXin/multi-model-switch/pull/226)、[#231](https://github.com/CtriXin/multi-model-switch/pull/231)、[#234](https://github.com/CtriXin/multi-model-switch/pull/234)、[#256](https://github.com/CtriXin/multi-model-switch/pull/256)、[#257](https://github.com/CtriXin/multi-model-switch/pull/257)、[#260](https://github.com/CtriXin/multi-model-switch/pull/260)、[#270](https://github.com/CtriXin/multi-model-switch/pull/270)、[#271](https://github.com/CtriXin/multi-model-switch/pull/271)、[#273](https://github.com/CtriXin/multi-model-switch/pull/273)、[#337](https://github.com/CtriXin/multi-model-switch/pull/337)、[#344](https://github.com/CtriXin/multi-model-switch/pull/344)、[#347](https://github.com/CtriXin/multi-model-switch/pull/347)。

源码入口：[mms_web/service.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/service.py)；[lib/mms_installer.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_installer.py)；[install.sh](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/install.sh)。

回归入口：[tests/test_mms_installer_runtime.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_installer_runtime.py)；[tests/test_install_script_paths.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_install_script_paths.py)；[tests/test_mms_lib_layout.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_lib_layout.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C10.01 独立安装入口、锁定依赖与源码/产物来源**（原版 R；fork：已验；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：干净commit构建；安装记录commit和artifact hashes，与运行UI一致。
- [x] **C10.02 后台启动、重复start复用、stop保留会话**（原版 R；fork：已验；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：关闭启动终端不结束服务，只操作本实例PID；停止不删状态。
- [ ] **C10.03 服务status/url/restart、端口和实例正确发现**（原版 P；fork：部分；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：多安装不串实例，端口持久；fork现有service入口仍需完整CLI对齐。
- [ ] **C10.04 新用户安装、前置运行时检查、预览安装后打开UI**（原版 R；fork：部分；[E01](MIGRATION-EVIDENCE.md#e01)）。验收：新HOME安装可直接启动；缺Node/Pi等明确给原因。
- [ ] **C10.05 安装/更新提示按实际结果，避免运行中安装死锁**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：不中断他人进程，不装进旧暂存副本；失败给可恢复路径。
- [ ] **C10.06 T9a lib 布局、入口接线与精确旧文件清理**（原版 R；fork：未迁；[E22](MIGRATION-EVIDENCE.md#e22)）。验收：main79/dev81模块完整安装（含Preview独有Grok）；8入口正确解析安装根，真实 install.sh 安装后 import launcher；旧平铺只按发行包精确同名清理，用户文件保留；停用真实 copy/cleanup caller 必须使测试失败；fork按自身布局保持等价安装合同。
- [ ] **C10.07 从已提交 HEAD 打完整源码分享包**（原版 R；fork：未迁；[E22](MIGRATION-EVIDENCE.md#e22)）。验收：包含lib、installer、Pilot和assets；排除untracked及私有凭据，临时zip完成后原子替换；实际解压并在隔离HOME启动，明确未提交WIP不会打入；不以旧平铺四模块包冒充完整发行物。

<a id="c11"></a>
## C11 · 升级、版本与回滚

原 PR：[#118](https://github.com/CtriXin/multi-model-switch/pull/118)、[#125](https://github.com/CtriXin/multi-model-switch/pull/125)、[#137](https://github.com/CtriXin/multi-model-switch/pull/137)、[#142](https://github.com/CtriXin/multi-model-switch/pull/142)、[#147](https://github.com/CtriXin/multi-model-switch/pull/147)、[#195](https://github.com/CtriXin/multi-model-switch/pull/195)、[#198](https://github.com/CtriXin/multi-model-switch/pull/198)、[#232](https://github.com/CtriXin/multi-model-switch/pull/232)、[#266](https://github.com/CtriXin/multi-model-switch/pull/266)、[#299](https://github.com/CtriXin/multi-model-switch/pull/299)、[#313](https://github.com/CtriXin/multi-model-switch/pull/313)、[#315](https://github.com/CtriXin/multi-model-switch/pull/315)、[#316](https://github.com/CtriXin/multi-model-switch/pull/316)、[#318](https://github.com/CtriXin/multi-model-switch/pull/318)、[#319](https://github.com/CtriXin/multi-model-switch/pull/319)、[#327](https://github.com/CtriXin/multi-model-switch/pull/327)、[#328](https://github.com/CtriXin/multi-model-switch/pull/328)、[#338](https://github.com/CtriXin/multi-model-switch/pull/338)、[#339](https://github.com/CtriXin/multi-model-switch/pull/339)、[#344](https://github.com/CtriXin/multi-model-switch/pull/344)、[#347](https://github.com/CtriXin/multi-model-switch/pull/347)。

源码入口：[mms_web/updates.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/updates.py)；[mms_web/update_handoff.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/update_handoff.py)；[mms_web/update_install.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/update_install.py)。

回归入口：[tests/test_mms_web_update_transaction.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_update_transaction.py)；[tests/test_mms_web_update_safety.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_update_safety.py)；[tests/test_mms_web_update_auth_transport.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_update_auth_transport.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C11.01 运行版本、安装版本、前端bundle版本一致**（原版 R；fork：已验，2026-09-19 `mms/adapter/upgrade.py`，launcher `upgrade` / `rollback`；gate O10、L8：只装从当前代码构建的产物，切换后校验页面标题和 ui-mms；[E10](MIGRATION-EVIDENCE.md#e10)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：fork当前commit一致；长期version.json与升级后标记仍待迁。
- [ ] **C11.02 检查更新及Stable/Preview选择**（原版 R；fork：部分，`upgrade --check` 对比已安装、源码和远端 commit；fork 只有 `mms` 一条线，没有 Stable/Preview；[E09](MIGRATION-EVIDENCE.md#e09)、[E10](MIGRATION-EVIDENCE.md#e10)）。验收：切通道不被版本大小比较误报已最新；不伪称自动5→4降级。
- [ ] **C11.03 完整升级确认步骤、影响说明、取消返回**（原版 R；fork：部分，2026-09-19 `mms/adapter/upgrade.py`，launcher `upgrade` / `rollback`；gate O10、L8：终端里列出改动和影响、输入 y 才继续，其他输入取消且不动安装；应用内入口未做；[E09](MIGRATION-EVIDENCE.md#e09)）。验收：关键确认需真点击；effect接线断开时回归能检出。
- [x] **C11.04 ready后才切换安装和服务，保持原端口**（原版 R；fork：已验，2026-09-19 `mms/adapter/upgrade.py`，launcher `upgrade` / `rollback`；gate O10、L8：新版本先带会话副本在空闲端口预检，通过才切换；[E10](MIGRATION-EVIDENCE.md#e10)）。验收：未就绪不替换，切换后普通URL加载正确bundle。
- [x] **C11.05 失败回滚与会话/配置备份**（原版 R；fork：已验，2026-09-19 `mms/adapter/upgrade.py`，launcher `upgrade` / `rollback`；gate O10、L8：切换后未就绪自动恢复原安装；rollback 带上当前会话；[E10](MIGRATION-EVIDENCE.md#e10)）。验收：回退过程也鉴权；原会话和用户配置保持。
- [x] **C11.06 version.json记录实际安装目标与正确根目录**（原版 R；fork：已验，2026-09-19 `mms/adapter/upgrade.py`，launcher `upgrade` / `rollback`；gate O10、L8：installation.json 原子写入，切换后路径改写到最终目录；[E09](MIGRATION-EVIDENCE.md#e09)、[E10](MIGRATION-EVIDENCE.md#e10)）。验收：不写错暂存目录，不把损坏metadata当成功。
- [x] **C11.07 升级检查绕过环境代理并拒绝重定向**（原版 R；fork：已验，2026-09-19 `mms/adapter/upgrade.py`，launcher `upgrade` / `rollback`；gate O10、L8：探测只连 127.0.0.1、忽略环境代理、拒绝跨主机重定向；[E10](MIGRATION-EVIDENCE.md#e10)）。验收：凭据不外送；只读取当前实例状态，missing token不降级。
- [ ] **C11.08 跨布局升级提前拒绝与双线重装指引**（原版 R；fork：未迁；[E22](MIGRATION-EVIDENCE.md#e22)）。验收：staging和install真实consumer两处拒绝flat候选，拒绝发生在probe/backup/关闭会话/cutover之前；保留当前安装、会话和端口，指向正确Stable/Preview目标安装器；两个caller独立mutation必须检出，不强行混装。

<a id="c12"></a>
## C12 · 模型/effort/focus 与日常交互

原 PR：[#133](https://github.com/CtriXin/multi-model-switch/pull/133)、[#135](https://github.com/CtriXin/multi-model-switch/pull/135)、[#138](https://github.com/CtriXin/multi-model-switch/pull/138)、[#174](https://github.com/CtriXin/multi-model-switch/pull/174)、[#179](https://github.com/CtriXin/multi-model-switch/pull/179)、[#180](https://github.com/CtriXin/multi-model-switch/pull/180)、[#236](https://github.com/CtriXin/multi-model-switch/pull/236)、[#282](https://github.com/CtriXin/multi-model-switch/pull/282)、[#288](https://github.com/CtriXin/multi-model-switch/pull/288)、[#289](https://github.com/CtriXin/multi-model-switch/pull/289)、[#303](https://github.com/CtriXin/multi-model-switch/pull/303)、[#304](https://github.com/CtriXin/multi-model-switch/pull/304)、[#311](https://github.com/CtriXin/multi-model-switch/pull/311)、[#314](https://github.com/CtriXin/multi-model-switch/pull/314)、[#320](https://github.com/CtriXin/multi-model-switch/pull/320)、[#323](https://github.com/CtriXin/multi-model-switch/pull/323)、[#328](https://github.com/CtriXin/multi-model-switch/pull/328)、[#329](https://github.com/CtriXin/multi-model-switch/pull/329)、[#331](https://github.com/CtriXin/multi-model-switch/pull/331)、[#332](https://github.com/CtriXin/multi-model-switch/pull/332)、[#334](https://github.com/CtriXin/multi-model-switch/pull/334)、[#345](https://github.com/CtriXin/multi-model-switch/pull/345)、[#346](https://github.com/CtriXin/multi-model-switch/pull/346)。

源码入口：[apps/mms-web/src/QuickModelMenu.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/QuickModelMenu.tsx)；[apps/mms-web/src/TaskSettings.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/TaskSettings.tsx)；[apps/mms-web/src/dialog-focus.ts](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/dialog-focus.ts)；[apps/mms-web/src/App.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/App.tsx)；[apps/mms-web/src/clipboard.ts](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/clipboard.ts)。

回归入口：[apps/mms-web/tests/dialog-focus.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/dialog-focus.test.mjs)；[apps/mms-web/tests/composer-effort-picker.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/composer-effort-picker.test.mjs)；[apps/mms-web/tests/model-settings-refresh.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/model-settings-refresh.test.mjs)；[tests/test_mms_web_ui_preferences.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_ui_preferences.py)。路径按新布局核对；此处不等同本轮执行。

- [x] **C12.01 模型/通道搜索，打开即可输入**（原版 R；fork：已验；[E08](MIGRATION-EVIDENCE.md#e08)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：搜索名称、wire ID、通道；结果选择后实际session改变。
- [x] **C12.02 独立常驻 effort，直接打开档位**（原版 R；fork：已验；[E08](MIGRATION-EVIDENCE.md#e08)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：两次点击完成；成功才关闭，失败保留，焦点回正确入口。
- [ ] **C12.03 模型去重/收藏优先/友好通道名与高级选项**（原版 P；fork：部分；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：同模型多路由可区分但不淹没常用选择；收藏排序保留。
- [ ] **C12.04 各输入弹窗focus、Esc层级、关闭回入口**（原版 R；fork：部分；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：模型/pwd已做；改名、资料、帮助、Bot设定等逐入口验收。
- [ ] **C12.05 异步保存等待、失败保留输入、旧响应不覆盖新选择**（原版 R；fork：部分；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：按完整保存调用链断言，不能只验证helper。
- [x] **C12.06 侧栏双击改名与首字符不被延迟select覆盖**（原版 R；fork：已验，2026-09-19 实测（临时实例，真实模型）：dsh 是改名弹窗而不是双击行内改名；打开后立即连续输入「颜色测试X」，保存后侧栏标题完整；[E07](MIGRATION-EVIDENCE.md#e07)、[E09](MIGRATION-EVIDENCE.md#e09)）。验收：打开即focus；持续输入不丢首字符，保存真实生效。
- [ ] **C12.07 未读完成/已读待命及真实滚动已读语义**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)、[E21](MIGRATION-EVIDENCE.md#e21)）。验收：准确记录打开即滚到底/停在中途的差异，不按旧宣传推断；FEATURES在main/dev对此描述不同，按各自真实state/UI检查；保留dev打开后到底转已读、中途停留保持未读的具体语义。
- [ ] **C12.08 可拖高/自增高composer、滚动折叠和专注阅读**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：输入不遮挡，最终答案/错误/批准保持可见，关闭恢复阅读位置。
- [ ] **C12.09 Enter发送开关、主题/字号/强调色与设置布局**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：偏好持久化，大字窄屏仍可操作。
- [ ] **C12.10 连接横幅防抖、错误类型分流与恢复消除**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：短暂轮询失败不冒红条；真实断连不隐藏。
- [ ] **C12.11 390px弹层定位、44px触控目标与键盘导航**（原版 R；fork：部分；[E08](MIGRATION-EVIDENCE.md#e08)、[E09](MIGRATION-EVIDENCE.md#e09)）。验收：当前目录/effort无溢出；其余菜单/输入逐项验，不等同实体手机。
- [ ] **C12.12 选择即复制及不安全上下文降级**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：设置→使用，默认关闭；只复制对话区非空选区，输入框/contenteditable 不触发；依赖 navigator.clipboard 安全上下文，普通 LAN HTTP 无能力时不执行，失败静默跳过且不破坏文本选择。
- [ ] **C12.13 会话按 workspace 分组与折叠状态记忆**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：按实际 workspace 分组；折叠/展开在浏览器刷新后保持，收起/展开全部与键盘可达，不移动或丢失会话。

<a id="c13"></a>
## C13 · 聊天、过程、队列与 BTW

原 PR：[#111](https://github.com/CtriXin/multi-model-switch/pull/111)、[#133](https://github.com/CtriXin/multi-model-switch/pull/133)、[#157](https://github.com/CtriXin/multi-model-switch/pull/157)、[#221](https://github.com/CtriXin/multi-model-switch/pull/221)、[#258](https://github.com/CtriXin/multi-model-switch/pull/258)、[#259](https://github.com/CtriXin/multi-model-switch/pull/259)、[#281](https://github.com/CtriXin/multi-model-switch/pull/281)、[#286](https://github.com/CtriXin/multi-model-switch/pull/286)、[#294](https://github.com/CtriXin/multi-model-switch/pull/294)、[#311](https://github.com/CtriXin/multi-model-switch/pull/311)、[#334](https://github.com/CtriXin/multi-model-switch/pull/334)。

源码入口：[mms_web/side_questions.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/side_questions.py)；[mms_web/session_actions.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/session_actions.py)；[apps/mms-web/src/SideQuestions.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/SideQuestions.tsx)；[apps/mms-web/src/Composer.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/Composer.tsx)；[apps/mms-web/src/SessionTools.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/SessionTools.tsx)；[apps/mms-web/src/ConversationOutline.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/ConversationOutline.tsx)。

回归入口：[tests/test_mms_web_btw_context.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_btw_context.py)；[tests/test_mms_web_btw_route_model.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_btw_route_model.py)；[apps/mms-web/tests/side-questions.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/side-questions.test.mjs)；[tests/test_mms_web_sessions_pi_driver.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_sessions_pi_driver.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C13.01 流式回复、thinking/tools分组、时间与用量**（原版 R；fork：未验；[E01](MIGRATION-EVIDENCE.md#e01)）。验收：DSH已有底座，需对齐完整工具失败/最终答案可见性。
- [ ] **C13.02 单轮/全部过程折叠与完成自动折叠偏好**（原版 R；fork：未迁；[E01](MIGRATION-EVIDENCE.md#e01)）。验收：错误、待确认、最终答案不被折叠掉。
- [ ] **C13.03 steer/interrupt与普通follow-up队列分离**（原版 P；fork：部分，停止会 kill 后台 job 且不再唤醒（`mms-stop`，gate L5 已验），队列/插话为上游原生、实测可用，未跑完整忙碌会话三态验收；[E06](MIGRATION-EVIDENCE.md#e06)）。验收：真实忙碌会话分别接受/排队/停止，不混成普通消息。
- [ ] **C13.04 队列提升/移除/重排及实际delivery状态**（原版 P；fork：未迁；[E06](MIGRATION-EVIDENCE.md#e06)）。验收：服务端实际顺序一致；已送达不能显示撤回成功。
- [ ] **C13.05 中途引导或重启后的空白回合和重发**（原版 P；fork：未迁；[E06](MIGRATION-EVIDENCE.md#e06)）。验收：中断原因可见，作废消息可准备重发，不自动重放。
- [ ] **C13.06 BTW独立上下文与主transcript/queue隔离**（原版 P；fork：部分，2026-09-19 `mms/adapter/plugin-btw.mjs`：`/btw` 是一次辅助模型调用，命令结果只写日志、不进入模型输入；上下文来自 session projection（最近 12 条人和模型的文字，每条截断，打码常见密钥）。gate L7 实测：主任务前台 `sleep` 期间旁问能答出之前的暗号，主任务照常完成。**未验**：取消旁问与取消主任务互不影响；[E06](MIGRATION-EVIDENCE.md#e06)）。验收：旁问不打断主任务；有界脱敏上下文，取消互不影响；E06 仅验证旧实现的限定场景，当前 native BTW 与忙碌主任务并发仍须重核。
- [x] **C13.07 BTW实际回答模型/来源/用量与错误可见**（原版 P；fork：已验，2026-09-19：卡片写明实际回答的模型、通道、输入/输出 token 和参考条数；失败写「旁问失败（模型）」并打码；会话还没发过请求时明确说「没有发出旁问请求」。O9 单测 6 项，gate L7 实测；[E06](MIGRATION-EVIDENCE.md#e06)）。验收：状态回答与模型回答分开，未发请求不能显示模型已答；E06 仅验证旧实现的限定场景，当前 native BTW 与忙碌主任务并发仍须重核。
- [ ] **C13.08 BTW折叠/已处置状态跨刷新和切会话保留**（原版 P；fork：未迁；[E06](MIGRATION-EVIDENCE.md#e06)）。验收：多卡片状态独立，运行中/首次未读规则准确。
- [ ] **C13.09 等待用户回复/批准/结束等待真实接线**（原版 R；fork：部分，2026-09-19 实测（临时实例，真实模型）：ask_user_question 端到端通过（界面出单选卡，点「蓝」提交，模型回复「蓝」）；审批流程未测；[E09](MIGRATION-EVIDENCE.md#e09)）。验收：按钮真正调用所需控制，不因UI存在就算功能通过。
- [ ] **C13.10 普通会话自动压缩、立即压缩及失败重试**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：autoCompaction/autoRetry 进入普通 Pi 控制链；立即 compact 透传 customInstructions 保留要求（当前上限 4000 字符），实际成功才显示完成；与 Bot 执行前 retry 分开记录，失败可见；DSH 原生提供等价功能也必须回归。
- [ ] **C13.11 斜线命令与动态扩展补全**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：/help /files /plan on|off /thinking LEVEL /compact [保留要求] /clear-queue /name /fork /export，另有已有 BTW；输入 / 列出，方向键选择，Tab/Enter 补全，带参数 Enter 执行；当前 Pi 扩展命令动态列出，未知/不支持明确报错，不把补全直接当发送。
- [ ] **C13.12 对话大纲与提问刻度导航**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：hover 展开，键盘/触屏可达，点击定位真实消息锚点；回到最新与未读状态一致，不因消息增长跳到错误位置。
- [ ] **C13.13 原生 confirm/select/input/editor 与等待状态**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：真实工具交互渲染相应输入控件，回复/取消送回对应请求；等待状态只来自明确的工具请求，idle不是错误；错误与最终回复保持可见。
- [ ] **C13.14 运行详情的实际协议、context、Token/cache 与脱敏进程**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：显示实际提供的 Thinking、选中通道/模型/协议、上下文占比及原生用量和cache；未提供的数据不编造，费用不冒充供应商账单，进程详情不泄露凭据。
- [ ] **C13.15 普通会话执行/只读规划的工具边界**（原版 T；fork：部分，2026-09-19 `mms/adapter/plugin-plan.mjs`：用上游 `ctx.tools.guard`，计划模式下只放行 read / read_image / grep / glob / ask_user_question / exit_plan_mode（dsh 没有 find/ls，glob 覆盖二者），其他全部拒绝，包括 bash、run_code、子 agent、MCP、web；`/plan off` 恢复。gate L6 实测：计划模式里 bash `ls` 被 MMS 规则拒绝，关闭后同一调用成功；插件未生效时 L6 变红。**未做**：UI 上常驻「这不是 OS sandbox」标识（目前只在拒绝原因里写明）；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：普通 /plan 默认关闭；开启后 runtime tool_call 只放行 read/grep/find/ls，拒绝写入、shell及其他工具；关闭恢复原权限；UI标明这不是 OS sandbox，并与 Fleet worker 永久只读边界分开。

<a id="c14"></a>
## C14 · pwd、项目定位与文件引用

原 PR：[#128](https://github.com/CtriXin/multi-model-switch/pull/128)、[#132](https://github.com/CtriXin/multi-model-switch/pull/132)、[#155](https://github.com/CtriXin/multi-model-switch/pull/155)、[#182](https://github.com/CtriXin/multi-model-switch/pull/182)、[#250](https://github.com/CtriXin/multi-model-switch/pull/250)、[#251](https://github.com/CtriXin/multi-model-switch/pull/251)、[#289](https://github.com/CtriXin/multi-model-switch/pull/289)、[#307](https://github.com/CtriXin/multi-model-switch/pull/307)、[#313](https://github.com/CtriXin/multi-model-switch/pull/313)、[#325](https://github.com/CtriXin/multi-model-switch/pull/325)、[#333](https://github.com/CtriXin/multi-model-switch/pull/333)、[#335](https://github.com/CtriXin/multi-model-switch/pull/335)、[#336](https://github.com/CtriXin/multi-model-switch/pull/336)。

源码入口：[mms_web/workspace_search.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/workspace_search.py)；[mms_web/workspace_browse.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/workspace_browse.py)；[apps/mms-web/src/LaunchOptions.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/LaunchOptions.tsx)；[apps/mms-web/src/App.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/App.tsx)。

回归入口：[tests/test_mms_web_workspace_search.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_workspace_search.py)；[tests/test_mms_web_workspace_locate.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_workspace_locate.py)；[tests/test_mms_web_workspace_browse.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_workspace_browse.py)；[apps/mms-web/tests/workspace-dialog-wiring.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/workspace-dialog-wiring.test.mjs)。路径按新布局核对；此处不等同本轮执行。

- [x] **C14.01 已有项目按名字/完整路径搜索并确认实际cwd**（原版 P；fork：已验；[E03](MIGRATION-EVIDENCE.md#e03)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：fork Host已有项目可搜；明确确认后bash pwd与选择一致。
- [x] **C14.02 路径直达、打开focus、无效路径不误采用旧目录**（原版 R；fork：已验；[E08](MIGRATION-EVIDENCE.md#e08)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：路径加载失败保留错误，旧异步响应不覆盖新输入。
- [ ] **C14.03 记住上次项目、MMS项目历史与可选zoxide历史**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)）。验收：复用已有记录；不要求用户重新添加全部项目，不新增必装依赖。
- [ ] **C14.04 应用内主机目录树、根目录/隐藏项/新建目录**（原版 R；fork：部分；[E09](MIGRATION-EVIDENCE.md#e09)）。验收：fork基础browser已有；手机主机树、不同OS与权限逐项验。
- [ ] **C14.05 同名文件夹通过内容指纹定位原路径**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：多候选让用户选；只按名称不能擅自命中其他目录。
- [ ] **C14.06 目录树键盘、每层截断提示、取消与390px路径**（原版 R；fork：部分；[E09](MIGRATION-EVIDENCE.md#e09)）。验收：ArrowLeft/Right真实接线；折叠提示消失，完整路径仍可辨。
- [ ] **C14.07 本地原路径引用、拖入文件副本与正文位置**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)、[E04](MIGRATION-EVIDENCE.md#e04)）。验收：有路径不强制复制；无路径导入项目附件，多个文件可穿插说明。
- [ ] **C14.08 草稿引用刷新恢复、移除生效与过期附件清理**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：删引用后刷新/发送不再携带；清理仅处理无引用导入副本。
- [ ] **C14.09 workspace 排序、改显示名、移除与原文件保护**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：手动/最后编辑排序、上移下移、复制路径、目录内新会话和显示名编辑；移除只去侧栏，保留目录/文件/会话并归其他workspace，启动目录不可移除；排序/展开状态持久化。

<a id="c15"></a>
## C15 · 品牌、中文帮助与入门

原 PR：[#119](https://github.com/CtriXin/multi-model-switch/pull/119)、[#131](https://github.com/CtriXin/multi-model-switch/pull/131)、[#142](https://github.com/CtriXin/multi-model-switch/pull/142)、[#143](https://github.com/CtriXin/multi-model-switch/pull/143)、[#155](https://github.com/CtriXin/multi-model-switch/pull/155)、[#216](https://github.com/CtriXin/multi-model-switch/pull/216)、[#218](https://github.com/CtriXin/multi-model-switch/pull/218)、[#243](https://github.com/CtriXin/multi-model-switch/pull/243)、[#277](https://github.com/CtriXin/multi-model-switch/pull/277)、[#322](https://github.com/CtriXin/multi-model-switch/pull/322)。

源码入口：[apps/mms-web/src/HelpGuide.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/HelpGuide.tsx)；[apps/mms-web/src/GuidedTour.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/GuidedTour.tsx)；[apps/mms-web/src/VendorMark.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/VendorMark.tsx)。

回归入口：[apps/mms-web/tests/brand-version-updates.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/brand-version-updates.test.mjs)；[apps/mms-web/tests/guided-tour-bots.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/guided-tour-bots.test.mjs)。路径按新布局核对；此处不等同本轮执行。

- [x] **C15.01 自有MMS Harness品牌与可识别运行版本**（原版 P；fork：已验；[E04](MIGRATION-EVIDENCE.md#e04)、[E17](MIGRATION-EVIDENCE.md#e17)）。验收：fork页面及独立入口显示MMS Harness和对应commit，许可保留。
- [ ] **C15.02 先连接真实服务再开始聊天引导**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)）。验收：圈亮真实输入/保存，支持错误重试/返回/跳过，不自动发消息。
- [ ] **C15.03 帮助搜索、问号重开与安装级已看标记**（原版 P；fork：未迁；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：换端口/浏览器不重复教程；搜索打开即focus。
- [ ] **C15.04 Markdown更新说明、旧安装What's New与版本快捷入口**（原版 P；fork：未迁；[E04](MIGRATION-EVIDENCE.md#e04)）。验收：旧用户也可打开实际本版说明，不出现虚假已更新。
- [ ] **C15.05 面向同事的任务/文件/工作目录说明与示例**（原版 P；fork：未迁；[E03](MIGRATION-EVIDENCE.md#e03)）。验收：普通用户可从真实入口跑完场景，不依赖内部脚本清单。
- [ ] **C15.06 厂商标记与许可、无图标回退**（原版 T；fork：未迁；[E21](MIGRATION-EVIDENCE.md#e21)）。验收：复用 @lobehub/icons-static-svg 的 MIT 资源和许可，按厂商键查找；无对应文件回退首字母，不自行造图形冒充官方 logo；沿 fork 原生图标也须许可与实际厂商匹配。

<a id="c16"></a>
## C16 · 持久 Bot 产品层

原 PR：[#239](https://github.com/CtriXin/multi-model-switch/pull/239)、[#242](https://github.com/CtriXin/multi-model-switch/pull/242)、[#254](https://github.com/CtriXin/multi-model-switch/pull/254)、[#265](https://github.com/CtriXin/multi-model-switch/pull/265)、[#269](https://github.com/CtriXin/multi-model-switch/pull/269)、[#270](https://github.com/CtriXin/multi-model-switch/pull/270)、[#278](https://github.com/CtriXin/multi-model-switch/pull/278)、[#288](https://github.com/CtriXin/multi-model-switch/pull/288)、[#306](https://github.com/CtriXin/multi-model-switch/pull/306)、[#310](https://github.com/CtriXin/multi-model-switch/pull/310)、[#314](https://github.com/CtriXin/multi-model-switch/pull/314)、[#331](https://github.com/CtriXin/multi-model-switch/pull/331)。

源码入口：[mms_web/bots.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bots.py)；[mms_web/bot_memory.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_memory.py)；[apps/mms-web/src/Bot.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/Bot.tsx)；[apps/mms-web/src/BotStudio.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/BotStudio.tsx)。

回归入口：[tests/test_mms_bot_runtime.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_runtime.py)；[tests/test_bot_memory.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_bot_memory.py)；[tests/test_mms_bot_model_switch.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_model_switch.py)；[tests/test_mms_bot_compaction.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_compaction.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C16.01 持久Bot身份、职责、模型预设、创建/编辑/删除**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：独立身份跨重启保留；删除只影响所属状态。
- [ ] **C16.02 任务状态机、requestId幂等、优先级与排队原因**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：重复请求不重复执行，queued/waiting/interrupted含义准确。
- [ ] **C16.03 主会话与临时任务会话隔离**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)、[E14](MIGRATION-EVIDENCE.md#e14)）。验收：临时计划/worker不占用或污染Bot主会话。
- [ ] **C16.04 长期记忆的查看/搜索/增改删与预算**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：每Bot独立，来源可追溯，关闭记忆不偷偷继续写。
- [ ] **C16.05 真实context比例、压缩触发与小会话保护**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：不会提前compact或把无需压缩当任务失败。
- [ ] **C16.06 自动唤醒总闸与修改设定时保持原值**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：改模型/说明不误关闭wake，状态文案与实际一致。
- [ ] **C16.07 聊天换模型：唯一匹配、歧义询问、下一轮生效**（原版 P；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：列真实catalog；头部显示current/pending，失败明确而不永久卡死。
- [ ] **C16.08 模型胶囊直达设定与待生效选择替换/清除**（原版 R；fork：未迁；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：保存pending而非覆盖运行中preset，选回current清除pending。
- [ ] **C16.09 对话式创建、预设编辑、未保存退出保护与主题**（原版 P；fork：未迁；[E08](MIGRATION-EVIDENCE.md#e08)、[E13](MIGRATION-EVIDENCE.md#e13)）。验收：首屏入口实际挂载；child Esc不丢草稿，取消保持编辑。

<a id="c17"></a>
## C17 · 计划、批准、协作与执行边界

原 PR：[#241](https://github.com/CtriXin/multi-model-switch/pull/241)、[#242](https://github.com/CtriXin/multi-model-switch/pull/242)、[#254](https://github.com/CtriXin/multi-model-switch/pull/254)、[#265](https://github.com/CtriXin/multi-model-switch/pull/265)、[#310](https://github.com/CtriXin/multi-model-switch/pull/310)、[#315](https://github.com/CtriXin/multi-model-switch/pull/315)。

源码入口：[mms_web/bot_coordinator.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_coordinator.py)；[mms_web/bot_executor.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_executor.py)；[mms_web/bot_communications.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_communications.py)。

回归入口：[tests/test_mms_bot_coordinator.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_coordinator.py)；[tests/test_mms_bot_runtime.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_runtime.py)；[apps/mms-web/tests/bot-plan-alignment.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/bot-plan-alignment.test.mjs)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C17.01 Bot自己的模型产生可读计划，支持direct-first**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：计划来源可追溯；简单任务不被强制拆解，模式可配置。
- [ ] **C17.02 计划批准/拒绝/替换与撤回边界**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：拒绝后不执行；UI控制真正调用runtime，过期撤回不假成功。
- [ ] **C17.03 dependsOn DAG派发、依赖等待与汇总只恢复一次**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：未满足依赖不启动，同一完成通知不重复恢复父任务。
- [ ] **C17.04 计划每一步指定模型实际生效**（原版 R；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：核对实际worker route；不能只改label或requested字段。
- [ ] **C17.05 override一次性会话、主会话/pending不被消耗**（原版 R；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：成功失败都回收；后续普通轮仍在预期主会话和模型。
- [ ] **C17.06 peer mailbox、回执、协作深度/并发/workspace串行**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：消息与权限绑定任务身份，不把advisory writeScopes当写锁。

<a id="c18"></a>
## C18 · 独立周期日程

原 PR：[#278](https://github.com/CtriXin/multi-model-switch/pull/278)、[#302](https://github.com/CtriXin/multi-model-switch/pull/302)、[#306](https://github.com/CtriXin/multi-model-switch/pull/306)、[#310](https://github.com/CtriXin/multi-model-switch/pull/310)、[#315](https://github.com/CtriXin/multi-model-switch/pull/315)、[#331](https://github.com/CtriXin/multi-model-switch/pull/331)。

源码入口：[mms_web/bot_schedules.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_schedules.py)；[apps/mms-web/src/BotSchedulePanel.tsx](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/BotSchedulePanel.tsx)；[apps/mms-web/src/bot-schedules.ts](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/bot-schedules.ts)。

回归入口：[tests/test_mms_bot_schedules.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_schedules.py)；[apps/mms-web/tests/bot-schedule-ui-wiring.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/bot-schedule-ui-wiring.test.mjs)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C18.01 独立schedule实体，once/interval/daily/weekly**（原版 P；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：持久化实体与每次执行task分离，不用session reminder冒充。
- [ ] **C18.02 IANA时区、DST与interval无漂移**（原版 P；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：春跳/秋重/跨周边界与重复时刻有确定结果。
- [ ] **C18.03 错过周期、overlap skip/queue与唤醒总闸**（原版 P；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：不重放积压副作用；总闸关闭与单条暂停区分。
- [ ] **C18.04 暂停/恢复/编辑/删除，once失败不被提前消费**（原版 P；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：暂停once保留；改正文不漂移时间；删schedule不删已执行task。
- [ ] **C18.05 最小间隔、数量限制、非法timezone/坏行停用**（原版 P；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：越界拒绝且解释；坏行保留诊断不让整个scheduler停摆。
- [ ] **C18.06 四类创建入口、管理列表四态与空列表直达**（原版 P；fork：未迁；[E08](MIGRATION-EVIDENCE.md#e08)）。验收：生产挂载路径真实可达；启停等服务端成功后显示。
- [ ] **C18.07 旧scheduled task迁移、Fleet意图与重启持久化**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：重复加载不增生；执行时策略合同明确，不默认开启旧Fleet。

<a id="c19"></a>
## C19 · Fleet 多模型意见与只读 worker（#295）

原 PR：[#242](https://github.com/CtriXin/multi-model-switch/pull/242)、[#295](https://github.com/CtriXin/multi-model-switch/pull/295)、[#331](https://github.com/CtriXin/multi-model-switch/pull/331)。

源码入口：[mms_web/bot_coordinator.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_coordinator.py)；[mms_web/bot_executor.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_executor.py)；[apps/mms-web/src/bot-fleet.ts](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/src/bot-fleet.ts)。

回归入口：[tests/test_mms_bot_fleet_safety.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_fleet_safety.py)；[apps/mms-web/tests/bot-fleet-bar.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/bot-fleet-bar.test.mjs)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C19.01 寻求场外帮助，听听/问仔细及多模型入口**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：保留现有产品能力和可选择入口，不能以DSH有subagent为由删除。
- [ ] **C19.02 显式家族/型号/来源选择与失效即停止**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：指定模型不可用时禁止替换，允许重选或恢复自动。
- [ ] **C19.03 coordinator内部创建worker，公共API不可伪造**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：普通请求不能注入workerKind或替换主会话。
- [ ] **C19.04 实际只读工具allowlist及禁止扩展加载**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：真实native工具广告与执行都拒绝write/bash/MCP/扩展提权。
- [ ] **C19.05 worker禁止续聊、换模型、fork与转成可写**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：每个控制API负向测试，不能改一次模型就丢readOnly。
- [ ] **C19.06 意见隔离，不污染主会话/pending/长期记忆**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：多个reader相互独立，owner只在汇总读取结果。
- [ ] **C19.07 成功失败均回收，启动失败不悬挂父任务**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)）。验收：真实子进程退出/归档可观测；父汇总最多一次。
- [ ] **C19.08 批准/定时Fleet意图、汇总分歧和风险**（原版 R；fork：未迁；[E07](MIGRATION-EVIDENCE.md#e07)、[E08](MIGRATION-EVIDENCE.md#e08)）。验收：重启意图保留；结论如实包含分歧，不伪造一致意见。

<a id="c20"></a>
## C20 · 执行前重试、通知与送达

原 PR：[#240](https://github.com/CtriXin/multi-model-switch/pull/240)、[#242](https://github.com/CtriXin/multi-model-switch/pull/242)、[#278](https://github.com/CtriXin/multi-model-switch/pull/278)。

源码入口：[mms_web/bot_retry.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_retry.py)；[mms_web/bot_notify.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/bot_notify.py)。

回归入口：[tests/test_mms_bot_retry.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_retry.py)；[tests/test_mms_bot_notify.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_bot_notify.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C20.01 仅执行开始前的有界transient退避重试**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：三次预算与错误分类明确；已开始/未知执行结果不自动重放。
- [ ] **C20.02 任务完成/失败事件与通知inbox**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：任务结果和通知投递结果分开，不把通知失败改成任务失败。
- [ ] **C20.03 HMAC webhook、投递重试与去重**（原版 P；fork：未迁；[E13](MIGRATION-EVIDENCE.md#e13)）。验收：签名与request identity校验；secret不写结果，不重复通知。
- [ ] **C20.04 通知携带schedule/任务来源并可追溯**（原版 P；fork：未迁；[E14](MIGRATION-EVIDENCE.md#e14)）。验收：从通知能定位真实触发者和任务，保留失败原因。

<a id="c21"></a>
## C21 · 发行通道与数据兼容

原 PR：[#253](https://github.com/CtriXin/multi-model-switch/pull/253)、[#255](https://github.com/CtriXin/multi-model-switch/pull/255)、[#262](https://github.com/CtriXin/multi-model-switch/pull/262)、[#271](https://github.com/CtriXin/multi-model-switch/pull/271)、[#272](https://github.com/CtriXin/multi-model-switch/pull/272)、[#273](https://github.com/CtriXin/multi-model-switch/pull/273)、[#274](https://github.com/CtriXin/multi-model-switch/pull/274)、[#279](https://github.com/CtriXin/multi-model-switch/pull/279)、[#299](https://github.com/CtriXin/multi-model-switch/pull/299)、[#316](https://github.com/CtriXin/multi-model-switch/pull/316)、[#327](https://github.com/CtriXin/multi-model-switch/pull/327)。

源码入口：[mms_web/sessions.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/sessions.py)；[mms_web/server.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/server.py)；[docs/mms-web/CHANNEL-SWITCHING.md](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/CHANNEL-SWITCHING.md)。

回归入口：[tests/test_mms_channel_switch_contract.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_channel_switch_contract.py)；[tests/test_mms_session_owner_forward_compat.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_session_owner_forward_compat.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C21.01 Stable/Preview明确选择与独立版本判断**（原版 R；fork：未迁；[E09](MIGRATION-EVIDENCE.md#e09)、[E18](MIGRATION-EVIDENCE.md#e18)）。验收：版本线清楚且可逆，不把5→4当普通自动升级。
- [x] **C21.02 未知owner会话不泄漏到列表/详情**（原版 R；fork：已验，2026-09-19 实测（临时实例，真实模型）：Pilot 的 owner 在 dsh 对应会话格式版本。放一个格式 v99 的会话文件，列表跳过它不报错，对它发消息被拒（resume failed），文件字节不变。附带发现：一个损坏的会话文件会让整个会话搜索失败，这是上游行为；[E18](MIGRATION-EVIDENCE.md#e18)）。验收：旧版本看到不认识的owner时拒绝，不改写原文件。
- [ ] **C21.03 未知owner的mutation端点完整fail-closed**（原版 缺口；fork：未迁；[E18](MIGRATION-EVIDENCE.md#e18)）。验收：历史报告承认残留；必须按当前源码重核，不得用列表测试盖章。
- [ ] **C21.04 4→5→4往返保留Bot/schedule/memory及用户数据**（原版 R；fork：未迁；[E18](MIGRATION-EVIDENCE.md#e18)）。验收：schema与文件内容保留；fork建立自身版本兼容合同。

<a id="c22"></a>
## C22 · Windows 与跨平台

原 PR：[#231](https://github.com/CtriXin/multi-model-switch/pull/231)、[#244](https://github.com/CtriXin/multi-model-switch/pull/244)、[#246](https://github.com/CtriXin/multi-model-switch/pull/246)、[#248](https://github.com/CtriXin/multi-model-switch/pull/248)、[#249](https://github.com/CtriXin/multi-model-switch/pull/249)、[#250](https://github.com/CtriXin/multi-model-switch/pull/250)、[#251](https://github.com/CtriXin/multi-model-switch/pull/251)、[#256](https://github.com/CtriXin/multi-model-switch/pull/256)、[#318](https://github.com/CtriXin/multi-model-switch/pull/318)、[#325](https://github.com/CtriXin/multi-model-switch/pull/325)、[#335](https://github.com/CtriXin/multi-model-switch/pull/335)、[#336](https://github.com/CtriXin/multi-model-switch/pull/336)。

源码入口：[lib/mms_platform.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_platform.py)；[mms_web/workspace_browse.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/mms_web/workspace_browse.py)；[packages/mms-install/bin/install.ps1](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/packages/mms-install/bin/install.ps1)。

回归入口：[tests/test_windows_launcher_process.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_windows_launcher_process.py)；[tests/test_mms_web_atomic_write.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_atomic_write.py)；[tests/test_mms_web_workspace_browse.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_web_workspace_browse.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C22.01 Windows原生安装与Node/Pi/命令发现**（原版 P；fork：未迁；[E15](MIGRATION-EVIDENCE.md#e15)）。验收：中文codepage、npm.cmd/PATH等有效；Server证据不等同桌面。
- [ ] **C22.02 Windows子进程pipes与中文emoji历史读取**（原版 R；fork：未迁；[E15](MIGRATION-EVIDENCE.md#e15)）。验收：真实工具后回复完整，不因编码产生500或截断。
- [ ] **C22.03 跨平台原子写、锁、重试及写入失败可见**（原版 R；fork：未迁；[E09](MIGRATION-EVIDENCE.md#e09)）。验收：Windows replace失败不能吞掉数据；失败不回报已保存。
- [ ] **C22.04 路径/权限/symlink/reparse与目录树安全**（原版 R；fork：未验；[E09](MIGRATION-EVIDENCE.md#e09)）。验收：不同OS原路径语义保持；模拟测试与目标OS实测分开。
- [ ] **C22.05 跨平台停止/重启/服务发现与浏览器能力声明**（原版 P；fork：未迁；[E15](MIGRATION-EVIDENCE.md#e15)）。验收：不宣称所有平台browser backend都可用。
- [ ] **C22.06 Windows安装产物和真实桌面用户路径验收**（原版 缺口；fork：未迁；[E15](MIGRATION-EVIDENCE.md#e15)）。验收：已有Server矩阵保留；目标桌面需另跑安装、会话、目录、升级。

<a id="c23"></a>
## C23 · 验证资产与质量保障

原 PR：[#196](https://github.com/CtriXin/multi-model-switch/pull/196)、[#209](https://github.com/CtriXin/multi-model-switch/pull/209)、[#210](https://github.com/CtriXin/multi-model-switch/pull/210)、[#211](https://github.com/CtriXin/multi-model-switch/pull/211)、[#228](https://github.com/CtriXin/multi-model-switch/pull/228)、[#266](https://github.com/CtriXin/multi-model-switch/pull/266)、[#309](https://github.com/CtriXin/multi-model-switch/pull/309)、[#312](https://github.com/CtriXin/multi-model-switch/pull/312)、[#326](https://github.com/CtriXin/multi-model-switch/pull/326)、[#333](https://github.com/CtriXin/multi-model-switch/pull/333)、[#334](https://github.com/CtriXin/multi-model-switch/pull/334)、[#335](https://github.com/CtriXin/multi-model-switch/pull/335)、[#336](https://github.com/CtriXin/multi-model-switch/pull/336)。

源码入口：[scripts/ci_pytest_regression.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/scripts/ci_pytest_regression.py)；[scripts/regression_fresh_user_gate.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/scripts/regression_fresh_user_gate.py)；[tests/test_ci_pytest_regression_gate.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_ci_pytest_regression_gate.py)。

回归入口：[tests/test_mms_release_version.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_release_version.py)；[apps/mms-web/tests/workspace-dialog-wiring.test.mjs](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/apps/mms-web/tests/workspace-dialog-wiring.test.mjs)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C23.01 迁移真实失败案例及运行链路负向测试**（原版 R；fork：部分；[E07](MIGRATION-EVIDENCE.md#e07)、[E09](MIGRATION-EVIDENCE.md#e09)）。验收：保留旧bug场景；改平台后测试新执行链，不能只复制测试文件。
- [ ] **C23.02 删除/skip/xfail不算修复，rerun只认实际passed**（原版 R；fork：未迁；[E09](MIGRATION-EVIDENCE.md#e09)）。验收：门禁消费真实JUnit，保留初始失败与复测证据。
- [ ] **C23.03 前端完整组件/handler/effect接线与mutation**（原版 R；fork：部分；[E09](MIGRATION-EVIDENCE.md#e09)、[E12](MIGRATION-EVIDENCE.md#e12)）。验收：删关键调用点必须红；SSR/regex不能替代真实行为。
- [ ] **C23.04 源码/build/CI/安装/runtime/用户验收分层**（原版 R；fork：部分；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：每项记录实际证据；导入68路由不算68路由实跑。
- [ ] **C23.05 新HOME安装、版本/hash与跨线回归**（原版 R；fork：部分；[E01](MIGRATION-EVIDENCE.md#e01)、[E10](MIGRATION-EVIDENCE.md#e10)）。验收：干净构建可复现；目标设备/版本范围明确。

<a id="c24"></a>
## C24 · 历史、上游同步与交付追溯

原 PR：[#124](https://github.com/CtriXin/multi-model-switch/pull/124)、[#136](https://github.com/CtriXin/multi-model-switch/pull/136)、[#139](https://github.com/CtriXin/multi-model-switch/pull/139)、[#140](https://github.com/CtriXin/multi-model-switch/pull/140)、[#144](https://github.com/CtriXin/multi-model-switch/pull/144)、[#154](https://github.com/CtriXin/multi-model-switch/pull/154)、[#156](https://github.com/CtriXin/multi-model-switch/pull/156)、[#158](https://github.com/CtriXin/multi-model-switch/pull/158)、[#173](https://github.com/CtriXin/multi-model-switch/pull/173)、[#176](https://github.com/CtriXin/multi-model-switch/pull/176)、[#184](https://github.com/CtriXin/multi-model-switch/pull/184)、[#187](https://github.com/CtriXin/multi-model-switch/pull/187)、[#190](https://github.com/CtriXin/multi-model-switch/pull/190)、[#197](https://github.com/CtriXin/multi-model-switch/pull/197)、[#201](https://github.com/CtriXin/multi-model-switch/pull/201)、[#206](https://github.com/CtriXin/multi-model-switch/pull/206)、[#214](https://github.com/CtriXin/multi-model-switch/pull/214)、[#217](https://github.com/CtriXin/multi-model-switch/pull/217)、[#219](https://github.com/CtriXin/multi-model-switch/pull/219)、[#220](https://github.com/CtriXin/multi-model-switch/pull/220)、[#225](https://github.com/CtriXin/multi-model-switch/pull/225)、[#229](https://github.com/CtriXin/multi-model-switch/pull/229)、[#235](https://github.com/CtriXin/multi-model-switch/pull/235)、[#237](https://github.com/CtriXin/multi-model-switch/pull/237)、[#252](https://github.com/CtriXin/multi-model-switch/pull/252)、[#263](https://github.com/CtriXin/multi-model-switch/pull/263)、[#264](https://github.com/CtriXin/multi-model-switch/pull/264)、[#267](https://github.com/CtriXin/multi-model-switch/pull/267)、[#269](https://github.com/CtriXin/multi-model-switch/pull/269)、[#296](https://github.com/CtriXin/multi-model-switch/pull/296)、[#297](https://github.com/CtriXin/multi-model-switch/pull/297)、[#298](https://github.com/CtriXin/multi-model-switch/pull/298)、[#300](https://github.com/CtriXin/multi-model-switch/pull/300)、[#301](https://github.com/CtriXin/multi-model-switch/pull/301)、[#313](https://github.com/CtriXin/multi-model-switch/pull/313)、[#315](https://github.com/CtriXin/multi-model-switch/pull/315)、[#335](https://github.com/CtriXin/multi-model-switch/pull/335)、[#336](https://github.com/CtriXin/multi-model-switch/pull/336)、[#337](https://github.com/CtriXin/multi-model-switch/pull/337)、[#343](https://github.com/CtriXin/multi-model-switch/pull/343)、[#344](https://github.com/CtriXin/multi-model-switch/pull/344)、[#347](https://github.com/CtriXin/multi-model-switch/pull/347)。

源码入口：[docs/mms-web/CHANGELOG.md](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/docs/mms-web/CHANGELOG.md)；[lib/mms_version.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/lib/mms_version.py)。

回归入口：[tests/test_mms_release_version.py](https://github.com/CtriXin/multi-model-switch/blob/3d4ce70fa50bd3aa05128bfbf5d659071ab07719/tests/test_mms_release_version.py)。路径按新布局核对；此处不等同本轮执行。

- [ ] **C24.01 全部PR/merge/直接提交与能力的完整对照**（原版 R；fork：部分；[E19](MIGRATION-EVIDENCE.md#e19)）。验收：逐项有归宿，不将纯版本stamp计成独立功能；另一agent核对后冻结。
- [ ] **C24.02 保留上游历史/许可、自有分支与兼容更新流程**（原版 R；fork：部分；[E17](MIGRATION-EVIDENCE.md#e17)）。验收：fork已建立；每次upstream升级重跑迁移合同，再进入自有发行。
- [ ] **C24.03 README / AI onboarding 与源码布局一致**（原版 R；fork：未迁；[E22](MIGRATION-EVIDENCE.md#e22)）。验收：保留README大而全及折叠结构、main/dev与配置边界，AI入口指向正确源码/测试；lib路径与retirement链接有效，归档旧约束不能重启退休工作流。

<a id="c25"></a>
## C25 · 未合并候选（单列，不冒充已交付）

原 PR：[#290](https://github.com/CtriXin/multi-model-switch/pull/290)、[#308](https://github.com/CtriXin/multi-model-switch/pull/308)、[#330](https://github.com/CtriXin/multi-model-switch/pull/330)、[#340](https://github.com/CtriXin/multi-model-switch/pull/340)。

- [ ] **C25.01 #290 命名工作组合：模型+通道+effort**（原版 候选；fork：待核对；[E19](MIGRATION-EVIDENCE.md#e19)）。验收：原PR CLOSED；保留用户意图待对账，人设前缀污染方案不能冒充已验证能力。
- [ ] **C25.02 #330 低打扰自愿反馈**（原版 候选；fork：待核对；[E19](MIGRATION-EVIDENCE.md#e19)）。验收：当前OPEN；仅用户主动行为可发送，不自动开启遥测。
- [ ] **C25.03 #340 设置滚动容器间距修复**（原版 候选；fork：待核对；[E19](MIGRATION-EVIDENCE.md#e19)）。验收：当前OPEN；逐源码/实际视口核对后决定是否纳入，不按已合并算。

## 总任务完成条件

- [ ] 完成 PR、行为契约、用户功能三路枚举并保留独立差异；本次评审已处理，后续漏项继续分配稳定 ID，不静默删范围。
- [ ] 每个有效原版能力都有 fork 实现或经过等价行为验收的原生替代；原版报告不足的先补证据。
- [ ] 每个勾选项有实际 source、正向行为、关键失败路径和适用版本；模型/effort 核对实际请求，worker 核对真实执行权限。
- [ ] 手机、Windows、接收方 Recipe、外部 provider 各自按目标环境验证，明确未覆盖项；compile/CI 不能替代。
- [ ] 自有安装、更新、重启、回滚与旧数据迁移可用，原 MMS 会话/配置可保留并恢复；用户未明确确认前不写真实配置。
- [ ] 用户复核完整清单并确认真实使用验收。只有子项通过时更新子项，不能提前关闭总迁移任务。

## 本次评审与旧 ID 归属

用户转交的19项意见已采纳，另补契约/用户入口与T9a实际consumer。逐条处理见 [独立评审对照](MIGRATION-REVIEW-fable.md)，并不代表评审者已复核本版。旧 C25.04 → C10.06/C10.07/C11.08/C24.03，旧 C25.05 → C10.06/C11.08；保留映射，不把已合并内容丢弃。

## 交给另一位 agent 的核对任务

> 请独立核对 MMS 自 4.0 起到本清单固定 main/dev 基线的全部能力，再与 `mms/MIGRATION.md` 逐项对照。读取同目录的 `MIGRATION-EVIDENCE.md`、`MIGRATION-PR-COVERAGE.md` 和 `MIGRATION-HISTORY.csv`；同机可打开证据索引中的回归报告。请输出差异表：ID/漏项名称、同意或问题、原 PR/commit/source、实际验证范围、建议更正。重点区分“代码存在 / PR 宣称验证 / 实际运行记录 / 当前 fork 已验”，检查 #295/#320、#341/#342、#345/#346 和已合并 #337/#343/#344/#347。不要再讨论是否 fork，不以 DSH 已有同类能力删除项，不修改真实配置或关闭 PR；#308 不合入。本轮仅核对，保留原作者和你的独立判断，由用户对比。

| ID / 新漏项 | 判断 | source / PR / commit | 验证范围与限制 | 建议更正 |
|---|---|---|---|---|
| 待另一 agent 填写 | 同意 / 漏项 / 验证夸大 / 当前退化 / 状态过时 / 重复项 | 必须可追溯 | 不以绿灯代替行为 | 保留不同意见 |
