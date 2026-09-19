# 交接：把 MMS 的能力迁进这个 fork，并且一直能拉上游

写给下一个接手的 AI 会话。读完这份再去读清单。清单告诉你**迁什么**，这份告诉你**怎么迁、什么时候必须停下来问人**。

最后核对：2026-09-19。fork `origin/mms`，upstream `deepseek-ai/deepseek-harness`。来源基线 MMS `main 4.23.8` / `dev 5.1.11`。

> **先读 [STATUS.md](STATUS.md)**：现在能用什么、怎么用、还缺什么、已知限制、等机主决定的事，都在那一页。本文件讲的是怎么继续干活。

---

## 0. 三十秒

**目标**：把 MMS Pilot 里**已经验证过的**能力，以及机主明确点名的那几样，迁进这个 DeepSeek Harness fork；同时保持随时能同步上游、拉上游新功能。

**三条铁律，违反任何一条都要先停下来：**

1. **加包，不改上游文件。** 见第三节。这是 fork 能不能活过三个月的唯一变量。
2. **上游已经有同类能力、或者和我们的改动冲突时，不要自己决定删谁留谁。** 出一份建议交给机主，他决定。见第五节。
3. **"迁移"不等于"照搬代码"。** 先确认上游原生能力是否达标，不达标才补差。见第六节。

**定位一句话**（不要偏离，也不要扩张）：

> MMS Harness = DeepSeek Harness 的内核 + MMS 的启动控制面（多 CLI、账号隔离、通道与能力真值）+ dsh 没有的那几样（Recipe 场景分享、手机远程、持久 Bot 与记忆、独立日程）。**不追 dsh 的功能对齐。**

---

## 1. 背景：为什么是 fork

**MMS** 是机主自己的本地 AI coding 运行时管理器，仓库在 `CtriXin/multi-model-switch`。它管的是"启动之前该想清楚的事"：用哪个模型、哪个通道、哪个账号、哪个隔离 HOME，去启动 `claude` / `codex` / `opencode` / `pi`。4.x 是稳定线，5.x 加了 Bot 工作台。要理解它本身，读那个仓库的 `docs/AI-ONBOARDING.md`。

**dsh**（DeepSeek Harness）是 DeepSeek 开源的 agent harness，MIT，`everything is a plugin`，架在 Cordis 上。它把 session、工具、沙箱、技能、成果、子代理、工作流这些都做完了，而且在快速迭代。

**为什么 fork 而不是写插件**：机主要的是**产品决策权在自己手里**，同时**不自己维护 harness 内核**。插件满足第二条，不满足第一条。这个决定已经做了，不要再重开讨论。

**但是**：「允许改上游源码」和「默认改上游源码」是两回事。fork 给了你权力，第三节给的是纪律。

---

## 2. 现在是什么状态

能力现状以 [STATUS.md](STATUS.md) 为准。截至 2026-09-19：
- 已验 33 项、部分完成 30 项。
- 25 处上游就地修改，已有 20 处挪进自有包 `packages/client/ui-mms`，只剩 7 处必须保留的修改。
- 同步检查 24 项全部通过：`python3 mms/sync-gate/gate.py --build --live`。

`mms/` 下已有的清单文档，按该读的顺序：

| 文件 | 是什么 | 什么时候读 |
|---|---|---|
| `MIGRATION.md` | 总任务，25 组 165+ 项，每项带原版证据等级、fork 状态、验收条件 | 决定"接下来做哪一项"时 |
| `MIGRATION-CONTRACT-COVERAGE.md` | 从 `AGENT_GUARDRAILS.md` / `FEATURES.md` / preferences 逐节枚举的行为契约映射 | 想确认"某条契约有没有被登记"时 |
| `MIGRATION-EVIDENCE.md` | 证据索引 E01–E20，每条写明范围和限制 | 想知道某一项"凭什么算验过"时 |
| `MIGRATION-PR-COVERAGE.md` · `MIGRATION-HISTORY.csv` | 203 个 PR / 720 个 commit 的来源台账 | 追溯某个能力来自哪个 PR 时 |
| `MIGRATION-REVIEW-fable.md` | 一次独立核对的结论与处理 | 想知道哪些判断被采纳、哪些被更正 |
| `STATUS.md` | 现状总表：已有、部分完成、没有的能力，怎么用，已知限制 | **每次开工先读**，每次交付后更新 |
| `SYNC-GATE.md` · `sync-gate/gate.py` | 必跑检查：离线 O、实测 L、Web W，每项写明不证明什么 | 改完任何东西、同步上游之前 |
| `UPSTREAM-PATCHES.md` | 上游文件就地修改登记（O4 会检查） | 改到上游文件时 |
| `UPSTREAM-DECISIONS.md` | 上游已有、冲突、机主决定的记录，第 4 批是剩余能力的上游对照 | 动手迁一项之前 |
| `REMOTE.md` | 手机远程的用法、设计和验证记录 | 碰远程访问时 |

**不要新建第二份清单。** 有结论就更新已有文件的对应项，或者新开一份**只写你自己那轮**的记录，不要复制别人的表。

---

## 3. 铁律一：加包，不改上游文件

### 现在的实际情况（可自己复核）

```bash
UB=$(git merge-base HEAD upstream/master)
git diff --name-status $UB..HEAD | awk '{print $1}' | sort | uniq -c
```

截至交接：**52 个文件改动 = 27 新增 + 25 修改，而 25 个修改全部是 upstream 既有文件，`mms/` 之外的自有新增 package 数是 0。**

> 2026-09-19 更新：这 25 处中，有 20 处已挪进自有包 `packages/client/ui-mms`（slot 优先级覆盖），对应的上游文件已还原为原版。现在上游文件的改动只剩 7 个，登记在 `UPSTREAM-PATCHES.md`。下面这张表保留作为交接时的记录。

三个能力就改到了这些地方，按危险程度排：

| 改到的东西 | 为什么危险 |
|---|---|
| `packages/client/locale/src/locales/{en,zh}.ts` | **共享语言文件**。上游每加一个字符串都可能冲突 |
| `packages/client/ui-model-selection/` 的 `ModelSelect.tsx` / CSS module / locales / 测试 | UI 是 dsh 迭代最快的层 |
| `packages/client/ui-directory-picker-browse/` 的 `DirectoryBrowser.tsx` / `flow.ts` / `index.ts` / CSS / 两个测试 | 同上 |
| `packages/client/ui-sidebar/tests/__snapshots__/*.snap` | **快照文件**。上游一改 UI 就整块冲突，而且冲突没法靠读代码判断对错 |
| `AGENTS.md` / 三份 `README` | 上游动文档就冲突，而且这类冲突最没价值 |

看一眼上游在 `packages/client/` 的节奏：最近 8 个动这个目录的提交里，有 `refactor(client): move sidebar chat to subagent`、`fix(client): keep sidebar integration optional`、`fix(client): preserve round sidebar action`、`test(client): cover sidebar chat edge paths` —— **我们就地改的，正是它 churn 最快的那块。**

目前 `behind=0`，这些提交都已经在 fork 里，所以一次冲突都还没发生过。**第一次 `git merge upstream/master` 就会开始痛，而那时改动面积不会还是 302 行。**

### 正确做法

dsh 的架构本来就是为这个设计的：`packages/client/ui-*` 是一个个独立包，`agent-presets` 从 configured roots 加 harness home 发现 preset，官方还专门给了 `dsh-plugin` 这个 GitHub topic 给站外插件仓库用。

- 新能力 → 新建 `packages/client/ui-mms-<名字>` 或 `packages/mms-<名字>`，**注册进去**，不要改上游同名包。
- 文案 → 用自己的 locale namespace，**绝不碰共享 `locales/{en,zh}.ts`**。
- 自己的文档 → 放 `mms/`。上游的 `AGENTS.md` / `README` 最多留一行指路。
- 快照测试 → 自有包有自己的快照。不要改上游包的快照来让自己的改动通过；那等于把上游的测试变成我们的负债。

### 什么时候可以改上游文件

只有一种情况：**上游没有留出扩展点，而这个能力必须在那个位置生效。**

这时候：

1. 改动压到最小，只动必要的行；
2. **单独一个 commit**，标题前缀 `patch(upstream):`，正文写明为什么没有扩展点、以及上游怎么改了这块我们要跟着怎么办；
3. 在 `mms/UPSTREAM-PATCHES.md`（没有就建）登记一行：文件、原因、对应能力项 ID、检查方式。

这样每次同步上游时，你手上有一份"已知会冲突的清单"，而不是靠 `git merge` 现场发现。

### 现在就该做的补救

已经就地改掉的那 25 个文件，趁只有 302 行，**尽量往自有 package 挪**。优先级：共享 `locale` > `ui-model-selection` / `ui-directory-picker-browse` > sidebar 快照 > 文档。挪不动的按上面的例外流程登记。

`MIGRATION.md` 的 `C24.02`（上游同步流程）现在还是未完成，而且被放在"重要不紧急"。**它应该是最紧急的一条**，因为它决定其余 100 多项的维护成本。

---

## 4. 上游同步流程

**节奏：每周至少一次，不要攒。** 攒到上游领先几百个 commit 再合，等于放弃 fork。

```bash
git fetch upstream
git switch -c sync/upstream-$(date +%Y%m%d) origin/mms
git merge upstream/master          # 冲突按第五节处理，不要自己删能力
pnpm install --frozen-lockfile
DSH_CLIENT_TITLE="MMS Harness" pnpm run build
# 跑"必跑验收子集"（下面）
```

> 2026-09-18 更新：清单已经建好，见 [`SYNC-GATE.md`](SYNC-GATE.md)，可执行脚本是 `mms/sync-gate/gate.py`。已迁的每项能力都要在那里加一行。下面这张表保留作为最初的设计。

**必跑验收子集**：每次同步之后必须重跑的那批，覆盖已经迁进来的每一个能力项。它的形状是：

| 能力项 ID | 怎么验 | 通过标准 |
|---|---|---|
| C14.01 项目搜索与实际 cwd | 真实启动，搜一个已有项目，确认落到的 cwd | 和选中项一致，不是上一次的目录 |
| C12.02 常驻 effort | 选一档，发一次真实请求 | 实际请求里的 effort 和选的一致 |
| C01.02 凭据精确绑定 | 删掉所选凭据再发请求 | 请求数不增加，不落到全局 OAuth 或另一账号 |
| …每迁一项，这里加一行 | | |

同步分支通过这份子集之后才合回 `mms`，再进入自有发行。**不要在 `mms` 分支上直接 merge 上游。**

---

## 5. 铁律二：上游已覆盖或冲突时，先出建议，不自己决定

**机主明确要求：遇到上游已经有同类能力、或者上游改动覆盖了我们的能力，你检查之后给建议，由他决定怎么合并或删除。**

分三类，处理方式不同：

**A 类 · 上游原生能力已经达标或更好。**
不要迁我们那份。写一条建议，说明上游哪个包提供、行为差异在哪、我们的验收条件它满不满足。机主同意后，把 `MIGRATION.md` 对应项标成"由上游原生满足"并引用证据，**不要直接删掉那一项**。

**B 类 · 上游有同类能力但行为不同。**
最常见也最危险，因为容易被当成 A 类放过去。必须把差异写清楚：不是"都能选模型"，而是"上游选完不校验能力，我们的 Recipe 要拿模板的能力要求核对实际通道，不满足要报错拦截"。然后给建议：改造上游包 / 加我们自己的包 / 放弃我们的行为。

**C 类 · 真冲突（同一处代码两边都改）。**
先判断上游那次改动想解决什么。**不要为了让 merge 过去而丢掉我们的行为，也不要为了保住我们的行为而回退上游的修复。** 出建议。

### 建议的格式

不管哪一类，产出同一张表，放进 `mms/UPSTREAM-DECISIONS.md`（没有就建），并在交付里贴出来：

| 能力项 | 上游对应物 | 行为差异（具体到可验收的那句） | 我的建议 | 风险 |
|---|---|---|---|---|
| C03.02 Recipe 能力复核 | `packages/preset`（agent preset 目录拷贝） | 上游 preset 是拷目录，不校验接收方通道是否满足模板的图片/推理要求；我们的会在启动时拦截并中文报错 | 保留我们的，做成独立包挂在 preset 流程后 | 上游 preset 结构变化时要跟 |

**表填完就停下来，等机主回复。** 不要在同一轮里既给建议又执行。

---

## 6. 干活顺序：三桶，不是一个队列

`MIGRATION.md` 的目标句子写的是"全部能力迁入"，但**清单里有相当一部分是 dsh 已经有的**。照着"全量"干，会变成在 dsh 里重新实现 dsh。

把 165+ 项分成三桶：

| 桶 | 内容 | 做什么 |
|---|---|---|
| **A · dsh 已有** | C05 成果预览、C06 Skills、C08 会话持久、C13 聊天过程与队列、C14 文件引用的大部分 | **不迁代码。** 写验收用例对着上游原生跑，达标就按 A 类流程登记，不达标只补差 |
| **B · dsh 没有、机主真需要** | 见下面的硬顺序 | 真正的迁移工作，也是这个 fork 存在的理由 |
| **C · 为"MMS 是 launcher+Pilot"而存在、在 fork 里不再需要** | 逐项判断 | 明确标"不迁"并写理由，不要留在清单里当永远还不完的债 |

**先把桶 A 跑完。** 它会大幅缩小真实待迁范围，后面所有决定都更容易。

### 桶 B 的硬顺序（机主点名的在最前面）

1. **手机 / 另一台电脑远程访问**（C07）：默认关闭的开关、token 作为唯一门禁、地址与二维码、开启后当前窗口不掉线。当前 fork 只监听 `127.0.0.1:3092`。
2. **会话不随 CLI 关闭和电脑重启丢失、可续接**（C08.01、C08.07、C08.04–06）：关浏览器、停服务、重启机器之后接着原上下文；重启时进行中的任务显示 interrupted 且不重放副作用。
3. **Recipe 场景分享**（C03）：让同事用自己的 Key 和文件夹复现同一个场景，并且**带能力复核**——模板要求图片或推理时，接收方通道不满足要明确拦截。这是 dsh 的 preset 没有的那一层。
4. **多 CLI launcher 与隔离运行**（C09.01–03、C09.05）：从 fork 使用 MMS 管理的多 CLI 启动，每会话 private HOME/config/env。
5. **五条安全契约**（C09.08、C09.09、C09.10、C02.09、C02.10）：Codex hook trust 不重复弹确认、preferences.toml allowlist 与人工写入确认、real HOME / Keychain 禁止自动恢复与回写、Pi vision relay 的池隔离与空池可见、识图能力单一真值。

**第 5 条不要往后排。** 这五条迁漏了不会立刻报错，会在某次失败路径上变成"悄悄用了另一个账号"或"重复弹确认"——都是机主当初花很久才定位出来的问题。

6. 持久 Bot 与长期记忆（C16）、独立周期日程（C18）、mailbox（C17.06）、Fleet 只读 worker（C19）。

**做完 1–5 就已经是一个能用的产品。** 6 按实际用到再补，不要因为清单上有就做。

---

## 7. 验收标准

**每一项都要做 mutation testing。** 把刚做的修复反向改回去，对应的测试必须变红。自己跑，逐条记录红/绿。"测试通过"不是证据，"把实现破坏掉测试就红"才是。

**读源码字符串的测试什么都不证明。** `readFileSync` + `assert.match(/.../)` 只能发现整段删除，发现不了改成不干活。要真正执行组件和 handler。

**一个写对的纯函数测试，配上一个没人测的调用点，保护力是零。** 必须连调用点一起测。

**证据等级要分清**，这是 `MIGRATION.md` 已经建立的规矩，继续守：

- 原版 **R** = 读过具体运行记录；**P** = 只有 PR 正文声称验证过；**T** = 只有 source/test 没有执行证据。
- **P 级的项不能直接迁。** 全表 P 级有 87 项，超过一半。把没验证过的行为搬到一个明说会破坏兼容的地基上，是两个风险相乘。桶 B 里的 P 级项，先补真实执行证据再迁；桶 A / 桶 C 里的直接作废，不用补。

**手机、Windows、接收方 Recipe、外部 provider 各自按目标环境验证。** compile 和 CI 绿不能替代。没验的就写"没验"，不要含糊。

---

## 8. 安全边界

- **绝不**碰端口 8767 / 60824 / 8765 / 8766，那是机主在跑的实例。本 fork 的默认监听是 `127.0.0.1:3092`。起验证实例用 61000–62000 的随机端口。
- **只 kill 自己启动的 PID，按精确 PID。** 绝不 `pkill`，绝不按端口 grep 完批量 kill。出过事故。
- **绝不**写机主真实的 `~/.config/mms*`、`~/.local/share/mms-web`、`~/.mms`。跑测试前 `env -u MMS_CONFIG_ROOT -u REAL_HOME -u ORIGINAL_HOME -u MMS_REAL_HOME -u XDG_CONFIG_HOME`。出过"测试 fixture 写穿真实配置根、把 capability bundle 冲成空壳"的事故。
- **用户配置和凭据不进仓库。** `mms/README.md` 已经声明了这一条，保持。
- 在自己的 worktree 干活。**绝不** stage / stash / reset / clean 别人的改动。
- **force-push 前必须先告诉机主。** 往别人的分支 force-push 默认不做。
- **不要改别人写的清单表格。** 有不同判断，新开一份自己那轮的记录。
- **不要关别人的 PR。** `multi-model-switch` 的 `#308` 明确保留为不合入。
- License：upstream MIT 保留，`vendor/` 下从 MMS 带来的代码保留 Apache-2.0。新增依赖前先说。

commit 身份（每个 commit 单独设，不改全局 config）：

```bash
TZ=Asia/Singapore git -c user.name="<AgentName>" -c user.email="<model>@<family>.com" commit ...
```

trailers：`Agent-Model` / `Agent-Family` / `Agent-Session` / `Agent-Step`。时间戳一律 `Asia/Singapore`。

---

## 9. 已知的文档陷阱

MMS 那边的文档有几处已经和代码对不上。**照抄会把过期的要求迁过来。**

| 文档 | 陷阱 | 以什么为准 |
|---|---|---|
| `docs/AGENT_GUARDRAILS.md:170` | 写 Codex gateway 在 `~/.config/mms/codex-gateway/.codex` | **代码走 `resolve_mms_config_dir()`，也就是 `~/.config/mms-next`。** `origin/main` 的 `test_codex_hook_trust_contract.py` 已经是 `mms-next`；`lib/mms_launchers.py` 只把旧根当识别用的兼容路径 |
| `docs/MMS_USER_PREFERENCES.md` | 仍写旧 `~/.config/mms` 根 | 同上。**偏好语义要迁，旧根路径不要迁** |
| `docs/mms-web/FEATURES.md` 开头 | "尚未公开发布"、仅 loopback、无安装更新包、不能跨服务换模型 | 这些已被后续 PR 覆盖，按 C01/C07/C08/C10/C11 的当前合同 |
| `docs/RELEASE_CHANNELS.md` | 版本轨道表还是 `3.4.z / 3.5.z / 3.6.z`；"4.21.x 与 5.0 dev-pre"那节的分支方案已作废 | 通道定义和安装参数仍有效，版本轨道以 `mms_version.py` 为准 |

`MIGRATION-CONTRACT-COVERAGE.md` 已经记了其中几条，但**第一条（Codex gateway 路径）应该回 `multi-model-switch` 提一个 docs 修复**，否则每个新接手的人都会踩一次。

---

## 10. 接手后的前三件事

2026-09-18 定的三件事已经做完：必跑清单已建立；25 处上游修改已挪走 20 处；A 类项已按流程实测登记。现在接手：

1. **读 [STATUS.md](STATUS.md)，跑一遍 gate**：`python3 mms/sync-gate/gate.py --node "$(which node)" --build --live`，确认 24 项仍然全过。之后再动手。
2. **按 STATUS 第 4 节的顺序继续**：界面交互补齐 → 模型级可用性 → Fleet → 其他 CLI 隔离 → 日程 → Bot。每一项都先查 UPSTREAM-DECISIONS 第 4 批的上游对照。
3. **每做完一项**：
   - 加上离线测试和实测检查，并用 mutation 确认检查能变红；
   - 更新 MIGRATION 条目和 STATUS；
   - 提交、push，用 `"MMS Harness.command" upgrade` 升级 3092。

**这一轮踩过的坑**，下次别再踩：
- 模型常常不肯调用工具，所以 live 检查必须做 mutation。L6 第一版就是模型不调工具造成的假通过。
- 插件 inject 的服务在 host 上拿不到时，插件会一直 pending，没有任何报错。W3 专门查这个。
- 只有 fork 自己的前端包，patch 里必须写文件路径，不能只写包名。
- 会话日志是多帧 zstd，用 `zstd -dc` 读；Node 的 `zlib` 只能读出第一帧。
- 测试不能绕过用户真正会走的路径。L8 一开始直接调 `upgrade.py`，漏掉了启动器认不出 `upgrade` 的 bug。

## 11. 交付时要写清什么

- 这一轮动了哪些文件，**其中几个是上游文件**，为什么没有扩展点可用。
- 每条 mutation 的红/绿。
- 验收实测的绝对数，以及**哪些环境没验**（手机、Windows、接收方视角要单独说）。
- 遇到的上游覆盖或冲突：填第五节那张表，**停下来等机主回复**，不要自己决定。
- 还没做的、以及为什么不做。

**不要把"清单项数"当进度百分比。** `MIGRATION.md` 自己就写了这一条，守住它。
