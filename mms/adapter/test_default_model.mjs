import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, decouple, defaultModelCommand, parseSelection } from './plugin-default-model.mjs';

function fakeService() {
  const saved = [];
  return { saved, async saveSelection(selection) { saved.push({ selection, self: this }); } };
}

test('an in-session switch no longer writes the default; the explicit command does', async () => {
  const service = fakeService();
  const { save } = decouple(service);
  await service.saveSelection({ provider: 'p', model: 'tried-in-a-session' });  // what selectModel calls
  assert.equal(service.saved.length, 0);
  const result = await defaultModelCommand(' {"provider":"p","model":"m","reasoningEffort":"high"} ', save);
  assert.equal(result.kind, 'success');
  assert.match(result.text, /新会话将默认使用 m · high/);
  assert.deepEqual(service.saved.map(s => s.selection), [{ provider: 'p', model: 'm', reasoningEffort: 'high' }]);
  assert.equal(service.saved[0].self, service);
});

test('restore puts upstream behaviour back on unload', async () => {
  const service = fakeService();
  const { restore } = decouple(service);
  restore();
  await service.saveSelection({ provider: 'p', model: 'm' });
  assert.equal(service.saved.length, 1);
});

test('only a well-formed selection from the menu is accepted', async () => {
  for (const raw of ['', 'gpt', '{}', '{"provider":"p"}', '{"provider":"p","model":""}', '{"provider":"p","model":"m","reasoningEffort":"turbo"}', 'null']) {
    assert.equal(parseSelection(raw), undefined, raw);
  }
  assert.deepEqual(parseSelection('{"provider":"p","model":"m"}'), { provider: 'p', model: 'm' });
  const saved = [];
  const refused = await defaultModelCommand('gpt-5', s => saved.push(s));
  assert.equal(refused.kind, 'error');
  assert.match(refused.text, /设为新会话默认/);
  assert.equal(saved.length, 0);
});

test('plugin decouples inside an effect and registers /default-model', async () => {
  const service = fakeService();
  const commands = [];
  const disposers = [];
  apply({ agentDefaultModel: service, commands: { register: c => commands.push(c) }, effect: fn => disposers.push(fn()) });
  await service.saveSelection({ provider: 'p', model: 'x' });
  assert.equal(service.saved.length, 0);
  assert.equal(commands[0].name, 'default-model');
  const result = await commands[0].handler({ rawInput: '{"provider":"p","model":"m"}' });
  assert.equal(result.kind, 'success');
  assert.equal(service.saved.length, 1);
  disposers.forEach(d => d());
  await service.saveSelection({ provider: 'p', model: 'y' });
  assert.equal(service.saved.length, 2);
});
