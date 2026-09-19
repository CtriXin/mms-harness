/**
 * `/btw <question>`: a side question that never touches the main conversation
 * (C13.06 / C13.07).
 *
 * - Isolation: the answer comes from one auxiliary model call, not from the
 *   agent. Command runs are log-only in dsh, so neither the question nor the
 *   answer becomes model input for the main task, and the running turn and its
 *   queue are not touched.
 * - Bounded context: the call sees the last few human and assistant texts of
 *   this session (no tool output, no system prompt), clipped and with obvious
 *   secrets masked. They come from a session projection, so the context
 *   survives a Host restart and a resumed session.
 * - Honest attribution: the card names the model that actually answered and
 *   its token usage. A failure says so; nothing claims an answer that no
 *   request produced.
 *
 * Uses the session's latest main-request route (the model the user picked).
 */
export const name = 'mms-btw';
export const inject = ['commands', 'llm', 'sessionProjections'];

export const KEY = 'mmsBtwContext';
const KEEP = 12;
const CLIP = 1500;
const BUDGET = 12000;
const MAX_OUTPUT = 2048;

const SECRET_PATTERNS = [
  /\b(sk|pk|rk|ak)-[A-Za-z0-9_-]{16,}/g,
  /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{12,}/gi,
  /\b((?:api|access|secret|auth)[_-]?(?:key|token)|token|secret|password|passwd)\b(\s*[:=]\s*)\S+/gi,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
];

export function redact(text) {
  return SECRET_PATTERNS.reduce((out, pattern) => out.replace(pattern, (match, ...groups) =>
    pattern.source.includes('password') ? `${groups[0]}${groups[1]}[已隐藏]` : '[已隐藏]'), text);
}

function textOf(content) {
  return (content ?? []).filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text).join('\n').trim();
}

function clip(text) {
  return text.length > CLIP ? `${text.slice(0, CLIP)}…（已截断）` : text;
}

/** Pure fold over the session log: recent human/assistant text and the latest main route. */
export function fold(state, event) {
  let entry;
  if (event.type === 'user/message' && event.data?.source?.kind === 'user') {
    entry = { role: 'user', text: textOf(event.data.content) };
  } else if (event.type === 'assistant/message') {
    entry = { role: 'assistant', text: textOf(event.data?.message?.content) };
  } else if (event.type === 'request/header') {
    const config = event.data?.header?.config;
    if (typeof config?.provider !== 'string' || typeof config?.model !== 'string') return state;
    return { ...state, route: { provider: config.provider, model: config.model } };
  }
  if (entry === undefined || entry.text === '') return state;
  return { ...state, recent: [...state.recent, { role: entry.role, text: clip(redact(entry.text)) }].slice(-KEEP) };
}

const stateSchema = {
  parse(value) {
    const ok = value && Array.isArray(value.recent)
      && value.recent.every(e => (e?.role === 'user' || e?.role === 'assistant') && typeof e.text === 'string')
      && (value.route === null || (typeof value.route?.provider === 'string' && typeof value.route?.model === 'string'));
    if (!ok) throw new Error('mms-btw: invalid projection state');
    return value;
  },
};

export const unit = {
  key: KEY,
  stateVersion: 1,
  stateSchema,
  init: () => ({ recent: [], route: null }),
  apply: fold,
};

/** Newest-first within the budget, then back in conversation order. */
export function contextWindow(recent, budget = BUDGET) {
  const kept = [];
  let used = 0;
  for (const entry of [...recent].reverse()) {
    if (used + entry.text.length > budget) break;
    kept.unshift(entry);
    used += entry.text.length;
  }
  return kept;
}

export const SYSTEM = [
  'You answer a side question the user asked while their main task keeps running.',
  'You only see a short excerpt of that conversation, supplied as JSON; you cannot run tools or change anything.',
  'Answer briefly in the language of the question, in plain text without Markdown.',
  'If the excerpt does not contain what the question needs, say so instead of guessing.',
].join('\n');

export function frame(recent, question) {
  return `Conversation excerpt (oldest first, may be empty):\n${JSON.stringify(contextWindow(recent))}\n\nSide question:\n${question}`;
}

function finishError(finish) {
  if (finish?.kind === 'stop' || finish?.kind === 'max-tokens') return undefined;
  if (finish?.kind === 'error' || finish?.kind === 'aborted') return finish.failure?.message ?? finish.kind;
  return `unexpected finish ${finish?.kind}`;
}

/** One auxiliary call; returns the answer text, the route that produced it, and its usage. */
export async function ask({ llm, lib, route, recent, question, sessionId, signal }) {
  const messages = [lib.createUserMessage({
    content: [{ type: 'text', text: frame(recent, redact(question)) }],
    source: { kind: 'plugin', plugin: 'mms-btw' },
  })];
  const assembler = new lib.BlockAssembler();
  for await (const chunk of llm.stream({
    provider: route.provider, model: route.model, messages, system: SYSTEM,
    maxTokens: MAX_OUTPUT, sessionId, signal,
  })) {
    assembler.push(chunk);
  }
  const failure = finishError(assembler.finish);
  if (failure !== undefined) throw new Error(failure);
  const text = assembler.blocks().filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (text === '') throw new Error('模型没有返回文字');
  return { text, usage: assembler.usage, truncated: assembler.finish?.kind === 'max-tokens' };
}

export function card({ text, usage, truncated }, route, context) {
  const tokens = usage ? ` · 输入 ${usage.inputTokens} / 输出 ${usage.outputTokens} tokens` : ' · 用量未知';
  return `${text}${truncated ? '\n（回答达到长度上限，已截断）' : ''}\n\n`
    + `— 旁问 · 回答模型 ${route.model}（${route.provider}）${tokens} · 参考了最近 ${context} 条对话 · 不进入主对话`;
}

export async function btwCommand({ rawInput, agent, signal }, { llm, lib, stateOf }) {
  const question = rawInput.trim();
  if (question === '') return { kind: 'error', text: '用法：/btw 你的问题（旁问不打断当前任务，也不进入主对话）' };
  const state = stateOf(agent.session) ?? unit.init();
  if (state.route === null) {
    return { kind: 'error', text: '这个会话还没有发出过模型请求，旁问不知道该用哪个模型。先发一条消息，再用 /btw。没有发出旁问请求。' };
  }
  try {
    const answer = await ask({ llm, lib, route: state.route, recent: state.recent, question, sessionId: agent.session.id, signal });
    return { kind: 'success', text: card(answer, state.route, contextWindow(state.recent).length) };
  } catch (error) {
    return { kind: 'error', text: `旁问失败（${state.route.model}）：${redact(String(error?.message ?? error))}` };
  }
}

export async function apply(ctx) {
  const lib = await import('@deepseek-ai/dsh-llm');
  ctx.sessionProjections.register(unit);
  ctx.commands.register({
    name: 'btw',
    description: '旁问：不打断当前任务、不进入主对话，用当前模型快速回答一个问题',
    input: { hint: '你的问题' },
    handler: invocation => btwCommand(invocation, {
      llm: ctx.llm, lib, stateOf: session => ctx.sessionProjections.stateOf(session, KEY),
    }),
  });
}
