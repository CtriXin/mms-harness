/**
 * ModelSelect: the composer's named model seat (`conversation.input.model`).
 *
 * MMS publishes one provider per approved route, so the catalog arrives as a
 * flat list where a model reachable through three channels appears three
 * times. This seat folds it back (see ./model-groups.ts) and walks it the way
 * the choice is actually made: family -> model -> done. The channel step
 * exists on a model's own row and only when more than one channel could serve
 * it; picking a model commits the channel already in use, else its primary.
 *
 * Opening lands on the family pane WITH THE SEARCH FIELD FOCUSED, and typing
 * lists models directly — so a known name costs one click and one Enter, and
 * there is no "Model / Effort" root menu to step through. Effort keeps its own
 * always-visible trigger beside the model one.
 *
 * While open, up/down move focus across the rows of the shown pane (wrapping),
 * Tab settles like Enter, and Escape and Shift+Tab step out one pane at a time
 * before closing back to the trigger that opened the card.
 *
 * Data and submission ride the SAME per-session ModelDirectory as the /model
 * popup. Reasoning metadata is read off the CHOSEN route, never a client-owned
 * vocabulary: two channels for one model may declare different effort levels,
 * and a channel that declares none shows no effort control at all. A rejected
 * selection announces through the shared transient Toast anchored to the
 * composer card; the in-menu strip with Retry remains the catalog-load
 * surface.
 */
import {
  useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore,
  type CSSProperties, type KeyboardEvent, type FocusEvent,
} from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { ModelReasoningEffort, ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import {
  IconCheckOutline16, IconChevronDownOutline14, IconChevronRightOutline14,
  IconDataOutline16, IconWarningOutline16, Toast,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ModelSelectInjected } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import { foldCatalog, searchModels, type LogicalModel, type ModelFamily } from './model-groups.ts'

/** Upstream's seat face plus the explicit "use for new sessions" verb (C01.06). */
export type MmsModelSeatInjected = ModelSelectInjected & {
  /**
   * Make a selection the default for new sessions; in-session switches no longer do.
   * @param selection - the session's current model and effort.
   * @returns whether it was saved, with the Host's confirmation or failure text.
   */
  makeDefault: (selection: ModelSelection) => Promise<{ ok: boolean; text: string }>
}
import css from './ModelSelect.module.css'

/**
 * Which pane the dropdown shows.
 *
 * The seat opens on `family` — there is no root menu of "Model / Effort" rows,
 * because effort has its own always-visible trigger and the model trigger can
 * only mean "choose a model". That removes one click from every switch.
 * `channel` is reached from a model's own row and is skipped entirely when a
 * model has one channel or the primary is wanted.
 */
type Pane = 'family' | 'model' | 'channel' | 'effort'

/** Where backing out of a pane lands; null closes the menu. */
const PARENT_PANE: Record<Pane, Pane | null> = {
  family: null,
  model: 'family',
  channel: 'model',
  // Effort is entered from its own trigger, so leaving it closes rather than
  // dropping the operator into a model list they never asked for.
  effort: null,
}

/** One dynamic effort row; undefined means preserve the provider default. */
interface EffortChoice {
  key: string
  effort: string | undefined
  label: string
}

/** Unplaced portal card: hidden but laid out at a fixed origin so offsetWidth/offsetHeight are real (Menu primitive's measure pass). */
const MEASURE_STYLE: CSSProperties = { visibility: 'hidden', left: 0, top: 0 }

/**
 * Render the composer model seat.
 * @param props - owner share (locked) + injected face (shared directory
 * store/verbs) + the standard locale seat.
 * @returns the trigger and, while open, the two-level menu.
 */
export function ModelSelect(
  { locked, available, directory, load, select, makeDefault, t }:
  MmsModelSeatInjected & { locked: boolean } & PropsLocale<'mms-model'>,
) {
  const state = useSyncExternalStore(
    fn => directory.subscribe(fn),
    () => directory.getSnapshot(),
  )
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pane, setPane] = useState<Pane>('family')
  // Which family the model pane lists, and which model the channel pane is
  // about. Held by name so a catalog refresh re-resolves them instead of
  // pinning a stale object.
  const [familyKey, setFamilyKey] = useState('')
  const [channelModel, setChannelModel] = useState('')
  // The in-menu error strip serves catalog loads (its Retry re-runs the
  // load); a rejected SELECTION announces through the transient toast
  // instead, so the strip renders only while the latest failure-capable
  // action was a load.
  const lastActionRef = useRef<'load' | 'select'>('load')
  const [toast, setToast] = useState<{ seq: number; text: string } | null>(null)
  const toastSeq = useRef(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const effortTriggerRef = useRef<HTMLButtonElement | null>(null)
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [menuPos, setMenuPos] = useState<CSSProperties | null>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()

  // The catalog, folded back into family -> model -> channel (see
  // ./model-groups.ts for why MMS's one-provider-per-route shape needs it).
  const families = useMemo(() => foldCatalog(state.groups), [state.groups])
  const shownFamily = families.find(family => family.key === familyKey)
  const hits = useMemo(() => searchModels(families, query), [families, query])
  const choices = useMemo(() => state.groups.flatMap(group =>
    group.models.map(model => ({
      group,
      model,
      selection: {
        provider: group.id,
        model: model.id,
        ...model.reasoning?.defaultEffort === undefined
          ? {}
          : { reasoningEffort: model.reasoning.defaultEffort },
      } satisfies ModelSelection,
    }))), [state.groups])
  const selectedIndex = state.current === null
    ? -1
    : choices.findIndex(c => c.selection.provider === state.current?.provider && c.selection.model === state.current.model)
  const currentChoice = choices[selectedIndex]
  const reasoning = currentChoice?.model.reasoning
  const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort
  const effortLabel = reasoning === undefined
    ? undefined
    : effectiveEffort === undefined
      ? t('effort.providerDefault')
      : reasoning.efforts.find(level => level.id === effectiveEffort)?.name ?? effectiveEffort
  const effortChoices = useMemo<readonly EffortChoice[]>(() => reasoning === undefined
    ? []
    : [
      ...reasoning.defaultEffort === undefined
        ? [{ key: 'provider-default', effort: undefined, label: t('effort.providerDefault') }]
        : [],
      ...reasoning.efforts.map((effort: ModelReasoningEffort) => ({
        key: `effort:${effort.id}`,
        effort: effort.id,
        label: effort.name,
      })),
    ], [reasoning, t])
  const busy = state.status === 'selecting'

  const reload = (): void => {
    lastActionRef.current = 'load'
    load()
  }

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent): void => {
      // The portaled card is outside the trigger subtree; check both.
      if (rootRef.current?.contains(event.target as Node) === true) return
      if (menuRef.current?.contains(event.target as Node) === true) return
      setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => { document.removeEventListener('mousedown', closeOutside) }
  }, [open])

  // A pane switch unmounts the row that had focus, which drops focus onto the
  // page body — outside the card's subtree, where its key handling no longer
  // sees a keystroke. Every switch therefore names where the keyboard lands:
  // drilling on the pane's current value, coming back on the cell that opened
  // the pane left.
  const paneFocus = useRef<'move' | null>(null)
  useEffect(() => {
    const intent = paneFocus.current
    if (!open || intent === null) return
    // The card renders HIDDEN for one frame so the Menu primitive can measure
    // it, and a `visibility: hidden` element cannot take focus — focusing
    // there silently did nothing and the seat opened with the keyboard still
    // on the trigger. Wait for the placement, keeping the intent until then.
    // (jsdom does not model this, so only a real browser shows it.)
    if (menuPos === null) return
    paneFocus.current = null
    // The family pane owns the search field, and landing there IS the fast
    // path: open the seat, type three letters, press Enter. Every other pane
    // opens on the value in use, else its first row.
    if (pane === 'family') { searchRef.current?.focus(); return }
    const checked = menuRef.current?.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]:not([disabled])')
    const target = checked ?? itemRefs.current.find(item => item !== null && !item.disabled)
    // Rows a selection in flight disabled cannot take the keyboard; the
    // trigger does, so the card's keys still reach the menu.
    ;(target ?? triggerRef.current)?.focus()
  }, [open, pane, menuPos])

  // Portaled placement (the Menu primitive's portal rules: fixed from the
  // anchor rect, measured before paint, clamped inside the viewport): above
  // the trigger, right edges aligned. Depends on pane and directory state
  // because pane switches and async catalog loads resize the card.
  /* jscpd:ignore-start -- deliberate mirror of ui-primitives useAnchoredPosition:
     that hook only places from the anchor's LEFT edge, while this card aligns
     right edges (x = rect.right - width), so the measure-and-clamp plumbing repeats. */
  useLayoutEffect(() => {
    if (!open) { setMenuPos(null); return }
    const place = (): void => {
      /* v8 ignore next 2 -- the trigger ref is attached whenever the menu is open. */
      const rect = (activeTriggerRef.current ?? triggerRef.current)?.getBoundingClientRect()
      if (rect === undefined) return
      const MARGIN = 12
      const lw = menuRef.current?.offsetWidth ?? 0
      const lh = menuRef.current?.offsetHeight ?? 0
      let x = rect.right - lw
      let y = rect.top - 8 - lh
      if (lw > 0) x = Math.min(Math.max(x, MARGIN), window.innerWidth - lw - MARGIN)
      if (lh > 0) y = Math.min(Math.max(y, MARGIN), window.innerHeight - lh - MARGIN)
      setMenuPos({ left: x, top: y })
    }
    // First run measures the hidden pre-render (same commit as `open`), so
    // the card lands placed before anything paints.
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, pane, state])
  /* jscpd:ignore-end */

  if (!available) return null

  const show = (): void => {
    activeTriggerRef.current = triggerRef.current
    setQuery('')
    // Opening lands on the family pane with the search field focused, so the
    // seat is typeable the moment it appears.
    paneFocus.current = 'move'
    setPane('family')
    setOpen(true)
    reload()
  }

  const close = (restoreFocus = false): void => {
    setOpen(false)
    setPane('family')
    setQuery('')
    if (restoreFocus) queueMicrotask(() => { (activeTriggerRef.current ?? triggerRef.current)?.focus() })
  }

  const drill = (next: Pane): void => {
    paneFocus.current = 'move'
    setPane(next)
  }

  /** Step out of a pane, or close when it has no parent. */
  const back = (from: Pane): void => {
    const parent = PARENT_PANE[from]
    if (parent === null) { close(true); return }
    paneFocus.current = 'move'
    setPane(parent)
  }

  const moveFocus = (offset: number): void => {
    const items = itemRefs.current.filter(item => item !== null)
    if (items.length === 0) return
    const active = items.findIndex(item => item === document.activeElement)
    // Focus outside the rows (the trigger, which keeps it while the menu
    // opens) enters at the end the step comes from: the first row forward,
    // the last row backward.
    const next = active === -1
      ? (offset > 0 ? 0 : items.length - 1)
      : (active + offset + items.length) % items.length
    items[next]?.focus()
  }

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      // Escape backs out one pane at a time, then closes.
      back(pane)
      return
    }
    if (!open) return
    // Tab settles like Enter and Shift+Tab leaves like Escape, so the menu's
    // keys mean what they mean in the composer. Both are consumed: the card
    // keeps the browser's focus traversal out while it is open.
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        event.preventDefault()
        back(pane)
        return
      }
      // Settling activates the row the keyboard is on; with focus still on the
      // trigger, Tab enters the menu at the value in use instead. Any other
      // control inside the card (a retry button) keeps the browser's traversal,
      // so the keystroke stays unconsumed there.
      const focused = document.activeElement
      const rows = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null)
      if (focused instanceof HTMLButtonElement && rows.includes(focused)) {
        event.preventDefault()
        focused.click()
        return
      }
      if (focused !== triggerRef.current) return
      event.preventDefault()
      const checked = menuRef.current?.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]:not([disabled])')
      ;(checked ?? rows.find(item => !item.disabled))?.focus()
      return
    }
    if (event.target === searchRef.current && !['ArrowDown', 'ArrowUp'].includes(event.key)) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(event.key === 'ArrowDown' ? 1 : -1)
    }
  }

  const inCard = (node: Node | null): boolean => {
    if (node === null) return false
    if (rootRef.current?.contains(node) === true) return true
    // React attaches child refs before their parent's, so the opening pane's
    // own focus move — the search field's autoFocus — can land BEFORE this
    // card's ref exists. An absent ref on an open card means "still mounting",
    // not "outside": reading it as outside closed the menu on every open.
    return menuRef.current === null ? open : menuRef.current.contains(node)
  }

  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (event.relatedTarget instanceof Node && inCard(event.relatedTarget)) return
    // A programmatic focus() — which is how a pane hands the keyboard to its
    // search field — reports no relatedTarget in some engines, so where focus
    // actually landed decides. Judged after the move settles; an outside click
    // is closed by the mousedown listener regardless.
    if (event.relatedTarget === null) {
      queueMicrotask(() => {
        if (!inCard(document.activeElement)) close()
      })
      return
    }
    close()
  }

  const settleSelection = (result: Awaited<ReturnType<ModelSelectInjected['select']>>): void => {
    if (result === undefined) return
    if (result.ok) {
      if (rootRef.current !== null) close(true)
      return
    }
    const { error } = result
    toastSeq.current += 1
    setToast({
      seq: toastSeq.current,
      text: error.code === 'session/writer-held'
        ? t('error.sessionInUse')
        : t('error.action', { message: `${error.code}: ${error.message}` }),
    })
  }

  const choose = (selection: ModelSelection): void => {
    if (state.current?.provider === selection.provider && state.current.model === selection.model) {
      close(true)
      return
    }
    lastActionRef.current = 'select'
    void select(selection).then(settleSelection)
  }

  const chooseEffort = (effort: string | undefined): void => {
    if (state.current === null) return
    if (effectiveEffort === effort) {
      close(true)
      return
    }
    const selection: ModelSelection = {
      provider: state.current.provider,
      model: state.current.model,
      ...effort === undefined ? {} : { reasoningEffort: effort },
    }
    lastActionRef.current = 'select'
    void select(selection).then(settleSelection)
  }

  const useAsDefault = (): void => {
    if (state.current === null) return
    const selection: ModelSelection = {
      provider: state.current.provider,
      model: state.current.model,
      ...effectiveEffort === undefined ? {} : { reasoningEffort: effectiveEffort },
    }
    void makeDefault(selection).then((result) => {
      if (result.ok && rootRef.current !== null) close(true)
      toastSeq.current += 1
      setToast({ seq: toastSeq.current, text: result.ok ? result.text : t('default.failed', { message: result.text }) })
    })
  }

  const waiting = state.current === null && state.status === 'loading'
  const modelLabel = waiting
    ? t('trigger.loading')
    : currentChoice?.model.name
      ?? (state.current === null ? t('trigger.fallback') : `${state.current.provider}/${state.current.model}`)
  const triggerLabel = effortLabel === undefined ? modelLabel : `${modelLabel} · ${effortLabel}`
  const triggerAria = waiting
    ? t('trigger.loading')
    : state.current === null
      ? t('trigger.selectAria')
      : effortLabel === undefined
        ? t('trigger.aria', { model: modelLabel })
        : t('trigger.ariaEffort', { model: modelLabel, effort: effortLabel })
  itemRefs.current = []
  let itemIndex = 0
  const itemRef = () => {
    const at = itemIndex++
    return (node: HTMLButtonElement | null) => { itemRefs.current[at] = node }
  }

  /** The channel this model is currently running on, if any. */
  const activeChannelOf = (model: LogicalModel) => model.channels.find(channel =>
    state.current?.provider === channel.providerId && state.current.model === channel.modelId)

  /**
   * Commit a model on the channel already in use, else its primary.
   * @param model - the logical model to run.
   */
  const commitModel = (model: LogicalModel): void => {
    const target = activeChannelOf(model) ?? model.channels[0]
    if (target === undefined) return
    choose({ provider: target.providerId, model: target.modelId })
  }

  /** The model whose channels the channel pane lists. */
  const shownModel = shownFamily?.models.find(model => model.name === channelModel)

  /** Catalog load status, shared by the panes that can be looking at a stale list. */
  const loadFeedback = (
    <>
      {state.status === 'loading' && <div className={css.status}>{t('status.loading')}</div>}
      {state.error !== null && lastActionRef.current === 'load' && (
        <div className={css.error}>
          <span>{t('error.action', { message: state.error })}</span>
          <button type="button" className={css.retry} onClick={reload}>{t('retry')}</button>
        </div>
      )}
      {state.failures.map(failure => (
        <div className={css.warning} key={failure.id}>
          <span>{t('warning.groupLoad', { name: failure.name, message: failure.message })}</span>
          <button type="button" className={css.retry} onClick={reload}>{t('retry')}</button>
        </div>
      ))}
    </>
  )

  /**
   * One model row: picking it commits the model on the channel already in use,
   * else its primary. The channel step is a separate control on the right, and
   * it only exists when there is more than one channel to move between — the
   * common case costs one click and never mentions channels at all.
   * @param model - the logical model this row stands for.
   * @param family - the family it belongs to (the row's key and the channel pane's crumb).
   * @returns the row.
   */
  const modelRow = (model: LogicalModel, family: ModelFamily) => {
    const primary = model.channels[0]
    /* v8 ignore next -- foldCatalog only creates a model when a channel served it. */
    if (primary === undefined) return null
    const active = activeChannelOf(model)
    const switchable = model.channels.length > 1
    return (
      <div className={css.modelRow} key={`${family.key}/${model.name}`}>
        <button
          ref={itemRef()}
          type="button"
          role="menuitemradio"
          aria-checked={active !== undefined}
          className={clsx(css.option, active !== undefined && css.selected)}
          title={model.name}
          disabled={locked || busy}
          onClick={() => { commitModel(model) }}
        >
          <span className={css.optionCopy}>
            <span className={css.modelName}>{model.name}</span>
            {/* The channel is named only when it is worth knowing: the row is
              * the one in use AND another channel could have served it. */}
            {active !== undefined && switchable && (
              <span className={css.channelHint}>{active.label}</span>
            )}
          </span>
          <span className={css.check}>{active !== undefined ? <IconCheckOutline16 /> : null}</span>
        </button>
        {switchable && (
          <button
            ref={itemRef()}
            type="button"
            role="menuitem"
            className={css.channelStep}
            aria-label={t('menu.changeChannel', { model: model.name })}
            title={t('menu.changeChannel', { model: model.name })}
            disabled={locked || busy}
            onClick={() => {
              setFamilyKey(family.key)
              setChannelModel(model.name)
              drill('channel')
            }}
          >
            <IconChevronRightOutline14 />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={rootRef} className={css.root} onKeyDown={onRootKeyDown} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={css.trigger}
        aria-label={triggerAria}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        title={triggerLabel}
        disabled={locked}
        onClick={() => {
          if (open) {
            close()
          } else {
            show()
          }
        }}
      >
        <IconDataOutline16 className={css.triggerIcon} size={16} />
        <span className={css.triggerLabel}>{modelLabel}</span>
        <IconChevronDownOutline14 className={clsx(css.chevron, open && css.chevronOpen)} />
      </button>

      {reasoning !== undefined && <button
        ref={effortTriggerRef}
        type="button"
        className={clsx(css.trigger, css.effortTrigger)}
        aria-label={t('effort.trigger', { effort: effortLabel ?? '' })}
        aria-haspopup="menu"
        aria-expanded={open && pane === 'effort'}
        disabled={locked || busy}
        onClick={() => {
          if (open && pane === 'effort') { close(); return }
          activeTriggerRef.current = effortTriggerRef.current
          paneFocus.current = 'move'
          setPane('effort')
          setOpen(true)
          reload()
        }}
      >
        <span>{effortLabel}</span><IconChevronDownOutline14 />
      </button>}

      {/* Portaled to body (Menu primitive's portal mode) so the sidebar and
          column overflow clips cannot crop the card; synthetic events still
          bubble through this React subtree, keeping onKeyDown/onBlur live. */}
      {open && createPortal(
        <div
          ref={menuRef}
          id={`${id}-menu`}
          className={css.menu}
          style={menuPos ?? MEASURE_STYLE}
          role="menu"
          aria-label={t('menu.aria')}
          aria-busy={state.status === 'loading' || busy}
        >
          {pane === 'family' && (
            <>
              <input ref={searchRef} className={css.search} autoFocus
                aria-label={t('search.models')} placeholder={t('search.models')}
                value={query}
                onKeyDown={(event) => {
                  // Enter settles the first hit, so a known name is typed and
                  // committed without ever leaving the keyboard. IME
                  // confirmation is not a submission.
                  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
                  const first = hits[0]
                  if (first === undefined) return
                  event.preventDefault()
                  commitModel(first.model)
                }}
                onChange={(event) => { setQuery(event.target.value) }} />
              {loadFeedback}
              <div className={clsx(css.groups, 'scrollable')}>
                {/* Typing skips the family step: the query lists models
                  * directly, so a name the operator already knows costs one
                  * field and one Enter. An empty query lists the families. */}
                {query.trim() === ''
                  ? families.map(family => (
                    <button ref={itemRef()} type="button" role="menuitem" className={css.cell}
                      key={family.key} disabled={locked || busy}
                      onClick={() => { setFamilyKey(family.key); drill('model') }}>
                      <span className={css.cellLabel}>{family.label}</span>
                      <span className={css.cellValue}>
                        {t('family.count', { count: String(family.models.length) })}
                      </span>
                      <IconChevronRightOutline14 className={css.cellChevron} />
                    </button>
                  ))
                  : hits.map(hit => modelRow(hit.model, hit.family))}
              </div>
              {state.status === 'ready' && families.length === 0 && (
                <div className={css.empty}>{t('empty.models')}</div>
              )}
              {state.current !== null && (
                <button ref={itemRef()} type="button" role="menuitem" className={css.cell}
                  disabled={locked || busy} onClick={useAsDefault}>
                  <span className={css.cellLabel}>{t('menu.makeDefault')}</span>
                </button>
              )}
            </>
          )}

          {pane === 'model' && shownFamily !== undefined && (
            <>
              <button ref={itemRef()} type="button" role="menuitem" className={css.cell}
                onClick={() => { back('model') }}>
                <span className={css.cellLabel}>{t('menu.backToFamilies')}</span>
              </button>
              {loadFeedback}
              <div className={clsx(css.groups, 'scrollable')}>
                {shownFamily.models.map(model => modelRow(model, shownFamily))}
              </div>
            </>
          )}

          {pane === 'channel' && shownModel !== undefined && (
            <>
              <button ref={itemRef()} type="button" role="menuitem" className={css.cell}
                onClick={() => { back('channel') }}>
                <span className={css.cellLabel}>
                  {t('menu.backToFamily', { family: shownFamily?.label ?? '' })}
                </span>
              </button>
              <div className={css.groupTitle}>{t('menu.changeChannel', { model: shownModel.name })}</div>
              {shownModel.channels.map((channel) => {
                const selected = state.current?.provider === channel.providerId
                  && state.current.model === channel.modelId
                return (
                  <button
                    ref={itemRef()}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    className={clsx(css.option, selected && css.selected)}
                    key={channel.providerId}
                    disabled={locked || busy}
                    onClick={() => { choose({ provider: channel.providerId, model: channel.modelId }) }}
                  >
                    <span className={css.optionCopy}>
                      <span className={css.modelName}>{channel.label}</span>
                      {channel.fallback && <span className={css.channelTag}>{t('channel.fallback')}</span>}
                    </span>
                    <span className={css.check}>
                      {selected ? <IconCheckOutline16 /> : null}
                    </span>
                  </button>
                )
              })}
            </>
          )}

          {pane === 'effort' && (
            <>
              {state.error !== null && lastActionRef.current === 'load' && (
                <div className={css.error}>
                  <span>{t('error.action', { message: state.error })}</span>
                  <button type="button" className={css.retry} onClick={reload}>{t('action.reload')}</button>
                </div>
              )}
              {effortChoices.length === 0
                ? <div className={css.empty}>{t('empty.efforts')}</div>
                : effortChoices.map(level => (
                  <button
                    ref={itemRef()}
                    type="button"
                    role="menuitemradio"
                    aria-checked={effectiveEffort === level.effort}
                    className={clsx(css.option, effectiveEffort === level.effort && css.selected)}
                    key={level.key}
                    disabled={locked || busy}
                    onClick={() => { chooseEffort(level.effort) }}
                  >
                    <span className={css.optionCopy}>
                      <span className={css.modelName}>{level.label}</span>
                    </span>
                    <span className={css.check}>
                      {effectiveEffort === level.effort ? <IconCheckOutline16 /> : null}
                    </span>
                  </button>
                ))}
            </>
          )}
        </div>,
        document.body,
      )}
      {toast !== null && (
        <Toast
          key={toast.seq}
          text={toast.text}
          icon={<IconWarningOutline16 />}
          anchor={rootRef.current?.closest<HTMLElement>('[data-composer-card]') ?? null}
          onDone={() => { setToast(null) }}
        />
      )}
    </div>
  )
}
