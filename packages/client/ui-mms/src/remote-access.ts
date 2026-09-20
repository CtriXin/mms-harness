/**
 * Host owner of the MMS remote-access Remote namespace.
 *
 * `/remote` already exists as a command, but a command needs a session and the
 * settings surface is root-scoped, so the switch in Settings reads and writes
 * through this namespace instead.
 *
 * Reads and writes are deliberately asymmetric. A read opens the settings
 * panel, so it stays in-process: the mode, port and hostnames come straight
 * out of the installation's own `remote/settings.json`, and the bound
 * addresses from this process's interfaces. A write changes which sockets
 * exist, so it goes through the same `service.py remote …` the terminal and
 * `/remote` drive — one owner of that decision, not three.
 *
 * The links it answers with DO carry the access token. The nonce-gated QR page
 * exists so `/remote` can show a link without writing one into the session
 * log, which is a transcript that gets exported; this panel is neither logged
 * nor exported. Error text is still redacted, because that does reach logs.
 */

import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
// The Remote boundary names its wire types from the package's public subpath.
import type { RemoteAccessState, RemoteAddress, RemoteLink, RemoteMode } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host owner of the `mmsRemote` Remote namespace. */
    mmsRemoteAccess: MmsRemoteAccessController
  }
}

/** Where this plugin finds the installation it drives. */
export interface Config {
  /**
   * Installation root: the directory holding `installation.json`.
   *
   * Spelled `| undefined` because the Loader row may carry no config at all,
   * and `exactOptionalPropertyTypes` distinguishes an absent key from a
   * present one holding `undefined`. Both mean the same thing here.
   */
  installation?: string | undefined
}

/** Modes the switch may ask for, and the `service.py` action that sets each. */
const ACTIONS: Record<RemoteMode, string> = { off: 'off', tunnel: 'tunnel', lan: 'on' }

/** A mode change rebinds sockets; beyond this something is wrong, not slow. */
const SERVICE_TIMEOUT_MS = 30_000

/**
 * Whether an IPv4 address belongs to Tailscale's range.
 *
 * `100.64.0.0/10` is carrier-grade NAT space, which is where Tailscale puts
 * its addresses. It matters to the operator because that one address already
 * reaches their phone from any network, while the router-local ones do not —
 * calling both 「局域网」 hid exactly that. `service.py` and `remote.mjs` make
 * the same test.
 * @param address - IPv4 literal.
 * @returns how the address is reachable.
 */
export function addressKind(address: string): RemoteAddress['kind'] {
  const [first, second] = address.split('.').map(Number)
  return first === 100 && second !== undefined && second >= 64 && second < 128 ? 'tailscale' : 'lan'
}

/**
 * Addresses the gateway binds beyond loopback: the same set `remote.mjs` uses.
 * @returns every non-internal IPv4 address, sorted, with how it is reachable.
 */
export function boundAddresses(): RemoteAddress[] {
  return Object.values(networkInterfaces()).flat()
    .flatMap(entry => entry !== undefined && entry.family === 'IPv4' && !entry.internal ? [entry.address] : [])
    .sort()
    .map(address => ({ address, kind: addressKind(address) }))
}

/** The installation's current access token, or `undefined` when there is none. */
async function readToken(root: string): Promise<string | undefined> {
  try {
    const token = (await readFile(join(root, 'remote/token'), 'utf8')).trim()
    return token === '' ? undefined : token
  } catch {
    return undefined
  }
}

/** Read one JSON file, or `undefined` when it is absent or unreadable. */
async function readJson(path: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
}

export class MmsRemoteAccessController extends TypertRemoteService {
  private readonly installation: string | undefined

  /**
   * @param ctx - Host context this namespace registers on.
   * @param config - the installation this plugin drives.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'mmsRemoteAccess', { namespace: 'mmsRemote' })
    this.installation = config.installation
  }

  /**
   * What remote access is doing right now.
   *
   * Answers a complete, drawable state even when nothing is installed or the
   * settings file has never been written: the panel must render, and an
   * absent file means "off", not "unknown".
   * @returns the current mode, port, hostnames and bound addresses.
   */
  @Remote('status')
  async status(): Promise<RemoteAccessState> {
    const root = this.installation
    const blank: RemoteAccessState = { mode: 'off', port: 0, links: [], gateway: false, installed: false }
    if (root === undefined) return blank
    const installation = await readJson(join(root, 'installation.json'))
    if (installation === undefined) return blank
    const settings = await readJson(join(root, 'remote/settings.json')) ?? {}
    // Mirrors service.py's default: the gateway sits one port above DSH.
    const port = Number(settings['port'] ?? Number(installation['port']) + 1)
    const mode = (['off', 'tunnel', 'lan'] as const).find(value => value === settings['mode']) ?? 'off'
    const hostnames = Array.isArray(settings['hostnames']) ? settings['hostnames'].map(String) : []
    return {
      mode,
      port,
      // Off means nothing is reachable; offering a link would be a lie.
      links: mode === 'off' ? [] : await this.links(root, port, hostnames, mode),
      gateway: await this.gatewayRunning(root),
      installed: true,
    }
  }

  /**
   * Every way in that is live, in the order the operator should reach for.
   *
   * Tunnels first because they work from any network; Tailscale next for the
   * same reason; the router-local addresses last. The scheme follows who
   * terminates TLS: a tunnel does, a bound address does not. Without a token
   * there is nothing to hand out, so the list is empty rather than broken.
   */
  private async links(root: string, port: number, hostnames: readonly string[], mode: RemoteMode): Promise<RemoteLink[]> {
    const token = await readToken(root)
    if (token === undefined) return []
    const query = `/?k=${encodeURIComponent(token)}`
    const tunnels = hostnames.map((target): RemoteLink => ({ kind: 'tunnel', target, url: `https://${target}${query}` }))
    // Only `lan` binds beyond loopback, so only `lan` has addresses to offer.
    const addresses = mode === 'lan' ? boundAddresses() : []
    const rank = { tailscale: 0, lan: 1 }
    return [...tunnels, ...addresses
      .sort((a, b) => rank[a.kind] - rank[b.kind])
      .map((row): RemoteLink => ({
        kind: row.kind, target: `${row.address}:${port}`, url: `http://${row.address}:${port}${query}`,
      }))]
  }

  /**
   * Switch remote access between off, tunnel-only and LAN.
   *
   * `service.py` owns the decision: it writes the settings and starts or stops
   * the gateway, exactly as the terminal and `/remote` do.
   * @param mode - the mode to move to.
   * @returns the state after the change, read back rather than assumed.
   */
  @Remote('setMode')
  async setMode(mode: RemoteMode): Promise<RemoteAccessState> {
    const action = ACTIONS[mode]
    if (action === undefined) {
      throw new RemoteError('gateway/bad-request', 'remote access is off, tunnel or lan', {})
    }
    const root = this.installation
    if (root === undefined || (await readJson(join(root, 'installation.json'))) === undefined) {
      throw new RemoteError('gateway/bad-request',
        'this Host was not installed by MMS Harness, so remote access cannot be opened', {})
    }
    await this.runService(root, action)
    return await this.status()
  }

  /** Whether the gateway process this installation recorded is still alive. */
  private async gatewayRunning(root: string): Promise<boolean> {
    try {
      const pid = Number((await readFile(join(root, 'remote.pid'), 'utf8')).trim())
      if (!Number.isInteger(pid) || pid <= 0) return false
      // Signal 0 tests for the process without touching it.
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }

  /** Run `service.py remote <action>` for this installation. */
  private async runService(root: string, action: string): Promise<void> {
    const installation = await readJson(join(root, 'installation.json'))
    const python = String(installation?.['python'] ?? '')
    const service = join(root, 'source/mms/adapter/service.py')
    await new Promise<void>((settle, fail) => {
      execFile(python, [service, 'remote', action, `--installation=${root}`],
        { timeout: SERVICE_TIMEOUT_MS, encoding: 'utf8', maxBuffer: 1 << 20 },
        (error: unknown, _stdout: string, stderr: string) => {
          if (error === null) return settle()
          // The launcher prints links carrying the access token; a failure
          // message must not carry one into a log or an error surface.
          const detail = redact(String(stderr || (error as Error).message)).trim()
          fail(new RemoteError('gateway/internal', detail || 'remote access could not be changed', {}))
        })
    })
  }
}

/**
 * Strip any access token out of text that is about to leave this process.
 * @param text - launcher output or an error message.
 * @returns the same text with `k=…` values removed.
 */
export function redact(text: string): string {
  return text.replace(/([?&]k=)[A-Za-z0-9_-]+/g, '$1…')
}
