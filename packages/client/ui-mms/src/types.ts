/**
 * Wire types of this package's Remote namespace, on their own public subpath
 * so the Remote boundary can name them without pulling in the node half.
 * @module @deepseek-ai/dsh-client-ui-mms/types
 */

/** One directory the folder dialog may open, named by its own basename. */
export interface ProjectMatch {
  /** Folder name shown as the row's title. */
  name: string
  /** Absolute path the row opens. */
  path: string
}
