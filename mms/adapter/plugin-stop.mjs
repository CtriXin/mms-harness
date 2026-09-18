/**
 * Stop means stop (C13.03 / C08.07).
 *
 * Upstream DSH's Stop aborts only the current turn: a background job the model
 * started keeps running, and when it finishes `dsh-tool-jobs` wakes the idle
 * agent (`completionDelivery: wakeup`) to open a new turn with no user
 * message. So a Stop could still be followed by side effects and more model
 * requests.
 *
 * On a user cancel, this kills every job the agent owns before the cancel runs.
 * A killed job is marked reported, so no completion notice is sent and nothing
 * wakes the agent (packages/jobs/tool-jobs/README.md:40). Subagents run as jobs
 * too, so they stop along with it.
 *
 * No public cancel event exists. This wraps each agent's `cancel`, which the
 * session controller calls with `{ kind: 'user' }` (session-controller
 * commands.ts). The sync gate's L5 check catches the case where upstream moves
 * that call.
 */
export const name = 'mms-stop';
export const inject = ['jobs'];

const LIVE = new Set(['running', 'stopping']);

export function killOwnedJobs(jobs, agent, log = () => {}) {
  let killed = 0;
  for (const job of jobs.list(agent)) {
    if (!LIVE.has(job.status)) continue;
    try {
      if (jobs.kill(job.id, agent, 'user stopped the turn') === 'requested') killed++;
    } catch (error) {
      log(`mms-stop: could not kill ${job.id}: ${error?.message ?? error}`);
    }
  }
  return killed;
}

export function guardCancel(agent, jobs, log) {
  if (agent.__mmsStopGuarded) return;
  const original = agent.cancel.bind(agent);
  agent.cancel = (cause, options) => {
    // Kill failures must never block the stop itself.
    if (cause?.kind === 'user') killOwnedJobs(jobs, agent, log);
    return original(cause, options);
  };
  Object.defineProperty(agent, '__mmsStopGuarded', { value: true });
}

export function apply(ctx) {
  const log = message => ctx.logger?.('mms-stop')?.warn?.(message);
  ctx.on('agent/created', ({ agent }) => guardCancel(agent, ctx.jobs, log));
}
