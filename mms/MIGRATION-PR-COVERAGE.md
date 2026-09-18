# MMS PR 与迁移能力对照

编制时间：2026-09-18T16:00:02+08:00。Git/PR 回读批次：2026-09-18T15:53:51+08:00。范围从 PR #111（4.0 主实现）开始，至本次回读的 #347；覆盖 GitHub 返回的全部 203 个 PR：184 MERGED、17 CLOSED、2 OPEN。编号缺口不是遗漏 PR，GitHub 的 issue/PR 共用编号。

本表负责“每个 PR 去哪里找”；[总任务](MIGRATION.md) 负责逐项勾选，[证据索引](MIGRATION-EVIDENCE.md) 负责说明验证范围。MERGED/CLOSED/OPEN 不是能力验收状态。仅有 merge 记录，不能断言不存在误合并、行为退化或冲突解决错误。

固定 source：main `56b6685543eb055baace4eeed00676bca3c82e32`（4.23.8），dev `3d4ce70fa50bd3aa05128bfbf5d659071ab07719`（5.1.11）。[全部 commit / merge 台账](MIGRATION-HISTORY.csv) 收录两条分支自 4.0 主实现之前 base `0d342c7f99ded8939e436edb489e114d9d40db76` 起的联集：758 unique commits、239 merge 节点、42 direct/unattributed commits。每行保留 parents、main/dev 可达性、归属方法。归属不代表逐提交行为验收。

旧审计建议不再有效：迁移范围是全部现有能力，不因可用 plugin/preset 实现就取消迁移。#308 遵守用户明确要求：实验不合入。#295/#320 为 MERGED，不能再写成关闭未合。#341/#342 由旧表 OPEN 更新为 MERGED；#345/#346 补入已合并；#337/#343/#344/#347 已从候选移出；T9a、升级保护、完整分享包与文档交付分别落到 C10/C11/C24。

| PR | 状态 / 目标 | 内容 | 能力组 |
|---|---|---|---|
| [#111](https://github.com/CtriXin/multi-model-switch/pull/111) | MERGED → dev | feat: MMS v4 本地 Web 对话与 Pi 会话控制 | [C03](MIGRATION.md#c03) [C08](MIGRATION.md#c08) [C12](MIGRATION.md#c12) [C13](MIGRATION.md#c13) [C14](MIGRATION.md#c14) [C15](MIGRATION.md#c15) |
| [#113](https://github.com/CtriXin/multi-model-switch/pull/113) | MERGED → dev | fix(web): persist standalone model defaults in v4.0.1 | [C01](MIGRATION.md#c01) [C02](MIGRATION.md#c02) |
| [#114](https://github.com/CtriXin/multi-model-switch/pull/114) | MERGED → dev | fix(vision): 统一识图能力真值；feat(web): 模型能力编辑、侧栏操作与外观设置 | [C02](MIGRATION.md#c02) [C12](MIGRATION.md#c12) [C15](MIGRATION.md#c15) |
| [#115](https://github.com/CtriXin/multi-model-switch/pull/115) | MERGED → dev | feat(web): artifact previews, selections and version comparison (v4.1.0) | [C05](MIGRATION.md#c05) |
| [#116](https://github.com/CtriXin/multi-model-switch/pull/116) | MERGED → dev | feat(web): project materials and per-message source records (4.2.0) | [C04](MIGRATION.md#c04) |
| [#118](https://github.com/CtriXin/multi-model-switch/pull/118) | MERGED → dev | fix(web): show the running version in the logo and settings (4.2.1) | [C11](MIGRATION.md#c11) |
| [#119](https://github.com/CtriXin/multi-model-switch/pull/119) | MERGED → dev | feat(web): v4.3.0 新手悬浮引导与功能帮助 | [C15](MIGRATION.md#c15) |
| [#120](https://github.com/CtriXin/multi-model-switch/pull/120) | MERGED → dev | 简化一键安装：移除 9 个可选包、零选择、pi 必装、装完打开 MMS Web | [C06](MIGRATION.md#c06) [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#122](https://github.com/CtriXin/multi-model-switch/pull/122) | CLOSED → issue-117-installer-zero-prompt | 增加 npx 安装入口：npx @ctrixin/mms | [C10](MIGRATION.md#c10) |
| [#124](https://github.com/CtriXin/multi-model-switch/pull/124) | MERGED → dev | feat(web): integrate PR 114 and 120 as MMS Pilot v4.4.0 | [C02](MIGRATION.md#c02) [C05](MIGRATION.md#c05) [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) [C12](MIGRATION.md#c12) [C15](MIGRATION.md#c15) [C24](MIGRATION.md#c24) |
| [#125](https://github.com/CtriXin/multi-model-switch/pull/125) | CLOSED → issue-117-installer-zero-prompt | MMS Web 版本提示与页面一键升级 | [C11](MIGRATION.md#c11) |
| [#127](https://github.com/CtriXin/multi-model-switch/pull/127) | MERGED → dev | 能力真值按官方文档核对，批量填入改为逐行复核 | [C01](MIGRATION.md#c01) [C02](MIGRATION.md#c02) |
| [#128](https://github.com/CtriXin/multi-model-switch/pull/128) | MERGED → dev | feat(pilot): inline files, project search and capability review v4.5.0 | [C02](MIGRATION.md#c02) [C05](MIGRATION.md#c05) [C14](MIGRATION.md#c14) |
| [#130](https://github.com/CtriXin/multi-model-switch/pull/130) | MERGED → dev | 停止安装 offduty/onduty 与 /nsr，并清理已装条目 | [C06](MIGRATION.md#c06) [C09](MIGRATION.md#c09) |
| [#131](https://github.com/CtriXin/multi-model-switch/pull/131) | MERGED → dev | feat(web): 先连接服务再开始新手教程，发布 v4.6.0 | [C01](MIGRATION.md#c01) [C15](MIGRATION.md#c15) |
| [#132](https://github.com/CtriXin/multi-model-switch/pull/132) | MERGED → dev | feat(pilot): 开箱即用的任务 skills 与文件夹引用 v4.7.0 | [C06](MIGRATION.md#c06) [C14](MIGRATION.md#c14) |
| [#133](https://github.com/CtriXin/multi-model-switch/pull/133) | MERGED → dev | fix(pilot): keep session status readable and label file entry (v4.7.1) | [C12](MIGRATION.md#c12) [C13](MIGRATION.md#c13) |
| [#134](https://github.com/CtriXin/multi-model-switch/pull/134) | MERGED → dev | fix(pilot): hide empty context receipts and simplify material details (v4.7.2) | [C04](MIGRATION.md#c04) [C13](MIGRATION.md#c13) |
| [#135](https://github.com/CtriXin/multi-model-switch/pull/135) | MERGED → dev | feat(pilot): quick model selection with optional channel controls (v4.8.0) | [C01](MIGRATION.md#c01) [C12](MIGRATION.md#c12) |
| [#136](https://github.com/CtriXin/multi-model-switch/pull/136) | MERGED → main | release: promote Pilot v4.8.0 to main | [C24](MIGRATION.md#c24) |
| [#137](https://github.com/CtriXin/multi-model-switch/pull/137) | MERGED → dev | feat(pilot): ship v4.9 safe updates and simpler installation | [C10](MIGRATION.md#c10) [C11](MIGRATION.md#c11) |
| [#138](https://github.com/CtriXin/multi-model-switch/pull/138) | MERGED → dev | feat(pilot): capability bulk selection and v4.8.1 | [C02](MIGRATION.md#c02) [C12](MIGRATION.md#c12) |
| [#139](https://github.com/CtriXin/multi-model-switch/pull/139) | MERGED → main | release: sync Pilot v4.8.1 to main | [C24](MIGRATION.md#c24) |
| [#140](https://github.com/CtriXin/multi-model-switch/pull/140) | MERGED → main | release: publish Pilot v4.9.0 safe updates on main | [C24](MIGRATION.md#c24) |
| [#142](https://github.com/CtriXin/multi-model-switch/pull/142) | MERGED → dev | 更新说明按 Markdown 渲染；工作区名不再压在悬停按钮下 | [C11](MIGRATION.md#c11) [C15](MIGRATION.md#c15) |
| [#143](https://github.com/CtriXin/multi-model-switch/pull/143) | MERGED → dev | feat(pilot): v4.10.0 连接悬浮引导、来源记录与任务模板 v2 | [C03](MIGRATION.md#c03) [C04](MIGRATION.md#c04) [C06](MIGRATION.md#c06) [C15](MIGRATION.md#c15) |
| [#144](https://github.com/CtriXin/multi-model-switch/pull/144) | MERGED → main | release(pilot): v4.10.0 连接悬浮引导与可分享任务 | [C24](MIGRATION.md#c24) |
| [#147](https://github.com/CtriXin/multi-model-switch/pull/147) | MERGED → dev | 两条安装命令输出对齐：按结果而不是按参数决定版本提示 | [C10](MIGRATION.md#c10) [C11](MIGRATION.md#c11) |
| [#149](https://github.com/CtriXin/multi-model-switch/pull/149) | MERGED → dev | Pilot 读取命令行启动的会话（只读） | [C07](MIGRATION.md#c07) [C08](MIGRATION.md#c08) |
| [#152](https://github.com/CtriXin/multi-model-switch/pull/152) | MERGED → dev | fix(claude): use well-formed deny rule "Bash(rm -rf /*)" | [C09](MIGRATION.md#c09) |
| [#153](https://github.com/CtriXin/multi-model-switch/pull/153) | MERGED → dev | 统一配置根：CLI 与 Pilot 共用 mms-next | [C01](MIGRATION.md#c01) [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#154](https://github.com/CtriXin/multi-model-switch/pull/154) | MERGED → dev | release(pilot): v4.10.1 | [C24](MIGRATION.md#c24) |
| [#155](https://github.com/CtriXin/multi-model-switch/pull/155) | MERGED → dev | Pilot: 文件预览同步、Weber 收口、Skills 合并、设置拆分、附件清理、通道增删 | [C01](MIGRATION.md#c01) [C05](MIGRATION.md#c05) [C06](MIGRATION.md#c06) [C12](MIGRATION.md#c12) [C14](MIGRATION.md#c14) [C15](MIGRATION.md#c15) |
| [#156](https://github.com/CtriXin/multi-model-switch/pull/156) | MERGED → dev | release: v4.11.0 shared config root | [C24](MIGRATION.md#c24) |
| [#157](https://github.com/CtriXin/multi-model-switch/pull/157) | MERGED → dev | feat(pilot): 会话消息显示时间戳与回复用时 | [C13](MIGRATION.md#c13) |
| [#158](https://github.com/CtriXin/multi-model-switch/pull/158) | MERGED → dev | chore: release v4.11.1 | [C24](MIGRATION.md#c24) |
| [#159](https://github.com/CtriXin/multi-model-switch/pull/159) | MERGED → dev | 接入终端会话：在 Pilot 里继续 mmf 开始的对话 | [C08](MIGRATION.md#c08) |
| [#163](https://github.com/CtriXin/multi-model-switch/pull/163) | MERGED → dev | 老机器自动收拢配置，安装不再被运行中的 Pilot 卡死 | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#164](https://github.com/CtriXin/multi-model-switch/pull/164) | MERGED → dev | fix(claude): seed new 2.1.x upsell/dismissal state keys into sessions | [C09](MIGRATION.md#c09) |
| [#167](https://github.com/CtriXin/multi-model-switch/pull/167) | CLOSED → dev | 手机端可用：局域网下写操作失败、触摸摸不到行内菜单 | [C07](MIGRATION.md#c07) [C12](MIGRATION.md#c12) |
| [#168](https://github.com/CtriXin/multi-model-switch/pull/168) | MERGED → dev | fix(launch): let model_policy override the plain-k3 safe-base window guard | [C02](MIGRATION.md#c02) [C09](MIGRATION.md#c09) |
| [#169](https://github.com/CtriXin/multi-model-switch/pull/169) | MERGED → dev | fix(web): --listen all 模式下 Origin 校验与 Host 规则一致 | [C07](MIGRATION.md#c07) |
| [#173](https://github.com/CtriXin/multi-model-switch/pull/173) | MERGED → dev | chore: release v4.12.0 | [C08](MIGRATION.md#c08) [C24](MIGRATION.md#c24) |
| [#174](https://github.com/CtriXin/multi-model-switch/pull/174) | MERGED → dev | 首页：输入框可拖高并随输入长高，拉高后「最近」列表移到右侧成两栏 | [C12](MIGRATION.md#c12) |
| [#175](https://github.com/CtriXin/multi-model-switch/pull/175) | MERGED → dev | fix(web): 模型页不再把未设置的 models_endpoint 当成 manual（拉取模型变灰） | [C01](MIGRATION.md#c01) [C09](MIGRATION.md#c09) |
| [#176](https://github.com/CtriXin/multi-model-switch/pull/176) | MERGED → dev | chore: release v4.12.1 | [C24](MIGRATION.md#c24) |
| [#179](https://github.com/CtriXin/multi-model-switch/pull/179) | MERGED → dev | feat(mms-web): 会话页 composer 滚动感知折叠 | [C12](MIGRATION.md#c12) |
| [#180](https://github.com/CtriXin/multi-model-switch/pull/180) | MERGED → dev | Pilot 设置页：Enter 发送可关、删掉纯说明区块、开关换成胶囊形态 | [C12](MIGRATION.md#c12) [C15](MIGRATION.md#c15) |
| [#181](https://github.com/CtriXin/multi-model-switch/pull/181) | MERGED → dev | 手机与另一台电脑访问：设置里一个开关，默认关闭 | [C07](MIGRATION.md#c07) |
| [#182](https://github.com/CtriXin/multi-model-switch/pull/182) | MERGED → dev | feat(pilot): 拖入的文件夹按名字和内容自动找回路径 | [C14](MIGRATION.md#c14) |
| [#183](https://github.com/CtriXin/multi-model-switch/pull/183) | MERGED → dev | 配置根只保留 ~/.config/mms-next：旧根退出、mmd/mmm 退休、安装脚本停掉任何占用默认端口的 Pilot | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#184](https://github.com/CtriXin/multi-model-switch/pull/184) | MERGED → dev | chore: release v4.13.0 | [C24](MIGRATION.md#c24) |
| [#185](https://github.com/CtriXin/multi-model-switch/pull/185) | MERGED → dev | feat(capability): v4.1-tier effort unblocked for deepseek/GLM/Qwen families | [C02](MIGRATION.md#c02) |
| [#186](https://github.com/CtriXin/multi-model-switch/pull/186) | MERGED → dev | fix(web): --listen all 下关闭开关不再清空 token 门禁 | [C07](MIGRATION.md#c07) |
| [#187](https://github.com/CtriXin/multi-model-switch/pull/187) | MERGED → dev | chore: release v4.13.1 | [C24](MIGRATION.md#c24) |
| [#189](https://github.com/CtriXin/multi-model-switch/pull/189) | MERGED → dev | mms web status / url / start / stop / restart：管理本机的 Pilot 服务 | [C08](MIGRATION.md#c08) [C10](MIGRATION.md#c10) |
| [#190](https://github.com/CtriXin/multi-model-switch/pull/190) | MERGED → dev | chore: release v4.14.0 | [C24](MIGRATION.md#c24) |
| [#192](https://github.com/CtriXin/multi-model-switch/pull/192) | MERGED → dev | mms web 不带子命令时打印帮助页 | [C10](MIGRATION.md#c10) |
| [#194](https://github.com/CtriXin/multi-model-switch/pull/194) | MERGED → dev | fix(capability): kimi-code k3 context 262144 -> 1048576 (match official calibration) | [C02](MIGRATION.md#c02) |
| [#195](https://github.com/CtriXin/multi-model-switch/pull/195) | MERGED → dev | 更新同时换掉 mms 和 Pilot；确认前说明端口与失效功能，完成后自动刷新 | [C11](MIGRATION.md#c11) |
| [#196](https://github.com/CtriXin/multi-model-switch/pull/196) | MERGED → dev | fix(test): 补上 #185 漏改的两条 pi launcher 断言（dev 当前是红的） | [C02](MIGRATION.md#c02) [C23](MIGRATION.md#c23) |
| [#197](https://github.com/CtriXin/multi-model-switch/pull/197) | MERGED → dev | chore: release v4.15.0 | [C24](MIGRATION.md#c24) |
| [#198](https://github.com/CtriXin/multi-model-switch/pull/198) | MERGED → dev | fix(update): 不要把新版装进上一次更新留下的暂存副本 | [C11](MIGRATION.md#c11) |
| [#199](https://github.com/CtriXin/multi-model-switch/pull/199) | MERGED → dev | fix: close capability and session safety gaps | [C02](MIGRATION.md#c02) [C03](MIGRATION.md#c03) [C08](MIGRATION.md#c08) [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#200](https://github.com/CtriXin/multi-model-switch/pull/200) | MERGED → dev | fix(web): 终端能跑 Pi 但 Pilot 全灰；顺带说清到底缺什么 | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#201](https://github.com/CtriXin/multi-model-switch/pull/201) | MERGED → dev | chore: release v4.15.1 | [C24](MIGRATION.md#c24) |
| [#202](https://github.com/CtriXin/multi-model-switch/pull/202) | MERGED → dev | fix(web): npx 装进 npm 默认缓存的 Pi 也要认 | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#203](https://github.com/CtriXin/multi-model-switch/pull/203) | CLOSED → main | install: 公开默认钉在已验证的 v4.4.0，不再跟最新 release | [C11](MIGRATION.md#c11) |
| [#204](https://github.com/CtriXin/multi-model-switch/pull/204) | MERGED → dev | fix: finish core runtime and model configuration flow | [C01](MIGRATION.md#c01) [C02](MIGRATION.md#c02) [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#205](https://github.com/CtriXin/multi-model-switch/pull/205) | MERGED → dev | fix(pi): 全局装了 pi 但 bin 不在 PATH 时，安装被卡死 | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#206](https://github.com/CtriXin/multi-model-switch/pull/206) | MERGED → dev | chore: release v4.15.2 | [C24](MIGRATION.md#c24) |
| [#208](https://github.com/CtriXin/multi-model-switch/pull/208) | MERGED → dev | fix(config-web): survive a second Ctrl-C during shutdown cleanup | [C09](MIGRATION.md#c09) |
| [#209](https://github.com/CtriXin/multi-model-switch/pull/209) | MERGED → dev | fix(capability): settle K3 on one context truth and repair the red tests | [C02](MIGRATION.md#c02) [C23](MIGRATION.md#c23) |
| [#210](https://github.com/CtriXin/multi-model-switch/pull/210) | MERGED → dev | ci: fail a PR for the tests it breaks | [C23](MIGRATION.md#c23) |
| [#211](https://github.com/CtriXin/multi-model-switch/pull/211) | MERGED → dev | test(pilot): lock model fetch to replace the route, not merge into it | [C01](MIGRATION.md#c01) [C23](MIGRATION.md#c23) |
| [#212](https://github.com/CtriXin/multi-model-switch/pull/212) | MERGED → dev | feat(config-web): step the configuration WebUI down to a maintenance entry | [C09](MIGRATION.md#c09) |
| [#213](https://github.com/CtriXin/multi-model-switch/pull/213) | MERGED → dev | fix(codex): tell Codex the context window of a 1M model it cannot know | [C02](MIGRATION.md#c02) [C09](MIGRATION.md#c09) |
| [#214](https://github.com/CtriXin/multi-model-switch/pull/214) | MERGED → dev | release(pilot): prepare v4.16.0 | [C24](MIGRATION.md#c24) |
| [#215](https://github.com/CtriXin/multi-model-switch/pull/215) | MERGED → dev | fix(config): finish retiring ~/.config/mms as a config location | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#216](https://github.com/CtriXin/multi-model-switch/pull/216) | MERGED → dev | feat: 识图借用扩展到 Claude Code 和 OpenCode，Pilot 加 What's New | [C02](MIGRATION.md#c02) [C06](MIGRATION.md#c06) [C09](MIGRATION.md#c09) [C15](MIGRATION.md#c15) |
| [#217](https://github.com/CtriXin/multi-model-switch/pull/217) | MERGED → dev | release(pilot): prepare v4.17.0 | [C24](MIGRATION.md#c24) |
| [#218](https://github.com/CtriXin/multi-model-switch/pull/218) | MERGED → dev | fix(pilot): show the release notes to installs that already existed | [C15](MIGRATION.md#c15) |
| [#219](https://github.com/CtriXin/multi-model-switch/pull/219) | MERGED → dev | release(pilot): prepare v4.17.1 | [C24](MIGRATION.md#c24) |
| [#220](https://github.com/CtriXin/multi-model-switch/pull/220) | MERGED → dev | release(pilot): prepare v4.18.0 | [C24](MIGRATION.md#c24) |
| [#221](https://github.com/CtriXin/multi-model-switch/pull/221) | MERGED → dev | feat(pilot): integrate T1 BTW and T2 message control | [C13](MIGRATION.md#c13) |
| [#225](https://github.com/CtriXin/multi-model-switch/pull/225) | MERGED → dev | release(pilot): prepare v4.19.0 | [C24](MIGRATION.md#c24) |
| [#226](https://github.com/CtriXin/multi-model-switch/pull/226) | MERGED → dev | fix(install): tell the user how to update while Pilot is running; drop the dead stop-and-reopen path (#223) | [C10](MIGRATION.md#c10) |
| [#227](https://github.com/CtriXin/multi-model-switch/pull/227) | MERGED → dev | fix: restore k3[1m] vision fallback, fix bridge lb_debug path, stale ChannelModels label, guardrails drift (#224) | [C01](MIGRATION.md#c01) [C02](MIGRATION.md#c02) [C09](MIGRATION.md#c09) |
| [#228](https://github.com/CtriXin/multi-model-switch/pull/228) | MERGED → dev | test: reconcile the tests broken by #199/#204/#205 with the mms-next contract (#222) | [C09](MIGRATION.md#c09) [C23](MIGRATION.md#c23) |
| [#229](https://github.com/CtriXin/multi-model-switch/pull/229) | MERGED → dev | release: v4.19.1 fixes | [C09](MIGRATION.md#c09) [C24](MIGRATION.md#c24) |
| [#231](https://github.com/CtriXin/multi-model-switch/pull/231) | MERGED → dev | feat: add Windows Native Preview support | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) [C22](MIGRATION.md#c22) |
| [#232](https://github.com/CtriXin/multi-model-switch/pull/232) | MERGED → dev | feat: guide safe upgrades across config roots | [C09](MIGRATION.md#c09) [C11](MIGRATION.md#c11) |
| [#233](https://github.com/CtriXin/multi-model-switch/pull/233) | MERGED → dev | feat(capability): one context-window truth for every harness; [1m] becomes input normalization (#230) | [C02](MIGRATION.md#c02) |
| [#234](https://github.com/CtriXin/multi-model-switch/pull/234) | MERGED → dev | fix: keep public installer on mms entrypoint | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) |
| [#235](https://github.com/CtriXin/multi-model-switch/pull/235) | MERGED → dev | chore: release v4.19.4 | [C24](MIGRATION.md#c24) |
| [#236](https://github.com/CtriXin/multi-model-switch/pull/236) | MERGED → dev | fix: repair Pilot first-run model settings flow | [C01](MIGRATION.md#c01) [C12](MIGRATION.md#c12) |
| [#237](https://github.com/CtriXin/multi-model-switch/pull/237) | MERGED → dev | chore: release v4.20.0 Windows Native Preview | [C22](MIGRATION.md#c22) [C24](MIGRATION.md#c24) |
| [#239](https://github.com/CtriXin/multi-model-switch/pull/239) | MERGED → codex/stride-370e87ec37e741df | feat(web): Bot page visual system on Pilot theme tokens | [C12](MIGRATION.md#c12) [C16](MIGRATION.md#c16) |
| [#240](https://github.com/CtriXin/multi-model-switch/pull/240) | MERGED → codex/stride-370e87ec37e741df | feat(bots): bounded retry for infrastructure errors and result delivery | [C20](MIGRATION.md#c20) |
| [#241](https://github.com/CtriXin/multi-model-switch/pull/241) | MERGED → codex/stride-370e87ec37e741df | feat(bots): coordinator plan produced by the Bot's model and executed by the runtime | [C17](MIGRATION.md#c17) |
| [#242](https://github.com/CtriXin/multi-model-switch/pull/242) | MERGED → dev | feat(pilot): Bot 工作台 v2.x（身份、任务、协作、记忆、Coordinator、通知、视觉系统） | [C16](MIGRATION.md#c16) [C17](MIGRATION.md#c17) [C19](MIGRATION.md#c19) [C20](MIGRATION.md#c20) |
| [#243](https://github.com/CtriXin/multi-model-switch/pull/243) | MERGED → codex/stride-370e87ec37e741df | feat(pilot): 设置页运行环境标签、帮助内版本更新、设置边距 | [C12](MIGRATION.md#c12) [C15](MIGRATION.md#c15) |
| [#244](https://github.com/CtriXin/multi-model-switch/pull/244) | MERGED → dev | fix(windows): resolve Pi launcher and package tzdata | [C09](MIGRATION.md#c09) [C22](MIGRATION.md#c22) |
| [#245](https://github.com/CtriXin/multi-model-switch/pull/245) | CLOSED → dev | release: v4.21.0 Windows Preview fixes | [C22](MIGRATION.md#c22) [C24](MIGRATION.md#c24) |
| [#246](https://github.com/CtriXin/multi-model-switch/pull/246) | MERGED → hotfix/windows-encoding-4.21.1 | fix(windows): make CIM command discovery encoding-proof | [C10](MIGRATION.md#c10) [C22](MIGRATION.md#c22) |
| [#247](https://github.com/CtriXin/multi-model-switch/pull/247) | CLOSED → hotfix/windows-encoding-4.21.1 | fix(windows): tolerate slow Pi startup handshake | [C22](MIGRATION.md#c22) |
| [#248](https://github.com/CtriXin/multi-model-switch/pull/248) | MERGED → hotfix/windows-encoding-4.21.1 | fix(windows): preserve Pi RPC pipes through launcher | [C09](MIGRATION.md#c09) [C22](MIGRATION.md#c22) |
| [#249](https://github.com/CtriXin/multi-model-switch/pull/249) | CLOSED → dev | fix(windows): use PowerShell when Pi bash is unavailable | [C09](MIGRATION.md#c09) [C22](MIGRATION.md#c22) |
| [#250](https://github.com/CtriXin/multi-model-switch/pull/250) | MERGED → codex/release-v4.21.0-windows-only | fix(windows): support workspace folder picker | [C14](MIGRATION.md#c14) [C22](MIGRATION.md#c22) |
| [#251](https://github.com/CtriXin/multi-model-switch/pull/251) | MERGED → codex/release-v4.21.0-windows-only | fix(windows): keep folder picker responsive | [C14](MIGRATION.md#c14) [C22](MIGRATION.md#c22) |
| [#252](https://github.com/CtriXin/multi-model-switch/pull/252) | MERGED → codex/release-v4.21.0-windows-only | release: package v4.21.7 workspace picker fix | [C24](MIGRATION.md#c24) |
| [#253](https://github.com/CtriXin/multi-model-switch/pull/253) | CLOSED → dev | merge: 4.21.x Windows 维护线合回 dev，开启 5.0 线 | [C21](MIGRATION.md#c21) |
| [#254](https://github.com/CtriXin/multi-model-switch/pull/254) | MERGED → dev-pre | bot: 任务分支合入 dev-pre（会话隔离、几何头像、direct-first、T1c 工单） | [C16](MIGRATION.md#c16) [C17](MIGRATION.md#c17) [C21](MIGRATION.md#c21) |
| [#255](https://github.com/CtriXin/multi-model-switch/pull/255) | CLOSED → dev | dev: 撤销 Bot 合并，合入 4.21.x Windows 维护线（5.0 转 dev-pre） | [C21](MIGRATION.md#c21) |
| [#256](https://github.com/CtriXin/multi-model-switch/pull/256) | MERGED → dev | merge: sync dev with v4.21.14 and fix preview web launch | [C10](MIGRATION.md#c10) [C22](MIGRATION.md#c22) |
| [#257](https://github.com/CtriXin/multi-model-switch/pull/257) | MERGED → main | fix(installer): launch Pilot for preview channels | [C10](MIGRATION.md#c10) |
| [#258](https://github.com/CtriXin/multi-model-switch/pull/258) | MERGED → dev | feat(pi): bundle and inject the MMS /btw extension | [C06](MIGRATION.md#c06) [C13](MIGRATION.md#c13) |
| [#259](https://github.com/CtriXin/multi-model-switch/pull/259) | MERGED → dev | feat(web): route /btw side questions through native Pi extension | [C13](MIGRATION.md#c13) |
| [#260](https://github.com/CtriXin/multi-model-switch/pull/260) | MERGED → main | fix(installer): skip obsolete preview setup hint when launching Web | [C10](MIGRATION.md#c10) |
| [#261](https://github.com/CtriXin/multi-model-switch/pull/261) | CLOSED → dev-pre | [准备] release: 5.0.0 预览（Bot 工作台 + 4.21.x Windows 修复） | [C24](MIGRATION.md#c24) |
| [#262](https://github.com/CtriXin/multi-model-switch/pull/262) | MERGED → dev | dev: 撤销 Bot 合并，dev 保持 4.21.x 稳定线（重做 #255） | [C16](MIGRATION.md#c16) [C21](MIGRATION.md#c21) |
| [#263](https://github.com/CtriXin/multi-model-switch/pull/263) | MERGED → dev-pre | [准备] release: 5.0.0 预览（Bot 工作台） | [C24](MIGRATION.md#c24) |
| [#264](https://github.com/CtriXin/multi-model-switch/pull/264) | MERGED → dev | release: 4.22.0 · /btw 旁问 | [C24](MIGRATION.md#c24) |
| [#265](https://github.com/CtriXin/multi-model-switch/pull/265) | MERGED → dev-pre | feat(web): Bot 工作台收尾（T3d-ui / T2c / T1f）并整合 dev 4.22.0 与 /btw | [C16](MIGRATION.md#c16) [C17](MIGRATION.md#c17) |
| [#266](https://github.com/CtriXin/multi-model-switch/pull/266) | MERGED → dev | fix(release): align v4.22 runtime version metadata | [C11](MIGRATION.md#c11) [C23](MIGRATION.md#c23) |
| [#267](https://github.com/CtriXin/multi-model-switch/pull/267) | MERGED → dev-pre | release: 5.0.0 Preview · Bot 工作台 | [C21](MIGRATION.md#c21) [C24](MIGRATION.md#c24) |
| [#269](https://github.com/CtriXin/multi-model-switch/pull/269) | MERGED → dev-pre | release: 5.0.1 · 修复设置滚动条遮挡与 Bot 交互/弹窗样式 | [C12](MIGRATION.md#c12) [C16](MIGRATION.md#c16) [C24](MIGRATION.md#c24) |
| [#270](https://github.com/CtriXin/multi-model-switch/pull/270) | MERGED → dev-pre | fix(bot): prevent premature compact and preserve Pilot port | [C10](MIGRATION.md#c10) [C16](MIGRATION.md#c16) |
| [#271](https://github.com/CtriXin/multi-model-switch/pull/271) | MERGED → dev | fix(installer): tell the user Pilot is opening on a preview install | [C10](MIGRATION.md#c10) [C21](MIGRATION.md#c21) |
| [#272](https://github.com/CtriXin/multi-model-switch/pull/272) | MERGED → main | release: main becomes the 4.22.x stable line | [C21](MIGRATION.md#c21) [C24](MIGRATION.md#c24) |
| [#273](https://github.com/CtriXin/multi-model-switch/pull/273) | MERGED → dev-pre | merge: carry the 4.22.x installer fix into the 5.x line | [C10](MIGRATION.md#c10) [C21](MIGRATION.md#c21) |
| [#274](https://github.com/CtriXin/multi-model-switch/pull/274) | MERGED → dev | release: dev becomes the 5.x line | [C16](MIGRATION.md#c16) [C21](MIGRATION.md#c21) [C24](MIGRATION.md#c24) |
| [#275](https://github.com/CtriXin/multi-model-switch/pull/275) | MERGED → dev-pre | docs(bot-work): refresh T5 packets against 5.0.1 and add T6 channel-switch and backport packets | [C17](MIGRATION.md#c17) [C18](MIGRATION.md#c18) [C21](MIGRATION.md#c21) |
| [#276](https://github.com/CtriXin/multi-model-switch/pull/276) | MERGED → dev | docs(bot-work): T7a connection banner and T7b btw card fold memory packets | [C12](MIGRATION.md#c12) [C13](MIGRATION.md#c13) |
| [#277](https://github.com/CtriXin/multi-model-switch/pull/277) | MERGED → main | feat(web): backport runtime settings tab to 4.22 stable line (T6b) | [C15](MIGRATION.md#c15) |
| [#278](https://github.com/CtriXin/multi-model-switch/pull/278) | MERGED → dev | T5a · 定时改成独立的 schedule 实体 + 真正的周期调度（后端，不要合） | [C16](MIGRATION.md#c16) [C18](MIGRATION.md#c18) [C20](MIGRATION.md#c20) |
| [#279](https://github.com/CtriXin/multi-model-switch/pull/279) | MERGED → main | feat(web): 4.x↔5.x 双向切换门禁 + 忽略未知 owner 的会话 (T6a) | [C08](MIGRATION.md#c08) [C21](MIGRATION.md#c21) |
| [#280](https://github.com/CtriXin/multi-model-switch/pull/280) | MERGED → dev | docs(bot-work): T7c surface MMF blocked reasons and T7d keep the current window signed in | [C01](MIGRATION.md#c01) [C07](MIGRATION.md#c07) |
| [#281](https://github.com/CtriXin/multi-model-switch/pull/281) | MERGED → main | feat(web): BTW 旁问卡片收起后持久化记忆与已处置语义 (T7b 返工完成) | [C13](MIGRATION.md#c13) |
| [#282](https://github.com/CtriXin/multi-model-switch/pull/282) | MERGED → main | feat(web): 连接横幅 3 次防抖与错误状态分流 (T7a) | [C12](MIGRATION.md#c12) |
| [#283](https://github.com/CtriXin/multi-model-switch/pull/283) | MERGED → main | fix(web): 打开手机访问不再把当前窗口踢掉（开关/换 token 给当前会话种 cookie） | [C07](MIGRATION.md#c07) |
| [#284](https://github.com/CtriXin/multi-model-switch/pull/284) | MERGED → dev | docs(bot-work): T7e blank turn after a mid-run steer | [C13](MIGRATION.md#c13) |
| [#285](https://github.com/CtriXin/multi-model-switch/pull/285) | MERGED → main | fix(mms-web): 把 MMF 挡下来的真实原因说给用户听（T7c） | [C01](MIGRATION.md#c01) |
| [#286](https://github.com/CtriXin/multi-model-switch/pull/286) | MERGED → dev | fix(web): 修复中途引导及服务重启后回合空白、状态误判与作废消息不可重发问题 (T7e) | [C08](MIGRATION.md#c08) [C13](MIGRATION.md#c13) |
| [#288](https://github.com/CtriXin/multi-model-switch/pull/288) | MERGED → dev | feat(pilot): 收口聊天通道显示、设置三栏和 Bot 设定入口 | [C12](MIGRATION.md#c12) [C16](MIGRATION.md#c16) |
| [#289](https://github.com/CtriXin/multi-model-switch/pull/289) | MERGED → main | feat(web): 项目文件夹选择弹窗打开时输入框默认自动聚焦 | [C12](MIGRATION.md#c12) [C14](MIGRATION.md#c14) |
| [#290](https://github.com/CtriXin/multi-model-switch/pull/290) | CLOSED → codex/stride-2718d9d92afa45ef | feat(pilot): 工作身份 — 一次切换模型、通道、effort 和人设 | [C03](MIGRATION.md#c03) [C12](MIGRATION.md#c12) [C25](MIGRATION.md#c25) |
| [#291](https://github.com/CtriXin/multi-model-switch/pull/291) | MERGED → dev | docs(bot-work): T7f · 删掉一条已排队的引导，它还是会送出去 | [C13](MIGRATION.md#c13) |
| [#292](https://github.com/CtriXin/multi-model-switch/pull/292) | MERGED → dev | feat(tui): add Grok Build as a Pi-like launcher | [C09](MIGRATION.md#c09) |
| [#293](https://github.com/CtriXin/multi-model-switch/pull/293) | MERGED → dev | docs(bot-work): T5b 追加 · T5a 验收之后的五条 | [C18](MIGRATION.md#c18) |
| [#294](https://github.com/CtriXin/multi-model-switch/pull/294) | MERGED → main | fix(web): 删掉已排队引导时如实反映撤回结果 | [C13](MIGRATION.md#c13) |
| [#295](https://github.com/CtriXin/multi-model-switch/pull/295) | MERGED → dev | feat(bots): ship reviewed Fleet opinions with exact models and read-only workers | [C16](MIGRATION.md#c16) [C17](MIGRATION.md#c17) [C19](MIGRATION.md#c19) |
| [#296](https://github.com/CtriXin/multi-model-switch/pull/296) | MERGED → main | release: v4.22.2 | [C24](MIGRATION.md#c24) |
| [#297](https://github.com/CtriXin/multi-model-switch/pull/297) | MERGED → main | docs: README 改成实际的两条发布线 | [C21](MIGRATION.md#c21) [C24](MIGRATION.md#c24) |
| [#298](https://github.com/CtriXin/multi-model-switch/pull/298) | MERGED → dev | release: v5.0.2 | [C24](MIGRATION.md#c24) |
| [#299](https://github.com/CtriXin/multi-model-switch/pull/299) | MERGED → main | feat(pilot): 更新对话框里选通道，4.x 可以直接切到 5.x 预览 | [C11](MIGRATION.md#c11) [C21](MIGRATION.md#c21) |
| [#300](https://github.com/CtriXin/multi-model-switch/pull/300) | MERGED → main | docs: 更新通道开关已落地，订正 README 里「已知缺口」的说法 | [C21](MIGRATION.md#c21) [C24](MIGRATION.md#c24) |
| [#301](https://github.com/CtriXin/multi-model-switch/pull/301) | MERGED → main | release: v4.22.3 | [C24](MIGRATION.md#c24) |
| [#302](https://github.com/CtriXin/multi-model-switch/pull/302) | MERGED → bot/T5a-schedule-backend | T5b · 定时选择器与管理列表（前端） | [C18](MIGRATION.md#c18) |
| [#303](https://github.com/CtriXin/multi-model-switch/pull/303) | MERGED → dev | fix(web): 侧栏区分未读已完成和已读待命 | [C12](MIGRATION.md#c12) |
| [#304](https://github.com/CtriXin/multi-model-switch/pull/304) | MERGED → dev | feat(web): 将思考强度从模型弹窗中拆分为独立常驻快捷选择器 | [C12](MIGRATION.md#c12) |
| [#306](https://github.com/CtriXin/multi-model-switch/pull/306) | MERGED → bot/T5a-schedule-backend | T5c · 在对话里换 Bot 的模型，下一轮生效 | [C12](MIGRATION.md#c12) [C16](MIGRATION.md#c16) [C18](MIGRATION.md#c18) |
| [#307](https://github.com/CtriXin/multi-model-switch/pull/307) | MERGED → main | fix(web): T8a in-app folder tree instead of the native picker | [C14](MIGRATION.md#c14) |
| [#308](https://github.com/CtriXin/multi-model-switch/pull/308) | CLOSED → dev | feat(web): add Grok as an optional Pilot harness | [C08](MIGRATION.md#c08) [C09](MIGRATION.md#c09) [C25](MIGRATION.md#c25) |
| [#309](https://github.com/CtriXin/multi-model-switch/pull/309) | MERGED → main | docs: T8c phase-1 — pytest 基线分类报告(65 红 → 10 根因,只诊断不改码) | [C23](MIGRATION.md#c23) |
| [#310](https://github.com/CtriXin/multi-model-switch/pull/310) | MERGED → dev | bot: T5d —— 计划步骤指定的模型真正生效 | [C16](MIGRATION.md#c16) [C17](MIGRATION.md#c17) [C18](MIGRATION.md#c18) |
| [#311](https://github.com/CtriXin/multi-model-switch/pull/311) | MERGED → dev | feat(web): 助手回复可专注阅读 | [C12](MIGRATION.md#c12) [C13](MIGRATION.md#c13) |
| [#312](https://github.com/CtriXin/multi-model-switch/pull/312) | CLOSED → main | T8c phase 2: pytest 基线修到 0 failed(2490 passed)+ openrouter diff 修复 + pi committee 协议声明(待批) | [C01](MIGRATION.md#c01) [C02](MIGRATION.md#c02) [C23](MIGRATION.md#c23) |
| [#313](https://github.com/CtriXin/multi-model-switch/pull/313) | MERGED → main | release: v4.23.0 stable 目录浏览与可靠性修复 | [C01](MIGRATION.md#c01) [C11](MIGRATION.md#c11) [C14](MIGRATION.md#c14) [C22](MIGRATION.md#c22) [C23](MIGRATION.md#c23) [C24](MIGRATION.md#c24) |
| [#314](https://github.com/CtriXin/multi-model-switch/pull/314) | MERGED → dev | fix(bot): 优化聊天头部模型展示为横向胶囊并支持点击直达设定 | [C12](MIGRATION.md#c12) [C16](MIGRATION.md#c16) |
| [#315](https://github.com/CtriXin/multi-model-switch/pull/315) | MERGED → dev | release: v5.1.0 Preview Bot 整合与可靠性修复 | [C08](MIGRATION.md#c08) [C11](MIGRATION.md#c11) [C16](MIGRATION.md#c16) [C17](MIGRATION.md#c17) [C18](MIGRATION.md#c18) [C21](MIGRATION.md#c21) [C23](MIGRATION.md#c23) [C24](MIGRATION.md#c24) |
| [#316](https://github.com/CtriXin/multi-model-switch/pull/316) | CLOSED → dev | fix(pilot): 5.x 也能切回 4.x 稳定版 | [C11](MIGRATION.md#c11) [C21](MIGRATION.md#c21) |
| [#317](https://github.com/CtriXin/multi-model-switch/pull/317) | MERGED → dev | fix(web): nest 出门也要用 under the remote-access switch | [C07](MIGRATION.md#c07) |
| [#318](https://github.com/CtriXin/multi-model-switch/pull/318) | CLOSED → main | fix(web): T8f retry Windows atomic replace instead of dropping the write | [C11](MIGRATION.md#c11) [C22](MIGRATION.md#c22) |
| [#319](https://github.com/CtriXin/multi-model-switch/pull/319) | CLOSED → main | fix: an in-app update records what it installed in version.json (T8d) | [C11](MIGRATION.md#c11) |
| [#320](https://github.com/CtriXin/multi-model-switch/pull/320) | MERGED → dev | feat(web): double-click a sidebar session to rename it | [C12](MIGRATION.md#c12) |
| [#321](https://github.com/CtriXin/multi-model-switch/pull/321) | CLOSED → main | fix: binding a remote-access listener no longer does reverse DNS (T8e) | [C07](MIGRATION.md#c07) [C10](MIGRATION.md#c10) |
| [#322](https://github.com/CtriXin/multi-model-switch/pull/322) | MERGED → dev | feat(web): open version and updates from the sidebar v label | [C11](MIGRATION.md#c11) [C15](MIGRATION.md#c15) |
| [#323](https://github.com/CtriXin/multi-model-switch/pull/323) | MERGED → dev | fix(web): focus the rename field when the dialog opens | [C12](MIGRATION.md#c12) |
| [#324](https://github.com/CtriXin/multi-model-switch/pull/324) | MERGED → main | fix(web): 只读慢路由移出 mutation_lock（T8g） | [C01](MIGRATION.md#c01) [C12](MIGRATION.md#c12) |
| [#325](https://github.com/CtriXin/multi-model-switch/pull/325) | MERGED → main | fix(web): 补完 T8e 反向 DNS 清扫,删掉一处假的权限检查 (v4.23.1) | [C09](MIGRATION.md#c09) [C14](MIGRATION.md#c14) [C22](MIGRATION.md#c22) |
| [#326](https://github.com/CtriXin/multi-model-switch/pull/326) | MERGED → main | ci: 门禁在说谎 —— 删掉的红测试被算成修好了,前端从来没进过 CI | [C23](MIGRATION.md#c23) |
| [#327](https://github.com/CtriXin/multi-model-switch/pull/327) | MERGED → main | fix(update): 5.x 选 4.x 稳定版时不再被告知「已是最新」(T8h) | [C11](MIGRATION.md#c11) [C21](MIGRATION.md#c21) |
| [#328](https://github.com/CtriXin/multi-model-switch/pull/328) | MERGED → dev | fix(web): make update confirmation a full step | [C11](MIGRATION.md#c11) [C12](MIGRATION.md#c12) |
| [#329](https://github.com/CtriXin/multi-model-switch/pull/329) | MERGED → dev | fix(web): keep mobile popovers and the composer on screen | [C07](MIGRATION.md#c07) [C12](MIGRATION.md#c12) |
| [#330](https://github.com/CtriXin/multi-model-switch/pull/330) | OPEN → dev | feat: 中度使用后的低打扰飞书体验反馈 | [C25](MIGRATION.md#c25) |
| [#331](https://github.com/CtriXin/multi-model-switch/pull/331) | MERGED → dev | fix(web): 交互修复与 v5.1.6 Preview | [C12](MIGRATION.md#c12) [C16](MIGRATION.md#c16) [C18](MIGRATION.md#c18) [C19](MIGRATION.md#c19) |
| [#332](https://github.com/CtriXin/multi-model-switch/pull/332) | MERGED → main | fix(web): Stable 焦点与选择反馈修复 v4.23.3 | [C12](MIGRATION.md#c12) [C14](MIGRATION.md#c14) |
| [#333](https://github.com/CtriXin/multi-model-switch/pull/333) | MERGED → main | test(web): 文件夹树测试改为真执行,截断提示按层,390px 路径单行 (T8i A) | [C14](MIGRATION.md#c14) [C23](MIGRATION.md#c23) |
| [#334](https://github.com/CtriXin/multi-model-switch/pull/334) | MERGED → dev | test(web): 改名/等待控制/确认步骤/Popover 接线改真执行测试 (T8i B+C) | [C12](MIGRATION.md#c12) [C13](MIGRATION.md#c13) [C23](MIGRATION.md#c23) |
| [#335](https://github.com/CtriXin/multi-model-switch/pull/335) | MERGED → main | fix: 收尾共享门禁与文件夹真路径回归，发布 v4.23.4 | [C09](MIGRATION.md#c09) [C14](MIGRATION.md#c14) [C22](MIGRATION.md#c22) [C23](MIGRATION.md#c23) [C24](MIGRATION.md#c24) |
| [#336](https://github.com/CtriXin/multi-model-switch/pull/336) | MERGED → dev | fix: 完成 T8i 实际接线回归与双线门禁，发布 v5.1.7 | [C12](MIGRATION.md#c12) [C14](MIGRATION.md#c14) [C16](MIGRATION.md#c16) [C22](MIGRATION.md#c22) [C23](MIGRATION.md#c23) [C24](MIGRATION.md#c24) |
| [#337](https://github.com/CtriXin/multi-model-switch/pull/337) | MERGED → main | docs: wire AI onboarding and finish remaining archive cleanup | [C10](MIGRATION.md#c10) [C24](MIGRATION.md#c24) |
| [#338](https://github.com/CtriXin/multi-model-switch/pull/338) | MERGED → main | fix: 修复开启远程访问时的升级检查（v4.23.5） | [C07](MIGRATION.md#c07) [C11](MIGRATION.md#c11) |
| [#339](https://github.com/CtriXin/multi-model-switch/pull/339) | MERGED → dev | fix: 同步远程访问开启时的升级认证修复（v5.1.8） | [C07](MIGRATION.md#c07) [C11](MIGRATION.md#c11) |
| [#340](https://github.com/CtriXin/multi-model-switch/pull/340) | OPEN → dev | fix(settings): 移除设置滚动容器顶部 padding 并为首项增加 margin-top | [C12](MIGRATION.md#c12) [C25](MIGRATION.md#c25) |
| [#341](https://github.com/CtriXin/multi-model-switch/pull/341) | MERGED → dev | feat(pilot): recover failed sessions with reviewed drafts (v5.1.9) | [C08](MIGRATION.md#c08) |
| [#342](https://github.com/CtriXin/multi-model-switch/pull/342) | MERGED → main | feat(pilot): backport failed-session recovery to Stable (v4.23.6) | [C08](MIGRATION.md#c08) |
| [#343](https://github.com/CtriXin/multi-model-switch/pull/343) | MERGED → main | docs: comprehensive README with TL;DR + collapsed details | [C24](MIGRATION.md#c24) |
| [#344](https://github.com/CtriXin/multi-model-switch/pull/344) | MERGED → main | T9a: move 79 root Python modules into lib/ | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) [C11](MIGRATION.md#c11) [C22](MIGRATION.md#c22) [C24](MIGRATION.md#c24) |
| [#345](https://github.com/CtriXin/multi-model-switch/pull/345) | MERGED → main | fix(web): 保存模型设置后即时刷新新任务默认值 · v4.23.7 | [C01](MIGRATION.md#c01) [C02](MIGRATION.md#c02) [C12](MIGRATION.md#c12) |
| [#346](https://github.com/CtriXin/multi-model-switch/pull/346) | MERGED → dev | fix(pilot): 保存默认 Effort 后即时刷新新任务（5.1.10） | [C01](MIGRATION.md#c01) [C02](MIGRATION.md#c02) [C12](MIGRATION.md#c12) |
| [#347](https://github.com/CtriXin/multi-model-switch/pull/347) | MERGED → dev | fix(preview): synchronize T9a runtime layout and safe upgrades (5.1.11) | [C09](MIGRATION.md#c09) [C10](MIGRATION.md#c10) [C11](MIGRATION.md#c11) [C22](MIGRATION.md#c22) [C24](MIGRATION.md#c24) |

另一个 agent 应先独立列出能力，再用 PR / commit 台账检查漏项；尤其检查同一 PR 内不同影响面、直接提交中的 Fleet、被后续修正的交互和仍处候选的工程整理。不能用“全都分了组”代替这次语义对账。

CSV 中个别源仓提交标题触发 fork 的文档词汇约束，已明确标注为转述；原始标题可由该行 commit 链接读取，源仓历史未修改。
