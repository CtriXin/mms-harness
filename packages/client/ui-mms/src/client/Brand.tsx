/** The sidebar's product name, with the same build badge upstream's fallback shows. */
import type { ReactElement } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './Brand.module.css'

/** `<version>-<commit>[-dirty]` from the public build environment, if this is a versioned build. */
function buildVersion(): string | undefined {
  const version = process.env.DSH_CLIENT_VERSION
  if (version === undefined) return undefined
  const commit = process.env.DSH_CLIENT_COMMIT_HASH
  return version
    + (commit === undefined ? '' : `-${commit}`)
    + (process.env.DSH_CLIENT_GIT_DIRTY === 'true' ? '-dirty' : '')
}

/**
 * Occupant of `sidebar.brand.name`.
 * @param props - the `mms` namespace translate seat.
 * @returns the name, stacked over the build badge when the build is versioned.
 */
export function MmsBrandName({ t }: PropsLocale<'mms'>): ReactElement {
  const version = buildVersion()
  if (version === undefined) return <span className={css.name}>{t('brand.name')}</span>
  return (
    <span className={css.stack}>
      <span className={css.title}>{t('brand.name')}</span>
      <span className={css.version}>{version}</span>
    </span>
  )
}
