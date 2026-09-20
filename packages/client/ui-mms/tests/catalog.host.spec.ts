/**
 * The node half's route ranking: the ordering that used to ride in a
 * provider's display name and now travels as data.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { MmsCatalogController } from '../src/catalog.ts'

let root: string
const roots: Context[] = []
const originalRoutes = process.env['MMS_DSH_ROUTES']

/** A controller on its own root context, disposed with the case. */
function controller() {
  const ctx = new Context()
  roots.push(ctx)
  return new MmsCatalogController(ctx)
}

/** Point the controller at a route table, the way `run.py` does. */
async function routes(body: string) {
  const path = join(root, 'routes.json')
  await writeFile(path, body)
  process.env['MMS_DSH_ROUTES'] = path
  return path
}

beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'mms-catalog-')) })
afterEach(async () => {
  await Promise.all(roots.splice(0).map(ctx => ctx.fiber.dispose()))
  if (originalRoutes === undefined) delete process.env['MMS_DSH_ROUTES']
  else process.env['MMS_DSH_ROUTES'] = originalRoutes
  await rm(root, { recursive: true, force: true })
})

describe('ranks', () => {
  it('reads the ranking the adapter wrote beside the providers', async () => {
    await routes(JSON.stringify({ routes: [
      { logical_model: 'MiniMax-M3', provider: 'mms-tokyo', rank: 0, base_url: 'x' },
      { logical_model: 'MiniMax-M3', provider: 'mms-company', rank: 1 },
    ] }))
    expect(await controller().ranks()).toEqual([
      { model: 'MiniMax-M3', provider: 'mms-tokyo', rank: 0 },
      { model: 'MiniMax-M3', provider: 'mms-company', rank: 1 },
    ])
  })

  it('answers nothing rather than failing when there is no route table', async () => {
    // A Host started another way still gets the seat; it just keeps catalog order.
    delete process.env['MMS_DSH_ROUTES']
    expect(await controller().ranks()).toEqual([])
    process.env['MMS_DSH_ROUTES'] = join(root, 'absent.json')
    expect(await controller().ranks()).toEqual([])
    await routes('not json at all')
    expect(await controller().ranks()).toEqual([])
    await routes(JSON.stringify({ routes: 'not a list' }))
    expect(await controller().ranks()).toEqual([])
  })

  it('drops a row that cannot name a model, a provider and a rank', async () => {
    // A half-written row must not become a rank 0 that outranks a real primary.
    await routes(JSON.stringify({ routes: [
      { logical_model: 'ok', provider: 'mms-a', rank: 0 },
      { logical_model: 'no-provider', rank: 0 },
      { logical_model: 'no-rank', provider: 'mms-b' },
      { logical_model: 'string-rank', provider: 'mms-c', rank: '0' },
    ] }))
    expect(await controller().ranks()).toEqual([{ model: 'ok', provider: 'mms-a', rank: 0 }])
  })
})
