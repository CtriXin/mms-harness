/**
 * Host owner of the MMS catalog Remote namespace.
 *
 * MMS ranks each (model, channel) pair: rank 0 is the channel that model
 * should normally use, and the rest are its fallbacks. That ranking used to
 * reach the browser inside the provider's display name — a `· 备用` suffix the
 * seat parsed back out — which only worked while every provider held exactly
 * one model. Providers are now one per wire face and hold many, so the
 * ranking travels as what it is: data, read from the same `routes.json` the
 * adapter writes.
 *
 * Read-only, and absent rather than fatal: a Host without the file answers an
 * empty list, and the seat falls back to catalog order.
 */

import { readFile } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
// The Remote boundary names its wire types from the package's public subpath.
import type { RouteRank } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host owner of the `mmsCatalog` Remote namespace. */
    mmsCatalog: MmsCatalogController
  }
}

/** Beyond this the file is not a route table; answering nothing beats parsing it. */
const MAX_BYTES = 4 << 20

export class MmsCatalogController extends TypertRemoteService {
  /** @param ctx - Host context this namespace registers on. */
  constructor(ctx: Context) {
    super(ctx, 'mmsCatalog', { namespace: 'mmsCatalog' })
  }

  /**
   * How MMS ranks each model's channels.
   *
   * `run.py` names the route table in `MMS_DSH_ROUTES`; the same file the
   * adapter wrote when it built the providers, so the ranks always describe
   * the catalog the seat is looking at.
   * @returns one row per approved route, or an empty list when unavailable.
   */
  @Remote('ranks')
  async ranks(): Promise<RouteRank[]> {
    const path = process.env['MMS_DSH_ROUTES']
    if (path === undefined || path === '') return []
    let parsed: unknown
    try {
      const text = await readFile(path, 'utf8')
      if (text.length > MAX_BYTES) return []
      parsed = JSON.parse(text)
    } catch {
      return []
    }
    const rows = (parsed as { routes?: unknown }).routes
    if (!Array.isArray(rows)) return []
    const ranks: RouteRank[] = []
    for (const row of rows as Record<string, unknown>[]) {
      const model = row['logical_model']
      const provider = row['provider']
      const rank = row['rank']
      if (typeof model === 'string' && typeof provider === 'string' && Number.isInteger(rank)) {
        ranks.push({ model, provider, rank: rank as number })
      }
    }
    return ranks
  }
}
