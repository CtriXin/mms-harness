/**
 * Read-only planning (C13.15).
 *
 * Upstream plan mode is guidance only: "every tool remains available"
 * (packages/plan/plan-mode/README.md). MMS plan mode is a tool boundary: while
 * an agent is planning, only the read-only tools below may run, and everything
 * else (writes, shell, run_code, subagents, MCP, web) is denied with a reason
 * the model sees. Leaving plan mode (`/plan off` or an approved plan) restores
 * the normal tools. This is a tool-layer rule, not an OS sandbox.
 *
 * It uses upstream's monotonic `ctx.tools.guard`: a guard can only deny, and
 * no later policy can turn its denial back into permission.
 */
export const name = 'mms-plan-readonly';
// Plan state is read from upstream's `plan` session projection, not from
// `ctx.planMode`: on the pinned host a root-level plugin that injects
// `planMode` stays pending forever (gate L6, 2026-09-19), while
// `sessionProjections` is available.
export const inject = ['tools', 'sessionProjections'];

/** Reading and searching files, asking the user, and presenting the plan. */
export const READ_ONLY_TOOLS = new Set(['read', 'read_image', 'grep', 'glob', 'ask_user_question', 'exit_plan_mode']);

/**
 * Whether plan mode governs this agent: the logged `plan/mode` state. A `/plan`
 * issued mid-turn applies from the next step, the same boundary at which
 * upstream appends it; an approved exit lifts the rule at that boundary too.
 */
export function planning(projections, agent) {
  const state = projections.stateOf(agent.session, 'plan');
  if (state === undefined) throw new Error('the plan projection is not registered');
  return state.active === true;
}

export function planGuard(projections, log = () => {}) {
  return execution => {
    if (execution.agent === undefined || READ_ONLY_TOOLS.has(execution.name)) return undefined;
    let active;
    try {
      active = planning(projections, execution.agent);
    } catch (error) {
      // Plan state unreadable means plan mode itself is broken; fail open so
      // ordinary sessions keep their tools, and say so in the log.
      log(`mms-plan-readonly: plan state unreadable, not restricting ${execution.name}: ${error?.message ?? error}`);
      return undefined;
    }
    if (!active) return undefined;
    return `Plan mode is read-only: "${execution.name}" is not available while planning. `
      + `Use ${[...READ_ONLY_TOOLS].join(', ')}; present the plan with exit_plan_mode, `
      + 'or ask the user to leave plan mode with /plan off. (MMS tool rule, not an OS sandbox.)';
  };
}

export function apply(ctx) {
  const log = message => ctx.logger?.('mms-plan-readonly')?.warn?.(message);
  ctx.effect(() => ctx.tools.guard(planGuard(ctx.sessionProjections, log)), 'mms-plan-readonly: tool guard');
}
