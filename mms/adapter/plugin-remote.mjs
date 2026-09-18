/** `/remote`: turn phone / other-computer access on or off from inside the app (C07.01/.03). */
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
export const name = 'mms-remote';
export const inject = ['commands'];

const ACTIONS = new Set(['status', 'on', 'off', 'rotate']);
const NONCE_TTL_MS = 5 * 60 * 1000;

/** Command output lands in the session log and exports, so the token never may. */
export function redact(text) {
  return text.replace(/([?&]k=)[A-Za-z0-9_-]+/g, '$1…');
}

export function writeNonce(installation, now = Date.now()) {
  const folder = join(installation, 'remote');
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  const nonce = randomBytes(24).toString('base64url');
  const path = join(folder, 'qr-nonce');
  writeFileSync(path + '.tmp', JSON.stringify({ nonce, expires: now + NONCE_TTL_MS }), { mode: 0o600 });
  renameSync(path + '.tmp', path);
  return nonce;
}

/** Run this installation's service manager; injectable so tests need no Python. */
export function runService(installation, action) {
  const config = JSON.parse(readFileSync(join(installation, 'installation.json'), 'utf8'));
  const service = join(installation, 'source/mms/adapter/service.py');
  return new Promise((resolve, reject) => {
    execFile(config.python, [service, 'remote', action, `--installation=${installation}`], { timeout: 30_000 },
      (error, stdout, stderr) => error ? reject(new Error(redact(String(stderr || error.message)).trim())) : resolve(String(stdout)));
  });
}

export async function remoteCommand(input, { installation, run = runService, now = Date.now() }) {
  const action = input.trim() || 'status';
  if (!ACTIONS.has(action)) return { kind: 'error', text: '用法：/remote status | on | off | rotate' };
  if (!installation || !existsSync(join(installation, 'installation.json'))) {
    return { kind: 'error', text: '这个实例不是通过 MMS Harness 安装的，无法开启远程访问。' };
  }
  const output = await run(installation, action);
  const lines = redact(output).trimEnd().split('\n').filter(line => !line.includes('remote add-host'));
  const settingsFile = join(installation, 'remote/settings.json');
  const mode = existsSync(settingsFile) ? JSON.parse(readFileSync(settingsFile, 'utf8')).mode : 'off';
  if (mode === 'lan') {
    const port = JSON.parse(readFileSync(settingsFile, 'utf8')).port
      ?? Number(JSON.parse(readFileSync(join(installation, 'installation.json'), 'utf8')).port) + 1;
    const nonce = writeNonce(installation, now);
    lines.push('', `扫码页（仅本机浏览器可打开，5 分钟内有效）：http://127.0.0.1:${port}/__mms/remote?n=${nonce}`);
  }
  return { kind: 'success', text: lines.join('\n') };
}

export function apply(ctx, config) {
  ctx.commands.register({
    name: 'remote', description: 'MMS 远程访问：手机或另一台电脑打开本机 Harness（默认关闭）',
    input: { hint: 'status | on | off | rotate' },
    async handler({ rawInput }) {
      try { return await remoteCommand(rawInput, { installation: config.installation }); }
      catch (e) { return { kind: 'error', text: e.message || '远程访问命令失败。' }; }
    },
  });
}
