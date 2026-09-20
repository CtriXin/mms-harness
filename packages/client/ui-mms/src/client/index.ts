/**
 * MMS Harness presentation overlay, browser half.
 *
 * Upstream DSH ships each surface this package changes as a single slot cell
 * with a default occupant. Instead of editing those packages in place, this
 * plugin registers its own occupant for the same cell at a lower priority
 * (lowest renders), so the upstream packages stay byte-identical and keep
 * every service they own:
 *
 * - `sidebar.brand.name`: the product name instead of "DSH Local Build".
 * - `conversation.input.model`: model search and an always-visible effort
 *   control, over the SAME per-session `ctx.modelDirectories` directory that
 *   ui-model-selection owns (the /model popup keeps working unchanged).
 * - both directory-flow holes: the project-first folder dialog (search the
 *   host's existing projects, or type a path), over `ctx.uiWorkspace`.
 *
 * When this package is not loaded, every cell falls back to upstream.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ModelSelection } from '@deepseek-ai/dsh-api-session-controller/types'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
// Type-only: the ctx.modelDirectories service merge and the seat's injected face.
// Type-only: the SlotMap merges declaring the seats and holes filled here.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// The node half's `mmsProjects` Remote namespace (self-reference to this
// package's generated remote face): the import carries both the declaration
// merge and the contribution value mounted below.
import mmsProjectsRemote from '@deepseek-ai/dsh-client-ui-mms/remote'
import { MmsBrandName } from './Brand.tsx'
import { BrowseDirectoryFlow, type BrowseFlowInjected } from './flow.ts'
import { ModelSelect, type MmsModelSeatInjected } from './ModelSelect.tsx'
import { en as modelEn, zh as modelZh, type ModelKey } from './model-locales.ts'
import { en as mmsEn, zh as mmsZh, projectsEn, projectsZh, type MmsKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The overlay's own copy (brand). */
    mms: MmsKey
    /** The model seat's copy: upstream's model keys plus search and effort. */
    'mms-model': ModelKey
  }
}

/** Shadowing rank for every cell this package occupies (upstream default is 0). */
const PRIORITY = -10

const NS = 'mms'
/** The dialog's namespace stays undeclared so its `t` is the plain Translate the dialog takes. */
const PROJECTS_NS = 'mms-projects'
const MODEL_NS = 'mms-model'
const FLOW_HOLES = ['conversation.hero.workspace.directoryFlow', 'sidebar.workspaces.directoryFlow'] as const

/** Required services; `modelDirectories` is waited on only by the model seat. */
export const inject = ['slots', 'locale', 'sessions', 'uiWorkspace']

/**
 * The model seat's scope. `modelDirectories` methods run behind cordis's
 * caller tracker, so the calling scope must also hold every service the
 * resolver itself injects (upstream ModelDirectoryResolver.inject), or the
 * entry crashes at render and the cell silently falls back to upstream.
 */
const MODEL_SEAT_INJECT = ['slots', 'modelDirectories', 'sessions', 'remote', 'remote.session', 'remote.commands']

/**
 * Client plugin body: register the dictionaries, then shadow each cell as
 * soon as its declaration exists.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh: mmsZh, en: mmsEn }), 'ui-mms: dictionaries')
  ctx.effect(() => ctx.locale.register(MODEL_NS, { zh: modelZh, en: modelEn }), 'ui-mms: model dictionaries')
  ctx.effect(() => {
    // Untyped per-locale form (the namespace is outside the merge table); the
    // pair lands as a unit so a rival owner cannot leave one locale squatted.
    const disposers: (() => void)[] = []
    try {
      for (const [locale, dict] of [['zh', projectsZh], ['en', projectsEn]] as const) {
        disposers.push(ctx.locale.register(PROJECTS_NS, locale, dict))
      }
    } catch (error) {
      for (const dispose of disposers.reverse()) dispose()
      throw error
    }
    return () => { for (const dispose of disposers) dispose() }
  }, 'ui-mms: project dialog dictionaries')

  // `@deepseek-ai/dsh-api-remotes/client` mounts a FIXED list of namespaces,
  // and that assembly is an upstream file. Rather than edit it, this overlay
  // mounts its own contribution here — the fork adds a namespace without
  // touching a file upstream keeps changing.
  //
  // It lives in a scope that INJECTS `remote`, and so does the call itself:
  // cordis tracks the caller, so reading `ctx.remote` from the root scope
  // (which does not inject it) throws `cannot get property "remote" without
  // inject`. The dialog therefore calls through this slot, which is empty
  // until the namespace is live — a Host without `remote` still gets the
  // brand, the model seat and the folder dialog's other paths.
  const rankProjects: { call: BrowseFlowInjected['searchProjects'] } = { call: async () => [] }
  ctx.inject(['remote'], (scope: ClientContext) => {
    scope.effect(() => {
      let dispose: (() => Promise<void>) | undefined
      let disposed = false
      // Through a resolved promise so a Host whose `remote` predates `$mount`
      // throws INTO this chain instead of past it: the overlay must degrade,
      // never take the client down with an unhandled rejection.
      void Promise.resolve().then(() => scope.remote.$mount(mmsProjectsRemote)).then((settle) => {
        // Disposal can win the race against the mount; the late arrival must
        // still be released rather than left registered on a dead scope.
        if (disposed) return settle()
        dispose = settle
        return undefined
      }).catch((error: unknown) => {
        // Degrading silently here cost hours once: the search box simply
        // answered nothing and no surface said why. The folder dialog still
        // works without the namespace, but the reason is now findable.
        console.error('[mms] project search namespace unavailable:', error)
      })
      return () => {
        disposed = true
        void dispose?.()
      }
    }, 'ui-mms: project search namespace')
  })

  // The namespace itself must be injected too — cordis tracks `remote.<ns>`
  // properties, not just the root service — and it only exists once the mount
  // above lands. A SEPARATE inject waits for exactly that: nesting it inside
  // the mounting scope would make the mount wait on its own result.
  ctx.inject(['remote', 'remote.mmsProjects'], (ready: ClientContext) => {
    ready.effect(() => {
      const previous = rankProjects.call
      rankProjects.call = async (query, signal) => {
        try {
          const result = await ready.remote.mmsProjects.search(query, signal)
          if (result.ok) return result.value
          console.error('[mms] project search failed:', result.error)
          return []
        } catch (error: unknown) {
          console.error('[mms] project search threw:', error)
          return []
        }
      }
      return () => { rankProjects.call = previous }
    }, 'ui-mms: project search call')
  })

  ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({
    name: 'sidebar.brand.name', priority: PRIORITY, locale: NS,
  }, MmsBrandName))

  const t = ctx.locale.bind(PROJECTS_NS)
  const injected = (): BrowseFlowInjected => ({
    listDirectory: (path, signal) => ctx.uiWorkspace.listDirectory(path, signal),
    createDirectory: (path, name) => ctx.uiWorkspace.createDirectory(path, name),
    // Frecency ranking is an enhancement over the dialog's own project filter,
    // never a precondition: a Host without the node half (or without zoxide)
    // answers nothing and the dialog keeps its other paths. That is also why
    // `mmsProjects` is not in this plugin's inject — an absent namespace must
    // not take the brand and model seats down with it.
    searchProjects: (query, signal) => rankProjects.call(query, signal),
    t,
  })
  // One transactional pair, like upstream's browse package: both holes or neither.
  ctx.slots.inject(FLOW_HOLES[0], () => ctx.slots.inject(FLOW_HOLES[1], function* () {
    for (const name of FLOW_HOLES) {
      yield ctx.slots.register({ name, inject: injected, priority: PRIORITY }, BrowseDirectoryFlow)
    }
  }))

  ctx.inject(MODEL_SEAT_INJECT, (scope: ClientContext) => {
    const models = scope.modelDirectories
    const sessions = scope.sessions
    scope.slots.inject('conversation.input.model', () => scope.slots.register({
      name: 'conversation.input.model',
      locale: MODEL_NS,
      priority: PRIORITY,
      inject: (sessionId): MmsModelSeatInjected => {
        const directory = models.directoryFor(sessionId)
        const available = sessions.subagentAddress(sessionId) === undefined
        return {
          available,
          directory: directory.store,
          load: () => {
            if (available) directory.load().catch(() => { /* surfaced on the store */ })
          },
          select: (selection: ModelSelection) => available
            ? directory.select(selection)
            : Promise.resolve(undefined),
          // Runs the node half's /default-model (mms/adapter/plugin-default-model.mjs), like
          // ui-plan runs /plan off: in-session switches no longer change the default (C01.06).
          makeDefault: async (selection: ModelSelection) => {
            try {
              const result = await scope.remote.commands.execute(sessionId, `/default-model ${JSON.stringify(selection)}`, [])
              if (!result.ok) return { ok: false, text: result.error.message }
              const outcome = result.value?.result
              return { ok: outcome?.kind === 'success', text: outcome?.text ?? '' }
            } catch (error) {
              return { ok: false, text: error instanceof Error ? error.message : String(error) }
            }
          },
        }
      },
    }, ModelSelect))
  })
}
