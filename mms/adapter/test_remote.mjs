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
