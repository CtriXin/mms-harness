/**
 * The Host half of the remote-access switch: what the settings row reads, and
 * what a mode change actually runs.
 *
 * `service.py` is installed as a real executable file here rather than mocked,
 * because the point of the write path is that it drives the launcher — a
 * stubbed `execFile` would pass even if nothing were ever spawned.
 */
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import { addressKind, boundAddresses, MmsRemoteAccessController, redact } from '../src/remote-access.ts'

let root: string
const roots: Context[] = []

/** An installation the controller can drive: record, fake launcher, settings. */
async function install(options: { mode?: string; hostnames?: string[]; port?: number } = {}) {
  await mkdir(join(root, 'source/mms/adapter'), { recursive: true })
  await mkdir(join(root, 'remote'), { recursive: true })
  await writeFile(join(root, 'installation.json'),
    JSON.stringify({ python: process.execPath, port: options.port ?? 3092 }))
  // A real file on disk, run as a program, that records its own argv.
  const script = join(root, 'source/mms/adapter/service.py')
  await writeFile(script,
    `#!/bin/sh\nprintf '%s\\n' "$@" > ${JSON.stringify(join(root, 'argv'))}\n`
    + `cat > ${JSON.stringify(join(root, 'remote/settings.json'))} <<'JSON'\n`
    + '{"mode": "tunnel", "port": 3093, "hostnames": ["harness.example.test"]}\nJSON\n')
  await chmod(script, 0o755)
  // The controller runs `installation.python`; point it at the shell, not node.
  await writeFile(join(root, 'installation.json'),
    JSON.stringify({ python: '/bin/sh', port: options.port ?? 3092 }))
  if (options.mode !== undefined) {
    await writeFile(join(root, 'remote/settings.json'), JSON.stringify({
      mode: options.mode, port: 3093, hostnames: options.hostnames ?? [],
    }))
  }
}

/** A controller on its own root context, disposed with the case. */
function controller(installation?: string) {
  const ctx = new Context()
  roots.push(ctx)
  return new MmsRemoteAccessController(ctx, { installation })
}

beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'mms-remote-')) })
afterEach(async () => {
  await Promise.all(roots.splice(0).map(ctx => ctx.fiber.dispose()))
  await rm(root, { recursive: true, force: true })
})

describe('addressKind', () => {
  it('separates Tailscale from the router-local addresses', () => {
    // The whole reason this exists: 100.64/10 already reaches the phone from
    // any network, and calling it 「局域网」 hid it among the ones that cannot.
    expect(addressKind('100.120.8.98')).toBe('tailscale')
    expect(addressKind('100.64.0.1')).toBe('tailscale')
    expect(addressKind('192.168.1.7')).toBe('lan')
    // Bounds: neither neighbour of the CGNAT block belongs to it.
    expect(addressKind('100.63.255.1')).toBe('lan')
    expect(addressKind('100.128.0.1')).toBe('lan')
  })
})

describe('boundAddresses', () => {
  it('offers only non-internal IPv4, the set the gateway binds', () => {
    for (const row of boundAddresses()) {
      expect(row.address).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
      expect(row.address.startsWith('127.')).toBe(false)
    }
  })
})

describe('status', () => {
  it('answers a drawable state when nothing is installed', async () => {
    const state = await controller().status()
    expect(state).toEqual({ mode: 'off', port: 0, links: [], gateway: false, installed: false })
  })

  it('reads the installation rather than guessing, and defaults the port beside DSH', async () => {
    await install()
    const state = await controller(root).status()
    // No settings file yet: that means off, not unknown.
    expect(state).toMatchObject({ mode: 'off', installed: true, port: 3093, links: [] })
  })

  it('offers the tunnel and nothing else in tunnel mode', async () => {
    await install({ mode: 'tunnel', hostnames: ['harness.example.test'] })
    await writeFile(join(root, 'remote/token'), 'TOKEN-VALUE\n')
    const state = await controller(root).status()
    expect(state.mode).toBe('tunnel')
    // The link is complete, token included: the operator asked to see it.
    expect(state.links).toEqual([{
      kind: 'tunnel', target: 'harness.example.test',
      url: 'https://harness.example.test/?k=TOKEN-VALUE',
    }])
  })

  it('adds the bound addresses in lan mode, reachable ones first', async () => {
    await install({ mode: 'lan', hostnames: ['harness.example.test'] })
    await writeFile(join(root, 'remote/token'), 'TOKEN-VALUE\n')
    const state = await controller(root).status()
    expect(state.links[0]!.kind).toBe('tunnel')
    const kinds = state.links.slice(1).map(link => link.kind)
    // Tailscale reaches the phone from any network; the LAN ones do not, so
    // they never come first.
    expect(kinds.indexOf('lan') === -1 || kinds.lastIndexOf('tailscale') < kinds.indexOf('lan')).toBe(true)
    expect(state.links.slice(1).map(link => link.target))
      .toEqual(boundAddresses()
        .sort((a, b) => Number(a.kind === 'lan') - Number(b.kind === 'lan'))
        .map(row => `${row.address}:3093`))
    // A bound address is plain HTTP; only the tunnel terminates TLS.
    for (const link of state.links.slice(1)) expect(link.url.startsWith('http://')).toBe(true)
  })

  it('offers nothing at all when there is no token to hand out', async () => {
    await install({ mode: 'lan', hostnames: ['harness.example.test'] })
    expect((await controller(root).status()).links).toEqual([])
  })

  it('offers nothing while off, however much is registered', async () => {
    await install({ mode: 'off', hostnames: ['harness.example.test'] })
    await writeFile(join(root, 'remote/token'), 'TOKEN-VALUE\n')
    expect((await controller(root).status()).links).toEqual([])
  })

  it('reports the gateway down when the recorded process is gone', async () => {
    await install({ mode: 'lan' })
    // A pid no process can hold.
    await writeFile(join(root, 'remote.pid'), '2147483647\n')
    expect((await controller(root).status()).gateway).toBe(false)
    await writeFile(join(root, 'remote.pid'), `${process.pid}\n`)
    expect((await controller(root).status()).gateway).toBe(true)
  })
})

describe('setMode', () => {
  it.each([['off', 'off'], ['tunnel', 'tunnel'], ['lan', 'on']] as const)(
    'runs the launcher action for %s', async (mode, action) => {
      await install()
      const state = await controller(root).setMode(mode)
      const argv = (await readFile(join(root, 'argv'), 'utf8')).trim().split('\n')
      // `lan` is the launcher's `on`: one owner of that decision, not three.
      expect(argv).toEqual(['remote', action, `--installation=${root}`])
      // The state comes from reading back, not from assuming the write landed.
      expect(state.mode).toBe('tunnel')
    })

  it('refuses a mode the launcher has no action for', async () => {
    await install()
    await expect(controller(root).setMode('all' as never)).rejects.toThrow()
  })

  it('refuses when this Host was not installed by MMS Harness', async () => {
    await expect(controller(root).setMode('lan')).rejects.toThrow(/MMS Harness/)
  })
})

describe('redact', () => {
  it('keeps an access token out of anything that leaves the process', () => {
    expect(redact('http://192.168.1.7:3093/?k=SECRET-VALUE_1')).toBe('http://192.168.1.7:3093/?k=…')
    expect(redact('https://h.example.test/?a=1&k=SECRET')).toBe('https://h.example.test/?a=1&k=…')
  })
})
