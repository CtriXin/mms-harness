/**
 * The default model for new sessions changes only when the user says so (C01.06).
 *
 * Upstream saves every in-session model switch as the global default
 * (session-controller `selectModel` -> `agentDefaultModel.saveSelection`),
 * so trying a model in one session silently changes what every new session,
 * and every not-yet-sent draft, starts with. MMS keeps them apart, as Pilot
 * did: switching inside a session affects that session only, and
 * `/default-model` (the "设为新会话默认" item in the model menu) is the one
 * explicit way to change the default.
 *
 * `saveSelection` has exactly one upstream caller (commands.ts selectModel), so
 * replacing it on the service instance decouples exactly that path. The sync
 * gate's L9 catches upstream moving the save elsewhere.
 */
export const name = 'mms-default-model';
export const inject = ['agentDefaultModel', 'commands'];

const EFFORTS = new Set(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);

/** `{"provider","model","reasoningEffort"?}` as the model menu sends it; anything else is refused. */
export function parseSelection(raw) {
  let value;
  try { value = JSON.parse(raw); } catch { return undefined; }
  if (!value || typeof value !== 'object') return undefined;
  const { provider, model, reasoningEffort } = value;
  if (typeof provider !== 'string' || !provider || typeof model !== 'string' || !model) return undefined;
  if (reasoningEffort !== undefined && !EFFORTS.has(reasoningEffort)) return undefined;
  return { provider, model, ...(reasoningEffort === undefined ? {} : { reasoningEffort }) };
}

/**
 * Make in-session switches stop writing the default. Returns the original
 * save for the explicit command and a restore for plugin unload.
 */
export function decouple(service) {
  const original = service.saveSelection;
  service.saveSelection = async () => {};
  return { save: selection => original.call(service, selection), restore: () => { service.saveSelection = original; } };
}

export async function defaultModelCommand(rawInput, save) {
  const selection = parseSelection(rawInput.trim());
  if (selection === undefined) {
    return { kind: 'error', text: '请在输入框右下角的模型菜单里点「设为新会话默认」。' };
  }
  await save(selection);
  return {
    kind: 'success',
    text: `新会话将默认使用 ${selection.model}${selection.reasoningEffort ? ` · ${selection.reasoningEffort}` : ''}。已打开的会话不受影响。`,
  };
}

export function apply(ctx) {
  let save;
  ctx.effect(() => {
    const handle = decouple(ctx.agentDefaultModel);
    save = handle.save;
    return handle.restore;
  }, 'mms-default-model: decouple in-session switches');
  ctx.commands.register({
    name: 'default-model',
    description: '把模型设为新会话的默认（模型菜单里的「设为新会话默认」）',
    input: { hint: '由模型菜单填写' },
    handler: ({ rawInput }) => defaultModelCommand(rawInput, save),
  });
}
