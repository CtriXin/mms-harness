# 同步上游必跑清单

这份清单对应 `HANDOFF.md` 第四节。每次 `sync/upstream-<日期>` 分支合完上游，都要先过这份清单，才能合回 `mms`。

```bash
# 离线层，不花 token，约 40 秒
env -u MMS_CONFIG_ROOT -u REAL_HOME -u ORIGINAL_HOME -u MMS_REAL_HOME -u XDG_CONFIG_HOME \
  python3 mms/sync-gate/gate.py --node "$(which node)"          # Node >= 24.2
# 同步上游时必须加 --build --live：重新构建，装进临时目录，发约 6 次小的真实请求
  python3 mms/sync-gate/gate.py --node "$(which node)" --build --live
```

gate 退出码：0 表示没有失败项。**PENDING 不算通过**，只表示这项能力还没做出来。

另外离线层有 O7：`test_stop.mjs`（5 项），覆盖停止插件本身。

## 自动检查

| ID | 能力项 | 怎么验 | 通过标准 | 不证明什么 |
|---|---|---|---|---|
| O1 | C01/C02 | `mms/adapter/test_config.py` | 14 项全过：凭据缺失、bundle 审批和 hash、能力与协议、隔离环境、默认 effort 写入 settings、`mms-ui` 行按文件路径加载 | 不发真实请求 |
| O2 | C03/C02 | `test_plugin.mjs` + `test_observe.mjs`，插件取**当前源码**，依赖取固定版本 runtime | 3 项全过：Recipe 能力要求 fail closed，evidence 不记 prompt 和 key | 不走真实 UI |
| O3 | C14.01/.02、C12、C15 | vitest 跑自有覆盖包 `packages/client/ui-mms`，外加它所覆盖的三个上游包（原样未改）的测试 | 全过（2026-09-19 为 16 个文件、296 项，其中 `ui-mms` 4 个文件、120 项） | 只测组件，不测和 host 的连接 |
| O6 | C07.01–.03 | `mms/adapter/test_remote.mjs`：真实 socket + 替身 DSH | 13 项全过：无口令 / 非法 Host / 跨源 / 旧口令被拒且不到达 DSH；WebSocket 需要 cookie；DSH cookie 不外泄；只有 manifest 和 icon 不需要口令；扫码页只对本机 + 有效 nonce；`/remote` 输出不含口令 | 不测真实手机，也不测 LAN 绑定（绑定见 `REMOTE.md` 端到端记录） |
| O7 | C13.03 | `mms/adapter/test_stop.mjs` | 5 项全过：用户停止先 kill 本 agent 仍在跑的 job 再照常取消；其他原因的取消不 kill；kill 失败不挡停止；不重复包装 | 不证明上游仍调用 `agent.cancel({kind:'user'})`，那条由 L5 兜底 |
| O8 | C13.15 | `mms/adapter/test_plan.mjs` | 7 项全过：计划模式只放行 6 个只读工具，其他全部拒绝且拒绝原因写明 `/plan off` 和「不是 OS sandbox」；非计划模式和其他 agent 不受影响；plan 状态读不到时放行并记日志 | 不证明 host 真的加载了插件，那条由 W3 和 L6 兜底 |
| O9 | C13.06/.07 | `mms/adapter/test_btw.mjs` | 6 项全过：projection 只收人和模型的文字、限 12 条、截断、打码；请求用会话最近的主路由；卡片写明模型和用量；失败和未发请求都如实说 | 不发真实请求 |
| O10 | C11.01/.06/.07 | `mms/adapter/test_upgrade.py` | 6 项全过：只认从当前代码构建、带 MMS 标题、非 dirty 的产物（`mms/` 改动不需要重建）；探测绕过环境代理、拒绝跳出 127.0.0.1 的重定向；切换后路径和端口指向最终目录 | 不跑真实安装，那条由 L8 覆盖 |
| O4 | — | 当前 HEAD 对 `upstream/master` merge-base 的 diff，逐文件对照 `UPSTREAM-PATCHES.md` | 改到的上游文件全部已登记 | 不判断改动内容对不对 |
| O5 | — | `--build`：`DSH_CLIENT_TITLE="MMS Harness" pnpm run build` | 退出码 0 | — |
| L0 | C10 | `mms/install.py` 把当前 build 装进临时目录（runtime 从 `--runtime-from` 复制并核对 lock） | 安装成功 | 不覆盖、也不测已安装的 3092 实例 |
| L1 | C14.01 | headless 在临时 workspace 里执行 `pwd` | 输出等于 workspace 的真实路径，最后一次请求 HTTP 200 | UI 里选目录那一步归 O3 和手工项 |
| L2 | C12.02 | settings 里选 `gpt-5.6-sol` + `high`，发一次请求 | evidence 里每次请求都是 `reasoning_effort=high`，并且走 `/responses` | 只覆盖 openai_responses；Anthropic budget 映射还没加 |
| L3 | C08.01 | `--json` 拿 session id，再用 `--session-id` 续聊，追问上一轮的暗号 | 回答出暗号 | 不测 Host 重启和浏览器刷新 |
| L4 | C01.02 | 删掉所选通道的凭据 ref，再发请求 | 退出码非 0、`MISSING_CREDENTIAL`、**0 次请求** | 不测真实 HOME 或 Keychain 回退（隔离环境里本来就没有） |
| W3 | — | 读 W1 实例的启动日志 | 没有任何 `mms-*` 插件停在 pending | 2026-09-19 抓到过：插件 inject 的服务在 host 上拿不到，就会一直 pending、没有任何报错 |
| L6 | C13.15 | W1 同一实例：`commands/execute /plan` → 让模型用 bash 看目录 → 解会话日志 → `/plan off` → 再看一次 | 计划模式里每次 bash 都被 MMS 规则拒绝，关闭后 bash 成功 | 让模型写文件证明不了什么：模型遵守计划指引根本不调用工具（2026-09-19 mutation）。需要 `zstd` 命令行解日志 |
| L7 | C13.06/.07 | 主任务前台 `sleep 20 && touch 标记` 期间发 `/btw` 问之前让它记住的暗号 | 旁问成功、答出暗号、写明回答模型；发问时主任务还在跑；标记最终写出 | 不测取消旁问与主任务互不影响 |
| L8 | C11.03–.06 | 临时目录装一份并标成上一个 commit、启动、写会话和工作区标记 → `upgrade --no-build --yes` → 写新会话数据 → `rollback --yes` → 塞一个缺 runtime 的坏版本做切换 | 升级后是新 commit、标记还在、同一端口在跑、有 before 备份；回滚后是旧 commit、升级后写的数据也带回来了；坏版本切换失败后自动恢复原安装并在同一端口运行 | mutation（2026-09-19）：去掉切换时的数据拷贝后升级和回滚都变红 |
| L5 | C13.03 / C08.07 | W1 同一实例上，按浏览器的方式调 `session/create` → `session/prompt`（让模型后台跑 `sleep 25 && echo > 标记`）→ 看到 job 进程后调 `session/cancel` → 等 35 s | 标记文件没写、job 进程不在、停止后 0 次成功模型请求（没有被唤醒开新回合） | 依赖模型按提示用后台 job；模型不起 job 时判 FAIL 而不是通过。2026-09-18 端到端 mutation：去掉 `mms-stop` 后 L5 变红（标记写出、停止后 2 次请求） |
| W1 | C10/C15 | 在 61000–62000 随机端口启动 Web，带 cookie 打开 token URL | 页面标题是 `MMS Harness`，client 产物数 > 0 | 只证明 fork 前端能被固定版本的 host 服务出来，不证明 UI 行为 |
| W2 | C12、C14.01、C15 | 同一实例上取 `/plugins/@deepseek-ai/dsh-client-ui-mms/client.js` | 200，且覆盖的三个 slot 名都在包里 | 不证明覆盖真的生效：入口渲染时崩溃会悄悄退回上游，所以要做手工项 1–2 |

L 和 W 两层只读 `~/.config/mms-next`，临时目录里的凭据副本在 gate 结束时删除。进程只停 gate 自己启动的 PID。

## 手工项（每次同步做一次，ego-browser，约 3 分钟，不花 token）

在 W1 启动的实例或本机 3092 上，逐项做完后记进同步分支的 PR 描述：

1. 新会话 →「添加工作区」→ 标题是「找到你的项目」，输入框已聚焦。输入一个已有项目名，能搜到。输入一个不存在的路径，报错，**不会**沿用旧目录（C14.01/.02）。
2. 模型按钮旁边有**独立的 effort 按钮**；点它直接列出档位，当前档位被勾选（C12）。模型面板打开即聚焦搜索框，搜 `gpt` 能看到通道名。看到的如果是上游样式（模型和 effort 合在一个按钮上），说明 `ui-mms` 的入口崩溃后退回了上游，去看浏览器控制台里的 `slot entry crashed`。
   侧栏品牌名是「MMS Harness」；如果变成「DSH 本地构建」，说明覆盖没有加载。
3. 390×844 视口下，上面两个弹窗都在屏幕内，`document.scrollWidth == 390`。

## 同步流程

```bash
git fetch upstream
git switch -c sync/upstream-$(date +%Y%m%d) origin/mms
git merge upstream/master        # 冲突先查 UPSTREAM-PATCHES.md「冲突时怎么办」；删留能力按 HANDOFF 第五节出建议
pnpm install --frozen-lockfile
python3 mms/sync-gate/gate.py --node "$(which node)" --build --live
# 手工项 1–3 → PR → 合回 mms
```

### 同步时要知道的一件事：host 版本是固定的

fork 只提供 **client 产物**。host 用的是 npm 上固定版本的 `@deepseek-ai/dsh`，版本号在 `mms/adapter/config.py` 的 `DSH_VERSION`，依赖锁在 `mms/adapter/package-lock.json`，当前是 `0.1.6-alpha.2`。

合入上游源码之后，新 client 可能依赖旧 host 没有的接口。W1 和 L1–L4 就是用来抓这种不匹配的。上游发了新的 npm 版本时，要在同步分支上一起改：`DSH_VERSION`、`package-lock.json`、runtime，然后重跑整份 gate。

## 已修：MMS 默认 effort 没有传到 dsh（2026-09-18）

- **原因**：`configure()` 把 `reasoningEffort` 写进了 `agent-default-model` 的 config。但上游只认 settings 层里的这个值（`packages/core/agent-default-model/README.md:46,71`），config 里的会被直接忽略。
- **修复**：新增 `seed_default_selection()`：`settings.yaml` 里还没有 `agent-default-model` 时，写入一次 MMS 的默认模型和 effort。用户在 UI 里保存过的选择，以及无法安全追加的 JSON 格式文档，都保持不动。config 里不再写 effort。
- **验证**：
  - `test_config.py` 新增 1 项：全新写入、已有选择不覆盖、已有其他 settings 时只追加。mutation：去掉写入调用后这项变红。
  - 用真实的 mms-next 新建实例，写入的是 `deepseek-v4-flash` / `high`，headless 请求成功（预算 16384）。
  - 把写入值改成 `low` 后，实际请求预算变成 2048，说明 settings 里的这个值确实决定了请求。
