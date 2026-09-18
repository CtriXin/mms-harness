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

## 自动检查

| ID | 能力项 | 怎么验 | 通过标准 | 不证明什么 |
|---|---|---|---|---|
| O1 | C01/C02 | `mms/adapter/test_config.py` | 12 项全过：凭据缺失、bundle 审批和 hash、能力与协议、隔离环境 | 不发真实请求 |
| O2 | C03/C02 | `test_plugin.mjs` + `test_observe.mjs`，插件取**当前源码**，依赖取固定版本 runtime | 3 项全过：Recipe 能力要求 fail closed，evidence 不记 prompt 和 key | 不走真实 UI |
| O3 | C14.01/.02、C12 | vitest 跑 fork 改过的三个 client 包 | 全过（2026-09-18 为 12 个文件、182 项） | 只测组件，不测和 host 的连接 |
| O6 | C07.01–.03 | `mms/adapter/test_remote.mjs`：真实 socket + 替身 DSH | 13 项全过：无口令 / 非法 Host / 跨源 / 旧口令被拒且不到达 DSH；WebSocket 需要 cookie；DSH cookie 不外泄；只有 manifest 和 icon 不需要口令；扫码页只对本机 + 有效 nonce；`/remote` 输出不含口令 | 不测真实手机，也不测 LAN 绑定（绑定见 `REMOTE.md` 端到端记录） |
| O4 | — | 当前 HEAD 对 `upstream/master` merge-base 的 diff，逐文件对照 `UPSTREAM-PATCHES.md` | 改到的上游文件全部已登记 | 不判断改动内容对不对 |
| O5 | — | `--build`：`DSH_CLIENT_TITLE="MMS Harness" pnpm run build` | 退出码 0 | — |
| L0 | C10 | `mms/install.py` 把当前 build 装进临时目录（runtime 从 `--runtime-from` 复制并核对 lock） | 安装成功 | 不覆盖、也不测已安装的 3092 实例 |
| L1 | C14.01 | headless 在临时 workspace 里执行 `pwd` | 输出等于 workspace 的真实路径，最后一次请求 HTTP 200 | UI 里选目录那一步归 O3 和手工项 |
| L2 | C12.02 | settings 里选 `gpt-5.6-sol` + `high`，发一次请求 | evidence 里每次请求都是 `reasoning_effort=high`，并且走 `/responses` | 只覆盖 openai_responses；Anthropic budget 映射还没加 |
| L3 | C08.01 | `--json` 拿 session id，再用 `--session-id` 续聊，追问上一轮的暗号 | 回答出暗号 | 不测 Host 重启和浏览器刷新 |
| L4 | C01.02 | 删掉所选通道的凭据 ref，再发请求 | 退出码非 0、`MISSING_CREDENTIAL`、**0 次请求** | 不测真实 HOME 或 Keychain 回退（隔离环境里本来就没有） |
| L5 | C13.03 | 起后台 job → 点停止 → 断言 job 被 kill，并且不会自动开新回合 | — | **PENDING**：停止语义自有包还没做 |
| W1 | C10/C15 | 在 61000–62000 随机端口启动 Web，带 cookie 打开 token URL | 页面标题是 `MMS Harness`，client 产物数 > 0 | 只证明 fork 前端能被固定版本的 host 服务出来，不证明 UI 行为 |

L 和 W 两层只读 `~/.config/mms-next`，临时目录里的凭据副本在 gate 结束时删除。进程只停 gate 自己启动的 PID。

## 手工项（每次同步做一次，ego-browser，约 3 分钟，不花 token）

在 W1 启动的实例或本机 3092 上，逐项做完后记进同步分支的 PR 描述：

1. 新会话 →「添加工作区」→ 输入一个已有项目名，能搜到。输入一个不存在的路径，报错，**不会**沿用旧目录（C14.01/.02）。
2. 模型选择器 → 搜 `gpt`，能看到通道名；选中后 effort 菜单只列出这个模型真正支持的档位（C12）。
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

## 本轮发现，待修

- **MMS 默认 effort 从来没有传到 dsh。** `mms/adapter/config.py:198-201` 把 `reasoningEffort` 写进了 `agent-default-model` 的 config。但上游 `packages/core/agent-default-model/README.md:46,71` 明确说它只属于 settings 层，config 里的值会被忽略。实测 config 写 `high`，实际请求是 `medium`；改为写 settings 后才是 `high`。Web 之所以看起来正常，是因为 UI 每次都在会话里显式选 effort。修法：`configure()` 在 `settings.yaml` 里还没有选择时，写入一次初始选择；用户在 UI 里保存过的选择不覆盖。修完后在 L2 里加一个「只靠 MMS 偏好」的用例。
