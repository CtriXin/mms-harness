/**
 * The node half's project search, exercised against a REAL child process: the
 * cases below put an executable named `zoxide` on PATH and assert on what the
 * controller does with its output. A mocked `execFile` would pass even if the
 * controller stopped spawning anything at all.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { realpath } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import { remoteErrorOf } from '@deepseek-ai/dsh-typert-protocol'
import { MmsProjectSearchController } from '../src/projects.ts'
import { apply } from '../src/index.ts'

const roots: Context[] = []
const originalPath = process.env['PATH']

afterEach(async () => {
  await Promise.all(roots.splice(0).map(ctx => ctx.fiber.dispose()))
  process.env['PATH'] = originalPath
})

/** A scratch tree plus a controller whose PATH holds only what a case installs. */
async function harness(): Promise<{ root: string; bin: string; search: MmsProjectSearchController }> {
  // realpath: macOS hands out /var/... symlinks for temp dirs, and the
  // controller resolves what it answers.
  const root = await realpath(await mkdtemp(join(tmpdir(), 'mms-projects-')))
  const bin = join(root, 'bin')
  await mkdir(bin)
  process.env['PATH'] = bin
  const ctx = new Context()
  roots.push(ctx)
  return { root, bin, search: new MmsProjectSearchController(ctx) }
}

/**
 * Install a fake zoxide that prints `lines` and records the argv it was given.
 * @param bin - the PATH directory to install into.
 * @param lines - stdout the fake answers with.
 * @param exitCode - process exit status (zoxide exits non-zero on a miss).
 * @returns the path of the file the fake writes its argv to.
 */
async function installZoxide(bin: string, lines: readonly string[], exitCode = 0): Promise<string> {
  const argvLog = join(bin, '..', 'argv.txt')
  const script = [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > ${JSON.stringify(argvLog)}`,
    ...lines.map(line => `printf '%s\\n' ${JSON.stringify(line)}`),
    `exit ${String(exitCode)}`,
  ].join('\n')
  const path = join(bin, 'zoxide')
  await writeFile(path, `${script}\n`)
  await chmod(path, 0o755)
  return argvLog
}

describe('mmsProjects search', () => {
  it('ranks zoxide hits, drops what no longer exists, and never runs a shell', async () => {
    const { root, bin, search } = await harness()
    const kept = join(root, 'downloads')
    const alsoKept = join(root, 'down-stream')
    await mkdir(kept)
    await mkdir(alsoKept)
    const argvLog = await installZoxide(bin, [kept, join(root, 'deleted'), alsoKept, kept])

    const rows = await search.search('down', new AbortController().signal)

    // Ranking order survives; the deleted path and the duplicate do not.
    expect(rows).toEqual([
      { name: 'downloads', path: kept },
      { name: 'down-stream', path: alsoKept },
    ])
    // The terms go after `--` as separate argv entries: no shell, no quoting.
    const { readFile } = await import('node:fs/promises')
    expect((await readFile(argvLog, 'utf8')).trim().split('\n'))
      .toEqual(['query', '--list', '--', 'down'])
  })

  it('answers an existing absolute path directly, ahead of the ranking', async () => {
    const { root, bin, search } = await harness()
    const typed = join(root, 'typed-project')
    const ranked = join(root, 'ranked')
    await mkdir(typed)
    await mkdir(ranked)
    await installZoxide(bin, [ranked])

    const rows = await search.search(typed, new AbortController().signal)

    expect(rows[0]).toEqual({ name: 'typed-project', path: typed })
  })

  it('answers nothing for a path that does not exist, instead of a neighbour', async () => {
    const { root, bin, search } = await harness()
    await installZoxide(bin, [], 1)

    expect(await search.search(join(root, 'not-here'), new AbortController().signal)).toEqual([])
  })

  it('stays usable on a host with no zoxide at all', async () => {
    const { search } = await harness()

    expect(await search.search('anything', new AbortController().signal)).toEqual([])
  })

  it('treats a zoxide miss (non-zero exit) as no answer, not a failure', async () => {
    const { bin, search } = await harness()
    await installZoxide(bin, ['/definitely/not/printed'], 1)

    expect(await search.search('nope', new AbortController().signal)).toEqual([])
  })

  it('refuses a control-character query rather than passing it to a child process', async () => {
    const { search } = await harness()

    const failure = await search.search('bad\u0000query', new AbortController().signal)
      .then(() => undefined, (error: unknown) => remoteErrorOf(error))
    expect(failure?.code).toBe('gateway/bad-request')
  })

  it('caps what it answers so one query cannot flood the dialog', async () => {
    const { root, bin, search } = await harness()
    const made: string[] = []
    for (let index = 0; index < 45; index += 1) {
      const path = join(root, `p${String(index).padStart(2, '0')}`)
      await mkdir(path)
      made.push(path)
    }
    await installZoxide(bin, made)

    expect((await search.search('p', new AbortController().signal)).length).toBe(40)
  })

  it('registers the namespace owner on the Host context', async () => {
    const ctx = new Context()
    roots.push(ctx)
    await ctx.plugin({ apply }).await()

    expect(ctx.mmsProjectSearch).toBeInstanceOf(MmsProjectSearchController)
  })
})
