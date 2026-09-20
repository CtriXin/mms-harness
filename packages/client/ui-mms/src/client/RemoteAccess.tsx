/**
 * Remote-access row in Settings → General.
 *
 * `/remote` already did this from the composer, but a switch you have to
 * remember a command for is not a switch. Three states, one click each:
 * off, tunnel only, and the LAN as well.
 *
 * Tunnel-only exists because a tunnel reaches DSH through `127.0.0.1`, which
 * the gateway binds in every state — serving one never needed the LAN
 * listener that "on" opens.
 *
 * The links are shown complete, token and all: this installation serves one
 * operator, and a link you have to go and fetch from somewhere else is not a
 * link. Copying one is a single tap, because the phone is the destination.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { RemoteAccessState, RemoteLink, RemoteMode } from '@deepseek-ai/dsh-client-ui-mms/types'
import type { RemoteKey } from './remote-locales.ts'
import css from './RemoteAccess.module.css'

/** Injected business face: read the current state, and move to another one. */
export interface RemoteAccessInjected {
  /** Current state, or `null` when the Host has no remote-access namespace. */
  load: () => Promise<RemoteAccessState | null>
  /** Switch modes; answers the state read back afterwards, never assumed. */
  setMode: (mode: RemoteMode) => Promise<RemoteAccessState | null>
}

/**
 * Component props: the locale seat plus the injected face.
 *
 * The General item slot supplies no owner props, and the standard runtime
 * hooks are not used here, so they are not declared — the same shape the
 * model seat in this package uses.
 */
export type RemoteAccessProps = PropsLocale<'mms-remote'> & RemoteAccessInjected

/** The three states, in the order they widen what is reachable. */
const MODES: readonly { id: RemoteMode; labelKey: RemoteKey; hintKey: RemoteKey }[] = [
  { id: 'off', labelKey: 'mode.off', hintKey: 'mode.off.hint' },
  { id: 'tunnel', labelKey: 'mode.tunnel', hintKey: 'mode.tunnel.hint' },
  { id: 'lan', labelKey: 'mode.lan', hintKey: 'mode.lan.hint' },
]

/**
 * Render the remote-access row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function RemoteAccess({ t, load, setMode }: RemoteAccessProps) {
  const [state, setState] = useState<RemoteAccessState | null>(null)
  const [busy, setBusy] = useState<RemoteMode | null>(null)
  const [failed, setFailed] = useState(false)
  // A mode change outlives this row when the panel closes mid-flight; the
  // late answer must not set state on an unmounted row.
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])

  useEffect(() => {
    void load().then((next) => { if (live.current) setState(next) }).catch(() => { /* drawn as absent */ })
  }, [load])

  const [copied, setCopied] = useState<string | null>(null)
  const copy = useCallback((url: string) => {
    // `navigator.clipboard` is absent on a non-secure origin, which is exactly
    // what a LAN address is; the link stays selectable either way.
    void Promise.resolve(navigator.clipboard?.writeText(url)).then(() => {
      if (!live.current) return
      setCopied(url)
      setTimeout(() => { if (live.current) setCopied(null) }, 1500)
    }).catch(() => { /* select it by hand */ })
  }, [])

  const choose = useCallback((mode: RemoteMode) => {
    setBusy(mode)
    setFailed(false)
    void setMode(mode).then((next) => {
      if (!live.current) return
      // A null answer means the namespace vanished, not that the mode took.
      if (next === null) setFailed(true)
      else setState(next)
    }).catch(() => { if (live.current) setFailed(true) })
      .finally(() => { if (live.current) setBusy(null) })
  }, [setMode])

  // No namespace at all: this Host predates the overlay's node half.
  if (state === null) return null

  const labelOf = (kind: RemoteLink['kind']) =>
    kind === 'tunnel' ? t('reach.tunnel') : kind === 'tailscale' ? t('reach.tailscale') : t('reach.lan')

  return (
    <div className={css.group}>
      <div className={css.title}>{t('title')}</div>
      <div className={css.modes} role="radiogroup" aria-label={t('title')}>
        {MODES.map(({ id, labelKey, hintKey }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={state.mode === id}
            disabled={!state.installed || busy !== null}
            title={t(hintKey)}
            className={clsx(css.mode, state.mode === id && css.selected)}
            onClick={() => { if (state.mode !== id) choose(id) }}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
      {!state.installed && <p className={css.note}>{t('note.notInstalled')}</p>}
      {state.installed && failed && <p className={css.warn}>{t('note.failed')}</p>}
      {state.installed && !failed && state.mode !== 'off' && (
        <>
          {state.links.length === 0
            ? <p className={css.note}>{t('note.noTunnel', { port: String(state.port) })}</p>
            : (
              <ul className={css.reach}>
                {state.links.map(link => (
                  <li key={link.url}>
                    <span className={css.reachLabel}>{labelOf(link.kind)}</span>
                    {/* Selectable, so it can be copied by hand when the
                        clipboard API is unavailable (a non-secure origin). */}
                    <span className={css.reachValue}>{link.url}</span>
                    <button
                      type="button"
                      className={css.copy}
                      aria-label={t('copy.aria', { target: link.target })}
                      onClick={() => { copy(link.url) }}
                    >
                      {copied === link.url ? t('copy.done') : t('copy')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          {/* The link is command execution on this machine; saying so beside
              the switch is the only place it is read before it is shared. */}
          <p className={css.warn}>{t('note.danger')}</p>
          {!state.gateway && <p className={css.warn}>{t('note.gatewayDown')}</p>}
        </>
      )}
    </div>
  )
}
