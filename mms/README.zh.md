# MMS Harness

[English](README.md) | 中文

这是 MMS 的 DSH fork；上游关系保留在 GitHub 和 `upstream` remote。产品方向由 MMS 决定，已有功能按行为迁移，公开插件接口是实现方式之一，不限制 fork 内的源码改动。

首批改动：MMS approved 模型路由、凭据隔离、Recipe 实际请求校验；常驻独立 effort 选择；模型/通道搜索和输入 focus；工作目录的已有项目搜索、路径直达及确认。迁移状态与原 PR 见 [迁移清单](MIGRATION.md)。运行验证写入原 Stride task b5f588a91c604408。

上游更新先合到独立分支，检查 MMS 迁移项及真实模型请求后再进入自己的发行版。保留上游 MIT 许可；`vendor/` 中从 MMS 导入的代码与 capability catalog 保留 Apache-2.0 许可，来源为 MMS commit c357f6ce737f4713c27bc8e9f229cc6e5c2480bb。没有复制用户配置或凭据。

## 构建与安装

在仓库运行 `pnpm install --frozen-lockfile`，然后用 `DSH_CLIENT_TITLE="MMS Harness" pnpm run build` 构建。`python3 mms/install.py` 接受 `--destination`、`--mms-root`、`--node` 和可选 `--runtime-from`，安装到全新目录，生成 `MMS Harness.command`。安装器采用锁定的 upstream 依赖，将本 fork 同一次构建的全部 client package 和 Web assets 放入独立 runtime；不改其他现有安装。安装元数据记录 fork commit 和 client artifact SHA-256。

双击入口会启动或复用独立服务并打开浏览器。`start/stop/status/open` 只管理该实例；停止保留会话。当前默认仅本机 `127.0.0.1:3092`，手机远程仍在迁移清单中。
