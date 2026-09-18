# 手机 / 另一台电脑访问（C07）

**默认关闭。** 开启后，只要拿到链接，就能在这台电脑上执行命令。所以链接只发给自己的设备。

## 在应用里（推荐）

在对话框输入：

- `/remote on`：开启。
- `/remote status`：查看状态。
- `/remote rotate`：更换口令。
- `/remote off`：关闭。

结果卡片里有一行「扫码页」地址，只有本机浏览器能打开，5 分钟内有效，页面上有每个地址的二维码。卡片会写进会话记录，所以卡片里的口令一律显示成 `k=…`，扫码页每次都要现开，不能复用。

## 在终端里

```bash
"~/Applications/MMS Harness.command" remote on        # 开启，打印每个局域网地址的链接
"~/Applications/MMS Harness.command" remote status    # 再次查看链接
"~/Applications/MMS Harness.command" remote rotate    # 更换口令：旧链接和已登录的设备立即失效
"~/Applications/MMS Harness.command" remote off       # 关闭：网关退出，局域网上不再有任何监听
"~/Applications/MMS Harness.command" remote add-host <隧道域名>   # 外网：登记 Tailscale / Cloudflare 隧道域名
```

手机打开链接后，口令会换成一个 HttpOnly cookie，地址栏里的口令随即去掉。之后直接打开 `http://<地址>:<端口>/` 就行。**电脑重启、服务重启都不需要重新扫码**，除非运行过 `rotate`。

## 为什么是网关，而不是让 DSH 直接监听局域网

上游 DSH 拒绝 `--host 0.0.0.0`，理由是 Web UI 就等于这台电脑的远程执行能力（`packages/bundle/web-app/src/startup.ts:74`）。我们不绕过这个决定：

- DSH 始终只监听 `127.0.0.1`。
- `mms/adapter/remote.mjs` 是唯一对外的入口。它只在开启时运行，**按地址逐个监听**（`127.0.0.1` 加上每个局域网 IPv4），不绑定通配地址。所以关闭之后，端口在网络上确实看不到。
- 每个请求（包括 WebSocket）按这个顺序检查：
  1. Host 必须在允许列表里：已绑定的地址:端口，或登记过的隧道域名。
  2. 如果带 Origin，必须和 Host 一致。
  3. 必须持有当前口令对应的 cookie。

  不满足就返回 421、403 或 401，请求不会到达 DSH。
- 不需要口令就能访问的只有两个路径：`GET /manifest.webmanifest` 和 `GET /favicon.svg`。浏览器取 manifest 时本来就不带 cookie，这两个文件也只是应用的静态元数据。
- 网关自己持有 DSH 的认证 cookie，代为完成鉴权，并且从响应里去掉 DSH 的 cookie，远端浏览器永远拿不到它。
- 口令文件是 `<安装目录>/remote/token`，权限 0600，每个请求都会重新读取，所以 `rotate` 立即生效。口令、cookie 和查询串都不会写进日志；日志只记录方法和路径。
- 同一个设计以前在 MMS Pilot 里就有：`mms_web/remote_access.py`。模式、按地址监听、持久口令、`?k=` 参数，都沿用了 Pilot 的语义。

## 外网

最简单的办法是 Tailscale：它的 `100.x` 地址会被当作局域网地址自动绑定，手机装上 Tailscale 就能直接用 `remote status` 里的 `100.x` 链接。

Cloudflare Tunnel 或 SSH 转发：把 `127.0.0.1:<网关端口>` 接出去，再用 `remote add-host <域名>` 登记域名。公网域名不是秘密（证书透明日志几分钟内就会公开），真正的门禁始终是口令。

## 已验证 / 未验证（2026-09-18）

- **O6，9 项网关测试**：走真实 socket，覆盖无口令、非法 Host、链接换 cookie、Host/cookie 改写、跨源拒绝、WebSocket、轮换、manifest 放行。另外做了 3 条 mutation：分别去掉 cookie 校验、Origin 校验、DSH cookie 过滤，每条都会让测试变红。
- **端到端**（临时安装，随机端口）：
  - 局域网 IP 能访问到网关；局域网 IP 直连 DSH 端口不通。
  - 在 390×844 视口下完成真实对话，模型回复经 WebSocket 流式返回。
  - `rotate` 之后，已登录的浏览器立即变成 401。
  - `off` 之后只剩 DSH 的回环端口在监听。
  - 服务停止再启动后，同一个 cookie 仍然能进。
- **没验证的**：
  - 真实手机上的效果，包括软键盘、内置浏览器、加到主屏幕后的行为。
  - 真实跨网的 Tailscale 或 Cloudflare 隧道。
  - Windows。
- **应用内 `/remote` 和二维码**：
  - 测试 13 项，其中新增扫码页和指令 5 项；另有 2 条 mutation（去掉本机 Host 检查、去掉口令打码），各自都会让测试变红。
  - 端到端：在应用里执行 `/remote on`，网关随即开启；结果卡片里没有口令；解压会话日志核对过，里面没有口令。
  - 扫码页：两个二维码（局域网、Tailscale）在浏览器内用 `BarcodeDetector` 解码，内容和期望的链接逐字一致。
  - 已知体验问题：在还没有消息的新会话里执行 `/remote`，卡片要等会话真正开始后才显示。这是 DSH 对空会话的渲染方式。
- **二维码库**：`mms/vendor/qrcode-generator`（MIT，2.0.4，sha512 与 Pilot 锁定的一致），机主 2026-09-18 同意引入。
- **还没做的**：C07.07，升级 / 回滚时保持认证。fork 目前还没有升级 guardian。
