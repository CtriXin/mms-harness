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
import type { ModelSelectInjected } from '@deepseek-ai/dsh-client-ui-model-selection/client'
// Type-only: the SlotMap merges declaring the seats and holes filled here.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { MmsBrandName } from './Brand.tsx'
import { BrowseDirectoryFlow, type BrowseFlowInjected } from './flow.ts'
import { ModelSelect } from './ModelSelect.tsx'
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
const MODEL_SEAT_INJECT = ['slots', 'modelDirectories', 'sessions', 'remote', 'remote.session']

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

  ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({
    name: 'sidebar.brand.name', priority: PRIORITY, locale: NS,
  }, MmsBrandName))

  const t = ctx.locale.bind(PROJECTS_NS)
  const injected = (): BrowseFlowInjected => ({
    listDirectory: (path, signal) => ctx.uiWorkspace.listDirectory(path, signal),
    createDirectory: (path, name) => ctx.uiWorkspace.createDirectory(path, name),
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
      inject: (sessionId): ModelSelectInjected => {
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
        }
      },
    }, ModelSelect))
  })
}
