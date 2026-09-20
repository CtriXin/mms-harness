/** `mms-remote` namespace dictionaries for the remote-access settings row. */

export const zh = {
  'title': '远程访问',
  'mode.off': '关闭',
  'mode.off.hint': '只有这台电脑能打开。',
  'mode.tunnel': '仅外网',
  'mode.tunnel.hint': '走已登记的隧道域名。局域网上不监听。',
  'mode.lan': '局域网 + 外网',
  'mode.lan.hint': '同时在局域网和 Tailscale 地址上监听。',
  'reach.tunnel': '隧道',
  'reach.tailscale': 'Tailscale',
  'reach.lan': '局域网',
  'copy': '复制',
  'copy.done': '已复制',
  'copy.aria': '复制 {target} 的链接',
  'note.notInstalled': '这个实例不是通过 MMS Harness 安装的，无法开启远程访问。',
  'note.failed': '切换失败，状态没有改变。在终端跑 mms-harness remote status 看原因。',
  'note.noTunnel': '还没有登记隧道域名。把 cloudflared 指向 127.0.0.1:{port}，再跑 mms-harness remote add-host <域名>。',
  'note.danger': '拿到链接的人可以在这台电脑上执行命令。只发给自己的设备；泄露后跑 mms-harness remote rotate。',
  'note.gatewayDown': '网关没有运行。开一个会话窗口让服务起来，或在终端跑 mms-harness start。',
} as const

/** The remote-access namespace key union. */
export type RemoteKey = keyof typeof zh

export const en: Record<RemoteKey, string> = {
  'title': 'Remote access',
  'mode.off': 'Off',
  'mode.off.hint': 'Only this computer can open it.',
  'mode.tunnel': 'Tunnel only',
  'mode.tunnel.hint': 'Serves registered tunnel hostnames. Nothing listens on the LAN.',
  'mode.lan': 'LAN + tunnel',
  'mode.lan.hint': 'Also listens on the LAN and Tailscale addresses.',
  'reach.tunnel': 'Tunnel',
  'reach.tailscale': 'Tailscale',
  'reach.lan': 'LAN',
  'copy': 'Copy',
  'copy.done': 'Copied',
  'copy.aria': 'Copy the link for {target}',
  'note.notInstalled': 'This Host was not installed by MMS Harness, so remote access cannot be opened.',
  'note.failed': 'The switch failed and nothing changed. Run mms-harness remote status to see why.',
  'note.noTunnel': 'No tunnel hostname registered yet. Point cloudflared at 127.0.0.1:{port}, then run mms-harness remote add-host <hostname>.',
  'note.danger': 'Anyone with the link can run commands on this computer. Send it only to your own devices; run mms-harness remote rotate if it leaks.',
  'note.gatewayDown': 'The gateway is not running. Open a session window to start the service, or run mms-harness start.',
}
