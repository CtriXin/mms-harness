// @vitest-environment jsdom
/**
 * ui-mms browser half on a real cordis Context and SlotRegistry: each cell it
 * targets already has an upstream-style occupant at the default priority, and
 * the overlay must win every one of them, give each back when its fiber
 * leaves, and drive the upstream services rather than its own copies.
 */
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { DirectoryListing } from '@deepseek-ai/dsh-api-remotes/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { usePinnedBrowserLanguages } from '@deepseek-ai/dsh-client-test-runtime'
import type { ModelSelectInjected } from '@deepseek-ai/dsh-client-ui-model-selection/client'
// Test-only value import: the upstream resolver's declared dependencies.
import { ModelDirectoryResolver } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import { apply, inject } from '../src/client/index.ts'
import { MmsBrandName } from '../src/client/Brand.tsx'
import { apply as nodeApply } from '../src/index.ts'

usePinnedBrowserLanguages('zh-CN')
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

const CELLS = {
  'sidebar.brand.name': 'root',
  'conversation.input.model': 'session',
  'conversation.hero.workspace.directoryFlow': 'root',
  'sidebar.workspaces.directoryFlow': 'root',
} as const
type Cell = keyof typeof CELLS

const HOME = '/home/u'
const listing: DirectoryListing = { path: HOME, home: HOME, crumbs: [], entries: [], truncated: false }

function upstream(): null { return null }

async function bench({ withModels = true } = {}) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.provide('locale', new LocaleRuntime(ctx))
  const listDirectory = vi.fn(async (): Promise<DirectoryListing> => listing)
  const createDirectory = vi.fn(async (path: string, name: string) => `${path}/${name}`)
  ctx.provide('uiWorkspace', { listDirectory, createDirectory } as never)
  ctx.provide('sessions', { subagentAddress: (id: string) => id === 'child' ? { parent: 'root' } : undefined } as never)
  const directory = {
    store: { getSnapshot: () => ({}), subscribe: () => () => {} },
    load: vi.fn(async () => ({})),
    select: vi.fn(async () => ({ ok: true, value: undefined })),
  }
  const directoryFor = vi.fn(() => directory)
  if (withModels) {
    ctx.provide('remote', {} as never)
    ctx.provide('remote.session', {} as never)
    ctx.provide('modelDirectories', { directoryFor } as never)
  }
  const slots = ctx.get('slots') as SlotRegistry
  slots.register({
    name: 'root',
    children: Object.fromEntries(Object.entries(CELLS).map(([name, scope]) => [name, { kind: 'single', scope }])),
  } as never, () => null)
  // The shipped occupants: default priority, as upstream registers them.
  for (const name of Object.keys(CELLS)) slots.register({ name } as never, upstream)
  const winner = (name: Cell) => slots.entriesOfSlot(name)[0]!
  return { ctx, slots, winner, listDirectory, createDirectory, directory, directoryFor }
}

describe('ui-mms client half', () => {
  it('declares the services it drives', () => {
    expect(inject).toEqual(['slots', 'locale', 'sessions', 'uiWorkspace'])
  })

  it('shadows every upstream occupant and gives each cell back when it leaves', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    for (const name of Object.keys(CELLS) as Cell[]) {
      expect(b.slots.entries(name)).toHaveLength(2)
      expect(b.winner(name).component).not.toBe(upstream)
    }
    await fiber.dispose()
    for (const name of Object.keys(CELLS) as Cell[]) {
      expect(b.slots.entries(name)).toHaveLength(1)
      expect(b.winner(name).component).toBe(upstream)
    }
  })

  it('the model seat scope holds every service the upstream resolver calls through', async () => {
    // Reproduces the live crash: without these the resolver throws
    // "cannot get property remote.session without inject" at render.
    const b = await bench()
    const scopes: string[][] = []
    const original = b.ctx.inject.bind(b.ctx)
    ;(b.ctx as { inject: unknown }).inject = (deps: string[], fn: never) => { scopes.push(deps); return original(deps as never, fn) }
    apply(b.ctx)
    const seat = scopes.find(deps => deps.includes('modelDirectories'))!
    for (const dep of ModelDirectoryResolver.inject) expect(seat).toContain(dep)
  })

  it('waits for the upstream model service instead of shipping its own', async () => {
    const b = await bench({ withModels: false })
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    expect(b.winner('conversation.input.model').component).toBe(upstream)
    expect(b.winner('sidebar.brand.name').component).not.toBe(upstream)
  })

  it('drives the shared per-session directory, and stays inert for subagent sessions', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const face = (id: string) => (b.winner('conversation.input.model').inject as unknown as (id: string) => ModelSelectInjected)(id)
    const main = face('s1')
    expect(b.directoryFor).toHaveBeenCalledWith('s1')
    expect(main.available).toBe(true)
    expect(main.directory).toBe(b.directory.store)
    main.load()
    expect(b.directory.load).toHaveBeenCalledOnce()
    await main.select({ provider: 'p', model: 'm', reasoningEffort: 'low' })
    expect(b.directory.select).toHaveBeenCalledWith({ provider: 'p', model: 'm', reasoningEffort: 'low' })

    const child = face('child')
    expect(child.available).toBe(false)
    child.load()
    await expect(child.select({ provider: 'p', model: 'm' })).resolves.toBeUndefined()
    expect(b.directory.load).toHaveBeenCalledOnce()
    expect(b.directory.select).toHaveBeenCalledOnce()
  })

  it('a failed catalog load stays on the store, not an unhandled rejection', async () => {
    const b = await bench()
    b.directory.load.mockRejectedValueOnce(new Error('offline'))
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    ;(b.winner('conversation.input.model').inject as unknown as (id: string) => ModelSelectInjected)('s1').load()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(b.directory.load).toHaveBeenCalledOnce()
  })

  it('the project dialog reaches the upstream workspace service with its own copy', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    for (const name of ['conversation.hero.workspace.directoryFlow', 'sidebar.workspaces.directoryFlow'] as const) {
      const face = (b.winner(name).inject as () => {
        listDirectory: (path?: string) => Promise<DirectoryListing>
        createDirectory: (path: string, name: string) => Promise<string>
        t: (key: string) => string
      })()
      await expect(face.listDirectory()).resolves.toBe(listing)
      await expect(face.createDirectory(HOME, 'x')).resolves.toBe(`${HOME}/x`)
      expect(face.t('browser.title')).toBe('找到你的项目')
      expect(face.t('browser.searchProjects')).toBe('搜索项目名或输入文件夹路径')
    }
  })

  it('registers the model copy upstream lacks under its own namespace', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const locale = b.ctx.get('locale') as LocaleRuntime
    const t = locale.bind('mms-model') as (key: string, params?: Record<string, string>) => string
    expect(t('search.models')).toBe('搜索模型或通道')
    expect(t('effort.trigger', { effort: '高' })).toBe('选择推理等级，当前 高')
    expect((locale.bind('mms') as (key: string) => string)('brand.name')).toBe('MMS Harness')
  })
})

describe('MmsBrandName', () => {
  const t = (key: string): string => key === 'brand.name' ? 'MMS Harness' : key

  it('shows the product name alone on an unversioned build', () => {
    vi.stubEnv('DSH_CLIENT_VERSION', undefined)
    render(<MmsBrandName t={t as never} />)
    expect(screen.getByText('MMS Harness')).toBeTruthy()
    expect(document.body.textContent).toBe('MMS Harness')
  })

  it('stacks the name over the version-commit-dirty badge', () => {
    vi.stubEnv('DSH_CLIENT_VERSION', '0.1.6')
    vi.stubEnv('DSH_CLIENT_COMMIT_HASH', 'abc1234')
    vi.stubEnv('DSH_CLIENT_GIT_DIRTY', 'true')
    render(<MmsBrandName t={t as never} />)
    expect(screen.getByText('MMS Harness')).toBeTruthy()
    expect(screen.getByText('0.1.6-abc1234-dirty')).toBeTruthy()
  })

  it('omits a missing commit and a clean tree', () => {
    vi.stubEnv('DSH_CLIENT_VERSION', '0.1.6')
    vi.stubEnv('DSH_CLIENT_COMMIT_HASH', undefined)
    vi.stubEnv('DSH_CLIENT_GIT_DIRTY', 'false')
    render(<MmsBrandName t={t as never} />)
    expect(screen.getByText('0.1.6')).toBeTruthy()
  })
})

describe('ui-mms node half', () => {
  it('the node apply is an inert loader seat', () => {
    expect(() => { nodeApply() }).not.toThrow()
  })
})
