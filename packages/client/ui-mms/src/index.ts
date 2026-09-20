/**
 * MMS Harness UI plugin, node half. Besides giving Loader a host-side row for
 * the browser half shipped through `exports["./client"]`, it owns the one Host
 * capabilities this overlay needs and upstream has no seam for: ranking
 * project folders for the folder dialog's search box (`ctx.remote.mmsProjects`)
 * and driving remote access from Settings (`ctx.remote.mmsRemote`).
 */

import { Context } from '@deepseek-ai/cordis'
// Type-only: the service merge declaring `ctx.typert.register`, and the
// manifest shape the generated face exports.
import type {} from '@deepseek-ai/dsh-typert-registry'
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry/types'
import { MmsProjectSearchController } from './projects.ts'
import { MmsRemoteAccessController, type Config } from './remote-access.ts'

export { MmsProjectSearchController } from './projects.ts'
export { MmsRemoteAccessController } from './remote-access.ts'
export type { Config } from './remote-access.ts'

/**
 * Host plugin body.
 *
 * The controller alone is not enough: a Remote verb only reaches the wire once
 * its typert manifest is registered. `typert-loader` does that automatically
 * for packages it can resolve through the plugin-package resolver, but this
 * overlay is installed BESIDE the pinned runtime (its Loader row names a file
 * path, not a package), so it is outside that resolver and registers its own
 * manifest here. Without this the search box answers nothing, silently.
 *
 * Both steps are scoped and failure-tolerant: a Host without `typert` still
 * gets the overlay's brand, model seat and folder dialog.
 * @param ctx - Host context these namespaces register on.
 * @param config - the installation the remote-access switch drives.
 */
export function apply(ctx: Context, config: Config = {}): void {
  ctx.plugin(MmsProjectSearchController)
  ctx.plugin(MmsRemoteAccessController, config)
  ctx.inject(['typert'], (scope: Context) => {
    scope.effect(() => {
      let dispose: (() => void) | undefined
      let disposed = false
      // Self-referenced so the generated face stays out of the source tree;
      // deferred so a build without it cannot keep the overlay from loading.
      void (import('@deepseek-ai/dsh-client-ui-mms/typert') as Promise<{ TYPERT: TypertContribution }>).then((face) => {
        if (disposed) return
        dispose = scope.typert.register(face.TYPERT)
      }).catch(() => { /* the folder search and the remote switch degrade to absent */ })
      return () => {
        disposed = true
        dispose?.()
      }
    }, 'ui-mms: wire manifest')
  })
}
