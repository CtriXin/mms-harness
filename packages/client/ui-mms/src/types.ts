/**
 * Wire types of this package's Remote namespace, on their own public subpath
 * so the Remote boundary can name them without pulling in the node half.
 * @module @deepseek-ai/dsh-client-ui-mms/types
 */

/** One directory the folder dialog may open, named by its own basename. */
export interface ProjectMatch {
  /** Folder name shown as the row's title. */
  name: string
  /** Absolute path the row opens. */
  path: string
}

/** How an address is reachable, which decides what the operator can do with it. */
export type RemoteAddressKind = 'tailscale' | 'lan'

/** One address the gateway answers on while remote access is open. */
export interface RemoteAddress {
  /** IPv4 literal the gateway is bound to. */
  address: string
  /** `tailscale` reaches the phone from any network; `lan` only from this one. */
  kind: RemoteAddressKind
}

/** One way in, ready to copy. */
export interface RemoteLink {
  /** Which kind of reach this is; decides the row's label. */
  kind: 'tunnel' | RemoteAddressKind
  /** Host (and port) as the operator reads it. */
  target: string
  /**
   * Full URL including the access token.
   *
   * The token is here on purpose. The nonce-gated QR page exists so a link can
   * be shown without putting one into the session log, which is a transcript
   * that gets exported; the settings panel is neither logged nor exported, and
   * this installation serves one operator who asked to see the link.
   */
  url: string
}

/** Which listeners remote access is running: none, tunnel only, or the LAN too. */
export type RemoteMode = 'off' | 'tunnel' | 'lan'

/** Everything the settings row needs to draw itself and say what is reachable. */
export interface RemoteAccessState {
  /** Current mode. */
  mode: RemoteMode
  /** Gateway port; the tunnel's origin is `127.0.0.1` on this port. */
  port: number
  /**
   * Every way in that is live right now, token included: registered tunnel
   * hostnames first, then the bound addresses (which only `lan` has).
   */
  links: RemoteLink[]
  /** Whether the gateway process is actually up. */
  gateway: boolean
  /**
   * Whether this Host was installed by MMS Harness at all. A DSH started any
   * other way has no installation record to drive, and the row says so instead
   * of offering a switch that cannot work.
   */
  installed: boolean
}

/** How MMS ranks one model's use of one channel. */
export interface RouteRank {
  /** Logical model name, as the catalog shows it. */
  model: string
  /** Provider id serving it (one MMS wire face). */
  provider: string
  /** 0 is this model's primary channel; higher is a fallback. */
  rank: number
}
