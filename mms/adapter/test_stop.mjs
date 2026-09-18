import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, guardCancel } from './plugin-stop.mjs';

function fakeJobs(entries, { throwOn } = {}) {
  const killed = [];
  return {
    killed,
    list: caller => entries.filter(j => j.owner === caller),
    kill: (id, caller, reason) => {
      if (id === throwOn) throw new Error('boom');
      assert.equal(reason, 'user stopped the turn');
      killed.push({ id, caller });
      return 'requested';
    },
  };
}

function fakeAgent() {
  const calls = [];
  return { calls, cancel(cause, options) { calls.push({ cause, options, self: this }); } };
}

test('user stop kills the agent\'s live jobs first, then cancels as before', () => {
  const agent = fakeAgent(), other = fakeAgent();
  const jobs = fakeJobs([
    { id: 'bash-1', status: 'running', owner: agent },
    { id: 'subagent-2', status: 'stopping', owner: agent },
    { id: 'bash-3', status: 'completed', owner: agent },
    { id: 'bash-4', status: 'running', owner: other },
  ]);
  guardCancel(agent, jobs);
  agent.cancel({ kind: 'user' }, { keepInbox: true });
  assert.deepEqual(jobs.killed.map(k => k.id), ['bash-1', 'subagent-2']);
  assert.ok(jobs.killed.every(k => k.caller === agent));
  assert.deepEqual(agent.calls[0].cause, { kind: 'user' });
  assert.deepEqual(agent.calls[0].options, { keepInbox: true });
  assert.equal(agent.calls[0].self, agent);
});

test('non-user cancels (dispose, replacement) leave jobs alone', () => {
  const agent = fakeAgent();
  const jobs = fakeJobs([{ id: 'bash-1', status: 'running', owner: agent }]);
  guardCancel(agent, jobs);
  agent.cancel({ kind: 'disposed' });
  assert.equal(jobs.killed.length, 0);
  assert.equal(agent.calls.length, 1);
});

test('a failing kill never blocks the stop', () => {
  const agent = fakeAgent();
  const logs = [];
  const jobs = fakeJobs([{ id: 'bash-1', status: 'running', owner: agent }, { id: 'bash-2', status: 'running', owner: agent }], { throwOn: 'bash-1' });
  guardCancel(agent, jobs, m => logs.push(m));
  agent.cancel({ kind: 'user' });
  assert.deepEqual(jobs.killed.map(k => k.id), ['bash-2']);
  assert.equal(agent.calls.length, 1);
  assert.match(logs[0], /bash-1/);
});

test('guarding twice wraps once', () => {
  const agent = fakeAgent();
  const jobs = fakeJobs([{ id: 'bash-1', status: 'running', owner: agent }]);
  guardCancel(agent, jobs);
  guardCancel(agent, jobs);
  agent.cancel({ kind: 'user' });
  assert.equal(jobs.killed.length, 1);
  assert.equal(agent.calls.length, 1);
});

test('plugin guards every created agent', async () => {
  const handlers = {};
  const agent = fakeAgent();
  const jobs = fakeJobs([{ id: 'bash-1', status: 'running', owner: agent }]);
  apply({ on: (name, fn) => { handlers[name] = fn; }, jobs });
  assert.equal(handlers['agent/created']({ agent }), undefined);
  agent.cancel({ kind: 'user' });
  assert.deepEqual(jobs.killed.map(k => k.id), ['bash-1']);
});
