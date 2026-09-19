import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, planGuard, READ_ONLY_TOOLS } from './plugin-plan.mjs';

// Stand-in for ctx.sessionProjections keyed by agent.session (the `plan` unit's fold state).
function fakePlanMode(states) {
  const bySession = new Map([...states].map(([agent, state]) => [agent.session, state]));
  return { stateOf: (session, key) => {
    assert.equal(key, 'plan');
    const state = bySession.get(session);
    if (state instanceof Error) throw state;
    return state ?? { active: false };
  } };
}

const planner = { session: { id: 'p' } }, worker = { session: { id: 'w' } };
const call = (name, agent = planner) => ({ name, agent, callId: 'c1', arguments: {} });

test('while planning, only the read-only tools run', () => {
  const guard = planGuard(fakePlanMode(new Map([[planner, { active: true }]])));
  for (const name of ['read', 'read_image', 'grep', 'glob', 'ask_user_question', 'exit_plan_mode']) {
    assert.equal(guard(call(name)), undefined, name);
  }
  for (const name of ['write', 'edit', 'bash', 'run_code', 'spawn_agent', 'web_fetch', 'mcp__x__y', 'todo_write']) {
    const reason = guard(call(name));
    assert.match(reason, /read-only/, name);
    assert.match(reason, new RegExp(`"${name.replace(/[$^.*+?()[\]{}|\\]/g, '\\$&')}"`));
    assert.match(reason, /\/plan off/);
    assert.match(reason, /not an OS sandbox/);
  }
});

test('outside plan mode, and for other agents, nothing is restricted', () => {
  const guard = planGuard(fakePlanMode(new Map([[planner, { active: true }], [worker, { active: false }]])));
  assert.equal(guard(call('bash', worker)), undefined);
  assert.equal(guard({ name: 'bash', callId: 'c2', arguments: {} }), undefined);
});

test('only the logged state counts: mid-turn selections apply at the next step, like upstream', () => {
  assert.match(planGuard(fakePlanMode(new Map([[planner, { active: true, wanted: false }]])))(call('bash')), /read-only/);
  assert.equal(planGuard(fakePlanMode(new Map([[planner, { active: false, wanted: true }]])))(call('bash')), undefined);
});

test('a missing plan projection fails open and is logged', () => {
  const logs = [];
  const guard = planGuard({ stateOf: () => undefined }, m => logs.push(m));
  assert.equal(guard(call('bash')), undefined);
  assert.match(logs[0], /not registered/);
});

test('unreadable plan state fails open and is logged', () => {
  const logs = [];
  const guard = planGuard(fakePlanMode(new Map([[planner, new Error('no projection')]])), m => logs.push(m));
  assert.equal(guard(call('bash')), undefined);
  assert.match(logs[0], /no projection/);
});

test('the read-only set is exactly the documented one', () => {
  assert.deepEqual([...READ_ONLY_TOOLS].sort(), ['ask_user_question', 'exit_plan_mode', 'glob', 'grep', 'read', 'read_image']);
});

test('plugin registers one guard through a disposable effect', () => {
  const guards = [];
  let disposed = 0;
  const ctx = {
    tools: { guard: g => { guards.push(g); return () => { disposed++; }; } },
    sessionProjections: fakePlanMode(new Map([[planner, { active: true }]])),
    effect: (fn) => { const dispose = fn(); return dispose; },
  };
  const dispose = apply(ctx);
  assert.equal(guards.length, 1);
  assert.match(guards[0](call('bash')), /read-only/);
  assert.equal(dispose, undefined);
  assert.equal(disposed, 0);
});
