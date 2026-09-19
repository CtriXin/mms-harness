---
description: "MMS Harness 的界面覆盖层：产品名、可搜索的模型入口与直接选档的 effort、以项目为先的目录窗口，叠在上游 DSH 之上而不修改上游。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-mms

[English](README.md) | 中文

## 概述

MMS Harness 改了上游的三处界面。这个包没有直接改上游的包，而是为每个 slot 位置注册自己的组件，优先级设为 `-10`。优先级数值最小的组件会被渲染，上游原来的组件仍然加载在下面。上游的包与原版逐字节一致，所以每周同步上游不会产生合并冲突。如果这个包出错或被移除，每个位置都会各自退回上游的组件。

这个包只属于 fork，永不发布（`"private": true`）。包名用 `@deepseek-ai/dsh-client-` 前缀，只是为了让 workspace 工具链能识别它。

## 改了什么

| 位置 | 上游 | MMS Harness |
|---|---|---|
| `sidebar.brand.name` | "DSH 本地构建" + 构建标记 | "MMS Harness" + 同样的构建标记 |
| `conversation.input.model` | 模型和 effort 合在一个按钮上，改 effort 要点两次 | 模型按钮旁边多一个独立的 effort 按钮，点一下就展开可选的等级；模型面板带搜索框，可以按名称、ID 或通道搜索，打开即聚焦 |
| `conversation.hero.workspace.directoryFlow`、`sidebar.workspaces.directoryFlow` | "选择工作区目录" 文件夹浏览器 | "找到你的项目"：按项目名或路径搜索 Host 上已有的项目，也可以输入路径后按回车；浏览时不会采用任何目录，点"打开"才采用 |

模型入口读写的是 `ui-model-selection` 持有的每会话目录 `ctx.modelDirectories`，所以 `/model` 和输入区的模型入口始终显示同一个状态。目录窗口调用 `ctx.uiWorkspace`，列出目录和新建目录用的是上游同一套调用。

## 怎么加载

这个包不在 dsh 的依赖闭包里，所以 patch 行直接写它的文件路径：

```yaml
- insert:
    - id: mms-ui
      name: <runtime>/node_modules/@deepseek-ai/dsh-client-ui-mms/lib/index.js
```

Host 从离这个文件最近的 `package.json` 读取 client 清单，和解析任何按路径命名的行一样。`mms/install.py` 把构建好的包放到这个位置，`mms/adapter/run.py` 只在文件存在时才加这一行。如果这里只写包名，启动时会报 `ERR_MODULE_NOT_FOUND`。

## 与上游保持同步

`ModelSelect.tsx` 和 `DirectoryBrowser.tsx` 是上游组件的副本，加上了 MMS 的改动；对应的测试是上游测试加上 MMS 的用例。同步上游时，如果上游改了这两个组件的原版，就对照副本，把适用的改动搬过来。`mms/sync-gate/gate.py` 里：
- O3 在跑这个包的测试的同时，也跑未改动的上游测试。
- W2 检查 Host 是否真的提供了这个覆盖层。
- `mms/SYNC-GATE.md` 的手工项检查它是否真的在每个位置生效。

模型入口所在的 scope 必须 inject `ModelDirectoryResolver` 自己 inject 的每一个服务（`remote`、`remote.session`），因为 resolver 的方法是在 cordis 的调用方追踪下运行的。有一项测试专门锁住这一点；缺了这两个服务，模型入口会在渲染时崩溃，并悄悄退回上游的界面。

## Model Experience

这里没有任何内容对模型可见。在模型入口选的 effort 通过上游的 `session.selectModel` 进入请求；`mms/sync-gate` 的 L2 在实际发出的请求里核对 effort。
