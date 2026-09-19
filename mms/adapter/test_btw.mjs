import test from 'node:test';
import assert from 'node:assert/strict';
import { btwCommand, contextWindow, fold, frame, redact, unit, SYSTEM } from './plugin-btw.mjs';

const user = text => ({ type: 'user/message', data: { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text }] } });
const notice = text => ({ type: 'user/message', data: { role: 'user', source: { kind: 'plugin', plugin: 'x' }, content: [{ type: 'text', text }] } });
const assistant = (...content) => ({ type: 'assistant/message', data: { message: { role: 'assistant', content } } });
const header = (provider, model) => ({ type: 'request/header', data: { header: { config: { provider, model } } } });
const replay = events => events.reduce(fold, unit.init());

// Minimal stand-ins for @deepseek-ai/dsh-llm: the plugin only needs these two.
const lib = {
  createUserMessage: m => ({ role: 'user', ...m }),
  BlockAssembler: class {
    constructor() { this.chunks = []; }
    push(c) { this.chunks.push(c); }
    get finish() { return this.chunks.at(-1)?.finish ?? { kind: 'stop' }; }
    get usage() { return this.chunks.at(-1)?.usage; }
    blocks() { return this.chunks.filter(c => c.text).map(c => ({ type: 'text', text: c.text })); }
  },
};
function fakeLlm(chunks) {
  const calls = [];
  return { calls, async *stream(options) { calls.push(options); for (const c of chunks) yield c; } };
}
const agent = { session: { id: 's1' } };
const invoke = (rawInput, state, llm) => btwCommand({ rawInput, agent, signal: new AbortController().signal },
  { llm, lib, stateOf: () => state });

test('the projection keeps human and assistant text only, bounded, and the latest route', () => {
  const state = replay([
    user('修一下登录 bug'), notice('[model changed]'), header('p1', 'm1'),
    assistant({ type: 'thinking', text: 'secret plan' }, { type: 'tool-call', name: 'bash' }, { type: 'text', text: '在看 auth.ts' }),
    header('p2', 'm2'),
  ]);
  assert.deepEqual(state.recent, [{ role: 'user', text: '修一下登录 bug' }, { role: 'assistant', text: '在看 auth.ts' }]);
  assert.deepEqual(state.route, { provider: 'p2', model: 'm2' });
  const many = replay(Array.from({ length: 30 }, (_, i) => user(`m${i}`)));
  assert.equal(many.recent.length, 12);
  assert.equal(many.recent.at(-1).text, 'm29');
  assert.match(replay([user('x'.repeat(5000))]).recent[0].text, /已截断/);
  assert.deepEqual(unit.stateSchema.parse(state), state);
  assert.throws(() => unit.stateSchema.parse({ recent: [{ role: 'tool', text: '' }], route: null }));
});

test('secrets are masked before they reach the side model', () => {
  const masked = redact('key sk-abcdefghijklmnop1234 and Authorization: Bearer abc.def.ghi.jkl1 api_key=hunter2hunter2 ghp_abcdefghijklmnopqrstuvwxyz AKIAABCDEFGHIJKLMNOP');
  for (const leaked of ['sk-abcdefghijklmnop1234', 'abc.def.ghi.jkl1', 'hunter2hunter2', 'ghp_abcdefghijklmnopqrstuvwxyz', 'AKIAABCDEFGHIJKLMNOP']) {
    assert.ok(!masked.includes(leaked), leaked);
  }
  assert.match(masked, /api_key=\[已隐藏\]/);
  assert.equal(replay([user('token=abcdef123456 here')]).recent[0].text, 'token=[已隐藏] here');
});

test('the context window keeps the newest turns that fit, in order', () => {
  const recent = [{ role: 'user', text: 'a'.repeat(6000) }, { role: 'assistant', text: 'b'.repeat(5000) }, { role: 'user', text: 'c'.repeat(5000) }];
  assert.deepEqual(contextWindow(recent, 12000).map(e => e.text[0]), ['b', 'c']);
  assert.match(frame([{ role: 'user', text: 'hi' }], '问题'), /"hi"[\s\S]*问题$/);
});

test('/btw answers from the session route, attributes model and usage, and never touches the agent', async () => {
  const state = replay([user('在重构支付模块'), header('mms-abc', 'gpt-5.6-sol'), assistant({ type: 'text', text: '先拆 service' })]);
  const llm = fakeLlm([{ text: '是 Stripe。' }, { finish: { kind: 'stop' }, usage: { inputTokens: 120, outputTokens: 8 } }]);
  const result = await invoke('  我们用的哪家支付？ ', state, llm);
  assert.equal(result.kind, 'success');
  assert.match(result.text, /^是 Stripe。/);
  assert.match(result.text, /回答模型 gpt-5\.6-sol（mms-abc）/);
  assert.match(result.text, /输入 120 \/ 输出 8 tokens/);
  assert.match(result.text, /参考了最近 2 条对话 · 不进入主对话/);
  const call = llm.calls[0];
  assert.equal(call.provider, 'mms-abc');
  assert.equal(call.model, 'gpt-5.6-sol');
  assert.equal(call.system, SYSTEM);
  assert.equal(call.sessionId, 's1');
  assert.match(call.messages[0].content[0].text, /在重构支付模块[\s\S]*先拆 service[\s\S]*我们用的哪家支付？$/);
  assert.equal(call.tools, undefined);
});

test('without a question, or before any main request, no side request is sent', async () => {
  const llm = fakeLlm([]);
  assert.equal((await invoke('   ', replay([header('p', 'm')]), llm)).kind, 'error');
  const early = await invoke('hi', undefined, llm);
  assert.equal(early.kind, 'error');
  assert.match(early.text, /没有发出旁问请求/);
  assert.equal(llm.calls.length, 0);
});

test('a failed side call says so and names the model; it never shows an answer', async () => {
  const state = replay([header('p', 'm1')]);
  const failed = await invoke('q', state, fakeLlm([{ finish: { kind: 'error', failure: { message: 'HTTP 429 key sk-abcdefghijklmnop1234' } } }]));
  assert.equal(failed.kind, 'error');
  assert.match(failed.text, /旁问失败（m1）：HTTP 429/);
  assert.ok(!failed.text.includes('sk-abcdefghijklmnop1234'));
  const empty = await invoke('q', state, fakeLlm([{ finish: { kind: 'stop' } }]));
  assert.match(empty.text, /模型没有返回文字/);
  const cut = await invoke('q', state, fakeLlm([{ text: 'partial' }, { finish: { kind: 'max-tokens' } }]));
  assert.match(cut.text, /已截断[\s\S]*用量未知/);
});
