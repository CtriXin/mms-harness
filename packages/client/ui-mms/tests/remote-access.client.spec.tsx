// @vitest-environment jsdom
/**
 * The remote-access settings row: what it offers, and what it refuses to
 * offer. The Host half is covered by `remote-access.host.spec.ts`.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RemoteAccessState } from '../src/types.ts'
import { RemoteAccess } from '../src/client/RemoteAccess.tsx'
import { zh } from '../src/client/remote-locales.ts'

/** The locale seat, resolving placeholders the way the real one does. */
const t = ((key: keyof typeof zh, values?: Record<string, string>) =>
  String(zh[key]).replace(/\{(\w+)\}/g, (_, name: string) => values?.[name] ?? `{${name}}`)) as never

function state(over: Partial<RemoteAccessState> = {}): RemoteAccessState {
  return { mode: 'off', port: 3093, links: [], gateway: true, installed: true, ...over }
}

function draw(initial: RemoteAccessState | null, setMode = vi.fn(async () => initial)) {
  const load = vi.fn(async () => initial)
  render(<RemoteAccess t={t} load={load} setMode={setMode as never} />)
  return { load, setMode }
}

afterEach(cleanup)

describe('RemoteAccess', () => {
  it('draws nothing when the Host has no remote-access namespace', async () => {
    draw(null)
    await waitFor(() => { expect(screen.queryByText(zh['title'])).toBeNull() })
  })

  it('offers the three modes and marks the current one', async () => {
    draw(state({ mode: 'tunnel' }))
    const modes = await screen.findAllByRole('radio')
    expect(modes.map(node => node.textContent))
      .toEqual([zh['mode.off'], zh['mode.tunnel'], zh['mode.lan']])
    expect(modes[1]!.getAttribute('aria-checked')).toBe('true')
  })

  it('switches mode on one click and draws what the Host answers', async () => {
    const after = state({
      mode: 'lan',
      links: [{ kind: 'tailscale', target: '100.120.8.98:3093', url: 'http://100.120.8.98:3093/?k=T' }],
    })
    const setMode = vi.fn(async () => after)
    draw(state({ mode: 'off' }), setMode)
    fireEvent.click(await screen.findByRole('radio', { name: zh['mode.lan'] }))
    expect(setMode).toHaveBeenCalledWith('lan')
    // Drawn from the answer, not from assuming the click took effect.
    expect(await screen.findByText('http://100.120.8.98:3093/?k=T')).toBeTruthy()
    expect(screen.getByText(zh['reach.tailscale'])).toBeTruthy()
  })

  it('shows the link complete, token and all', async () => {
    draw(state({
      mode: 'tunnel',
      links: [{ kind: 'tunnel', target: 'h.example.test', url: 'https://h.example.test/?k=SECRET' }],
    }))
    // The operator asked to see it: a redacted link would be unusable here.
    expect(await screen.findByText('https://h.example.test/?k=SECRET')).toBeTruthy()
  })

  it('says a mode change failed rather than showing a state that never happened', async () => {
    const setMode = vi.fn(async () => null)
    draw(state({ mode: 'off' }), setMode)
    fireEvent.click(await screen.findByRole('radio', { name: zh['mode.tunnel'] }))
    expect(await screen.findByText(zh['note.failed'])).toBeTruthy()
    // The old mode is still the one marked: nothing pretends to have moved.
    expect(screen.getByRole('radio', { name: zh['mode.off'] }).getAttribute('aria-checked')).toBe('true')
  })

  it('offers no switch at all when this Host was not installed by MMS Harness', async () => {
    draw(state({ installed: false }))
    expect(await screen.findByText(zh['note.notInstalled'])).toBeTruthy()
    for (const mode of screen.getAllByRole('radio')) expect((mode as HTMLButtonElement).disabled).toBe(true)
  })

  it('says what is missing when a mode is on but nothing is reachable', async () => {
    draw(state({ mode: 'tunnel', links: [] }))
    expect(await screen.findByText(/127\.0\.0\.1:3093/)).toBeTruthy()
  })

  it('warns that the link is command execution, wherever it leads', async () => {
    draw(state({
      mode: 'lan',
      links: [{ kind: 'lan', target: '192.168.1.7:3093', url: 'http://192.168.1.7:3093/?k=T' }],
    }))
    expect(await screen.findByText(zh['note.danger'])).toBeTruthy()
  })

  it('says so when the mode is on but the gateway is not running', async () => {
    draw(state({ mode: 'tunnel', gateway: false }))
    expect(await screen.findByText(zh['note.gatewayDown'])).toBeTruthy()
  })

  it('says nothing about links or danger while off', async () => {
    draw(state({ mode: 'off' }))
    await screen.findAllByRole('radio')
    expect(screen.queryByText(zh['note.danger'])).toBeNull()
  })
})
