/**
 * Host owner of the MMS project-search Remote namespace.
 *
 * The folder dialog can already filter the workspaces the operator has added
 * before; this namespace answers the other half of the same keystroke — a
 * folder visited from a shell but never added here. zoxide already keeps that
 * frecency ranking, so the search reads it instead of scanning the
 * filesystem: typing `down` must not walk the home directory.
 *
 * Read-only by construction. The query runs through `execFile` (never a
 * shell), behind a short timeout, and a host without zoxide answers an empty
 * list rather than an error — the dialog's other paths stay usable. Nothing
 * here writes zoxide's database.
 */

import { execFile } from 'node:child_process'
import { access, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { homedir } from 'node:os'
import { basename, delimiter, isAbsolute, join, resolve } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
// The Remote boundary names its wire types from the package's public subpath.
import type { ProjectMatch } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host owner of the `mmsProjects` Remote namespace. */
    mmsProjectSearch: MmsProjectSearchController
  }
}

/** Locations a Homebrew or system install lands in when PATH is not inherited. */
const FALLBACK_BINARIES = ['/opt/homebrew/bin/zoxide', '/usr/local/bin/zoxide'] as const

/** A query beyond this length is a paste accident, not a folder search. */
const MAX_QUERY = 200

/** Rows the dialog can show before scrolling stops being a shortcut. */
const MAX_ROWS = 40

/** zoxide must answer within this window or the keystroke is stale anyway. */
const QUERY_TIMEOUT_MS = 2_000

/**
 * Locate a zoxide binary without running a shell.
 * @returns the executable's path, or null when this host has no zoxide.
 */
async function findZoxide(): Promise<string | null> {
  const fromPath = String(process.env['PATH'] ?? '').split(delimiter)
    .filter((entry: string) => entry !== '').map((directory: string) => join(directory, 'zoxide'))
  // PATH first (the operator's own install wins), then the two locations a
  // Homebrew or system install sits in when the Host inherited no PATH.
  for (const candidate of [...fromPath, ...FALLBACK_BINARIES]) {
    try {
      await access(candidate, constants.X_OK)
      return candidate
    } catch { /* keep looking */ }
  }
  return null
}

/**
 * Ask zoxide for the directories matching the typed terms, newest-frecency first.
 * @param binary - the located zoxide executable.
 * @param terms - whitespace-split query terms, passed after `--`.
 * @param signal - caller lifetime; an abort kills the child.
 * @returns the raw paths zoxide ranked, or an empty list on any failure.
 */
function queryZoxide(binary: string, terms: readonly string[], signal: AbortSignal): Promise<string[]> {
  return new Promise((settle) => {
    execFile(
      binary,
      ['query', '--list', '--', ...terms],
      { timeout: QUERY_TIMEOUT_MS, signal, encoding: 'utf8', maxBuffer: 1 << 20 },
      (error: unknown, stdout: string) => {
        // A miss exits non-zero, an abort rejects, a broken install throws:
        // every one of them means "no frecency answer", never a dialog error.
        settle(error !== null ? [] : String(stdout).split('\n').filter(line => line !== ''))
      },
    )
  })
}

/**
 * Host service backing `ctx.remote.mmsProjects`.
 */
export class MmsProjectSearchController extends TypertRemoteService {
  /** @param ctx - Host context this namespace registers on. */
  constructor(ctx: Context) {
    super(ctx, 'mmsProjectSearch', { namespace: 'mmsProjects' })
  }

  /**
   * Rank the directories matching a typed query.
   *
   * An absolute path is answered as itself when it exists, so typing or
   * pasting a full path stays a direct hit; everything else is zoxide's
   * frecency order, filtered down to directories that still exist.
   * @param query - what the operator has typed.
   * @param signal - caller lifetime; superseded keystrokes abort the child.
   * @returns matching directories, frecency-first, capped for the dialog.
   */
  @Remote('search')
  async search(query: string, signal: AbortSignal): Promise<ProjectMatch[]> {
    if (query.length > MAX_QUERY || /[\u0000-\u001f]/.test(query)) {
      throw new RemoteError('gateway/bad-request', 'search a folder by name or paste its path', {})
    }
    const terms = query.trim().split(/\s+/).filter(term => term !== '')
    if (terms.length === 0) return []
    const candidates: string[] = []
    const typed = query.trim()
    if (isAbsolute(typed) || typed.startsWith('~/')) {
      candidates.push(typed.startsWith('~/') ? join(homedir(), typed.slice(2)) : typed)
    }
    const binary = await findZoxide()
    if (binary !== null) candidates.push(...await queryZoxide(binary, terms, signal))
    const rows: ProjectMatch[] = []
    const seen = new Set<string>()
    for (const candidate of candidates) {
      if (rows.length === MAX_ROWS) break
      const path = resolve(candidate)
      if (seen.has(path)) continue
      seen.add(path)
      try {
        if (!(await stat(path)).isDirectory()) continue
      } catch { continue }
      rows.push({ name: basename(path) === '' ? path : basename(path), path })
    }
    return rows
  }
}
