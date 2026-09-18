// Drives the real gateway over real sockets against a stand-in DSH.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { connect } from 'node:net';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COOKIE, createGateway, allowedHostsFor } from './remote.mjs';

const TOKEN = 'tok-' + 'a'.repeat(40);
const UPSTREAM_COOKIE = 'dsh-auth-x=signed';

async function listen(server) {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return server.address().port;
}

async function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'mms-remote-test-'));
  const tokenFile = join(dir, 'token');
  writeFileSync(tokenFile, TOKEN + '\n');
  const seen = [];
  const sockets = new Set();
  const dsh = createServer((req, res) => {
    seen.push({ url: req.url, headers: req.headers });
    res.setHeader('set-cookie', ['dsh-auth-x=leak; HttpOnly', 'theme=dark']);
    res.end('from-dsh');
  });
  dsh.on('upgrade', (req, socket) => {
    sockets.add(socket);
    seen.push({ url: req.url, headers: req.headers, upgrade: true });
    socket.write('HTTP/1.1 101 Switching Protocols\r\nupgrade: websocket\r\nconnection: Upgrade\r\n\r\n');
    socket.on('data', d => socket.write(d));  // echo
  });
  const dshPort = await listen(dsh);
  let port;
  const gateway = createGateway({ upstream: `http://127.0.0.1:${dshPort}`, upstreamAuth: () => UPSTREAM_COOKIE,
    allowedHosts: { has: h => h === `127.0.0.1:${port}` || h === `phone.example:${port}` },
    readToken: () => readFileSync(tokenFile, 'utf8').trim() });
  port = await listen(gateway);
  const close = () => {
    for (const s of sockets) s.destroy();
    for (const server of [gateway, dsh]) { server.closeAllConnections(); server.close(); }
    rmSync(dir, { recursive: true, force: true });
  };
  return { port, dshPort, seen, tokenFile, close };
}

function get(port, path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method, agent: false, headers: { host: `127.0.0.1:${port}`, ...headers } }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function upgrade(port, headers) {
  return new Promise(resolve => {
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(['GET /ws HTTP/1.1', `host: 127.0.0.1:${port}`, 'upgrade: websocket', 'connection: Upgrade',
        ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`)].join('\r\n') + '\r\n\r\n');
    });
    let data = '';
    socket.on('data', d => {
      data += d;
      if (data.includes('101') && !data.includes('ping')) socket.write('ping');
      if (data.includes('ping') || /^HTTP\/1\.1 4/.test(data)) { socket.destroy(); resolve(data); }
    });
    socket.on('close', () => resolve(data));
  });
}

test('no token: 401 and DSH never sees the request', async () => {
  const t = await setup();
  try {
    const r = await get(t.port, '/api/sessions');
    assert.equal(r.status, 401);
    assert.equal(t.seen.length, 0);
  } finally { t.close(); }
});

test('unknown Host is refused before auth', async () => {
  const t = await setup();
  try {
    const r = await get(t.port, `/?k=${TOKEN}`, { host: `evil.example:${t.port}` });
    assert.equal(r.status, 421);
    assert.equal(r.headers['set-cookie'], undefined);
  } finally { t.close(); }
});

test('link token becomes an HttpOnly cookie and the token leaves the URL', async () => {
  const t = await setup();
  try {
    const r = await get(t.port, `/chat?x=1&k=${TOKEN}`);
    assert.equal(r.status, 303);
    assert.equal(r.headers.location, '/chat?x=1');
    assert.match(r.headers['set-cookie'][0], new RegExp(`^${COOKIE}=${TOKEN}; .*HttpOnly`));
    assert.equal((await get(t.port, '/?k=wrong')).status, 401);
    assert.equal(t.seen.length, 0);
  } finally { t.close(); }
});

test('authorised request reaches DSH as a local one, with DSH cookie and none of ours', async () => {
  const t = await setup();
  try {
    const r = await get(t.port, '/api/x', { cookie: `${COOKIE}=${TOKEN}; dsh-auth-old=forged; theme=dark` });
    assert.equal(r.status, 200);
    assert.equal(r.body, 'from-dsh');
    const [seen] = t.seen;
    assert.equal(seen.headers.host, `127.0.0.1:${t.dshPort}`);
    assert.equal(seen.headers.cookie, `theme=dark; ${UPSTREAM_COOKIE}`);
    assert.deepEqual(r.headers['set-cookie'], ['theme=dark'], 'DSH auth cookie must not reach the remote browser');
  } finally { t.close(); }
});

test('cross-origin request with a valid cookie is refused', async () => {
  const t = await setup();
  try {
    const r = await get(t.port, '/api/x', { cookie: `${COOKIE}=${TOKEN}`, origin: 'http://evil.example' }, 'POST');
    assert.equal(r.status, 403);
    assert.equal(t.seen.length, 0);
    const ok = await get(t.port, '/api/x', { cookie: `${COOKIE}=${TOKEN}`, origin: `http://127.0.0.1:${t.port}` }, 'POST');
    assert.equal(ok.status, 200);
    assert.equal(t.seen[0].headers.origin, `http://127.0.0.1:${t.dshPort}`);
  } finally { t.close(); }
});

test('WebSocket needs the cookie too, then is piped both ways', async () => {
  const t = await setup();
  try {
    assert.match(await upgrade(t.port, {}), /^HTTP\/1\.1 401/);
    assert.equal(t.seen.length, 0);
    const data = await upgrade(t.port, { cookie: `${COOKIE}=${TOKEN}` });
    assert.match(data, /101 Switching Protocols/);
    assert.match(data, /ping/);
    assert.equal(t.seen[0].headers.cookie, UPSTREAM_COOKIE);
  } finally { t.close(); }
});

test('rotating the token file cuts existing cookies immediately', async () => {
  const t = await setup();
  try {
    assert.equal((await get(t.port, '/', { cookie: `${COOKIE}=${TOKEN}` })).status, 200);
    writeFileSync(t.tokenFile, 'rotated-' + 'b'.repeat(40));
    assert.equal((await get(t.port, '/', { cookie: `${COOKIE}=${TOKEN}` })).status, 401);
  } finally { t.close(); }
});

test('only the manifest and its icon are served without the token', async () => {
  const t = await setup();
  try {
    assert.equal((await get(t.port, '/manifest.webmanifest')).status, 200);
    assert.equal((await get(t.port, '/favicon.svg')).status, 200);
    assert.equal((await get(t.port, '/manifest.webmanifest?x=1')).status, 401);
    assert.equal((await get(t.port, '/manifest.webmanifest', {}, 'POST')).status, 401);
    assert.equal((await get(t.port, '/index.html')).status, 401);
    assert.equal((await get(t.port, '/favicon.svg', { host: 'evil.example' })).status, 421);
  } finally { t.close(); }
});

test('allowed hosts: bound addresses and tunnel names only', () => {
  const hosts = allowedHostsFor(3093, ['192.168.1.5'], ['wide-lions.trycloudflare.com']);
  assert.ok(hosts.has('192.168.1.5:3093'));
  assert.ok(hosts.has('wide-lions.trycloudflare.com'));
  assert.ok(!hosts.has('192.168.1.6:3093'));
  assert.ok(!hosts.has('192.168.1.5:3092'));
});

// ---- QR page and `/remote` command (C07.01/.03) ----
import { QR_PATH, nonceValid, qrPage } from './remote.mjs';
import { redact, remoteCommand, writeNonce } from './plugin-remote.mjs';
import { statSync, mkdirSync } from 'node:fs';

async function qrSetup(nonce) {
  let port;
  const gateway = createGateway({ upstream: 'http://127.0.0.1:9', upstreamAuth: () => '', readToken: () => TOKEN,
    allowedHosts: { has: h => h === `127.0.0.1:${port}` || h === `phone.example:${port}` },
    readNonce: () => nonce, links: () => [{ label: 'LAN', url: `http://10.0.0.2:1/?k=${TOKEN}` }] });
  port = await listen(gateway);
  return { port, close: () => { gateway.closeAllConnections(); gateway.close(); } };
}

test('QR page: loopback browser with a fresh nonce only', async () => {
  const good = { nonce: 'n-' + 'c'.repeat(30), expires: Date.now() + 60_000 };
  const t = await qrSetup(good);
  try {
    const ok = await get(t.port, `${QR_PATH}?n=${good.nonce}`);
    assert.equal(ok.status, 200);
    assert.match(ok.body, /<svg/);
    assert.match(ok.headers['content-security-policy'], /default-src 'none'/);
    assert.equal((await get(t.port, QR_PATH)).status, 404);
    assert.equal((await get(t.port, `${QR_PATH}?n=wrong`)).status, 404);
    // A tunnel arrives from loopback too, but carries its own Host: never shown.
    assert.equal((await get(t.port, `${QR_PATH}?n=${good.nonce}`, { host: `phone.example:${t.port}` })).status, 404);
  } finally { t.close(); }
  const expired = await qrSetup({ nonce: good.nonce, expires: Date.now() - 1 });
  try { assert.equal((await get(expired.port, `${QR_PATH}?n=${good.nonce}`)).status, 404); } finally { expired.close(); }
});

test('nonce check fails closed on unreadable state', () => {
  assert.equal(nonceValid('x', () => { throw new Error('ENOENT'); }), false);
  assert.equal(nonceValid('', () => ({ nonce: '', expires: Infinity })), false);
});

test('QR page escapes labels and encodes each link', () => {
  const html = qrPage([{ label: '<b>x</b>', url: 'http://a/?k=1' }]);
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.equal((html.match(/<svg/g) || []).length, 1);
});

test('/remote never puts the token into command output, and issues a private nonce', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mms-remote-cmd-'));
  try {
    writeFileSync(join(dir, 'installation.json'), JSON.stringify({ port: 3092, python: 'python3' }));
    mkdirSync(join(dir, 'remote'));
    writeFileSync(join(dir, 'remote/settings.json'), JSON.stringify({ mode: 'lan', port: 3093, hostnames: [] }));
    const run = async () => `远程访问：开启（局域网）\n  局域网：http://10.0.0.2:3093/?k=${TOKEN}\n  外网使用：… remote add-host …\n`;
    const r = await remoteCommand('on', { installation: dir, run });
    assert.equal(r.kind, 'success');
    assert.ok(!r.text.includes(TOKEN));
    assert.match(r.text, /\?k=…/);
    const nonce = JSON.parse(readFileSync(join(dir, 'remote/qr-nonce'), 'utf8')).nonce;
    assert.ok(r.text.includes(`http://127.0.0.1:3093/__mms/remote?n=${nonce}`));
    assert.equal(statSync(join(dir, 'remote/qr-nonce')).mode & 0o077, 0);
    assert.equal((await remoteCommand('bogus', { installation: dir, run })).kind, 'error');
    assert.equal((await remoteCommand('on', { installation: join(dir, 'nope'), run })).kind, 'error');
    writeFileSync(join(dir, 'remote/settings.json'), JSON.stringify({ mode: 'off', port: 3093 }));
    assert.ok(!(await remoteCommand('off', { installation: dir, run: async () => '远程访问：关闭\n' })).text.includes('__mms'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
  assert.equal(redact(`a?k=${TOKEN}&x=1`), 'a?k=…&x=1');
  void writeNonce;
});
