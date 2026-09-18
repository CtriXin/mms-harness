// MMS remote gateway: the only way a phone or another computer reaches DSH.
//
// DSH itself stays on loopback: upstream refuses `--host 0.0.0.0` because the
// Web UI is remote code execution on this machine. This gateway is off unless
// the owner turns it on, listens on each LAN address (never the wildcard, so
// "off" leaves nothing listening), and forwards to DSH only requests carrying
// the MMS token. The token file is re-read on every check, so rotating it cuts
// every link and cookie handed out so far. The gateway holds DSH's own auth
// cookie and never gives it to the remote browser.
//
// Never logs tokens, cookies, or query strings.
import { createServer, request as httpRequest } from 'node:http';
import { connect } from 'node:net';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

export const COOKIE = 'mms_harness_key';
export const QUERY = 'k';
// Browsers fetch the web manifest (and so its icon) without cookies; both are
// static app metadata, so they are the only paths served without the token.
const PUBLIC = new Set(['/manifest.webmanifest', '/favicon.svg']);
const HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'te', 'trailer', 'upgrade']);

export function lanAddresses() {
  return Object.values(networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
}

function digest(value) {
  return createHash('sha256').update(String(value)).digest();
}

export function tokenMatches(presented, current) {
  return Boolean(presented && current) && timingSafeEqual(digest(presented), digest(current));
}

function cookies(header) {
  const out = new Map();
  for (const part of String(header || '').split(';')) {
    const at = part.indexOf('=');
    if (at > 0) out.set(part.slice(0, at).trim(), part.slice(at + 1).trim());
  }
  return out;
}

/** Everything the gateway decides before touching DSH. Pure, so tests can drive it directly. */
export function decide({ method, url, headers }, { allowedHosts, token }) {
  const host = String(headers.host || '').toLowerCase();
  if (!allowedHosts.has(host)) return { status: 421, reason: 'host' };
  const origin = headers.origin;
  if (origin && origin !== 'null') {
    let originHost;
    try { originHost = new URL(origin).host.toLowerCase(); } catch { originHost = ''; }
    if (originHost !== host) return { status: 403, reason: 'origin' };
  }
  const parsed = new URL(url, 'http://gateway.invalid');
  if ((method === 'GET' || method === 'HEAD') && PUBLIC.has(parsed.pathname) && !parsed.search) return { status: 0 };
  const presented = parsed.searchParams.get(QUERY);
  if (presented !== null) {
    if (!tokenMatches(presented, token) || (method !== 'GET' && method !== 'HEAD')) return { status: 401, reason: 'link' };
    parsed.searchParams.delete(QUERY);
    return { status: 303, location: parsed.pathname + parsed.search, setCookie: true };
  }
  if (!tokenMatches(cookies(headers.cookie).get(COOKIE), token)) return { status: 401, reason: 'cookie' };
  return { status: 0 };
}

/** Request headers as DSH must see them: its own Host/Origin, its own cookie, none of ours. */
export function upstreamHeaders(headers, upstreamHost, upstreamCookie, { keepUpgrade = false } = {}) {
  const out = {};
  for (const [name, value] of Object.entries(headers)) {
    const key = name.toLowerCase();
    if (key === 'host' || key === 'cookie' || key === 'origin' || key === 'referer') continue;
    if (HOP.has(key) && !(keepUpgrade && (key === 'connection' || key === 'upgrade'))) continue;
    out[key] = value;
  }
  const kept = [...cookies(headers.cookie)].filter(([k]) => k !== COOKIE && !k.startsWith('dsh-auth')).map(([k, v]) => `${k}=${v}`);
  out.host = upstreamHost;
  out.cookie = [...kept, upstreamCookie].filter(Boolean).join('; ');
  if (headers.origin) out.origin = `http://${upstreamHost}`;
  return out;
}

function responseHeaders(raw, upstreamHost) {
  const out = {};
  for (const [name, value] of Object.entries(raw)) {
    const key = name.toLowerCase();
    if (HOP.has(key)) continue;
    if (key === 'set-cookie') {
      const kept = [].concat(value).filter(c => !/^\s*dsh-auth/i.test(c));
      if (kept.length) out[key] = kept;
      continue;
    }
    if (key === 'location' && typeof value === 'string' && value.startsWith(`http://${upstreamHost}`)) {
      out[key] = value.slice(`http://${upstreamHost}`.length) || '/';
      continue;
    }
    out[key] = value;
  }
  return out;
}

const DENIED = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MMS Harness</title>'
  + '<p style="font:16px system-ui;margin:2em">需要有效的访问链接。请在电脑上运行 <code>"MMS Harness.command" remote status</code> 获取新链接。</p>';

/** Exchange DSH's one-time startup URL for its auth cookie, without following the redirect. */
export async function upstreamCookie(startUrl) {
  const response = await fetch(startUrl, { redirect: 'manual' });
  const set = response.headers.getSetCookie().find(c => /^dsh-auth/i.test(c));
  if (!set) throw new Error(`DSH did not issue an auth cookie (HTTP ${response.status})`);
  return set.split(';')[0];
}

export function createGateway({ upstream, upstreamAuth, allowedHosts, readToken, log = () => {} }) {
  const target = new URL(upstream);
  const upstreamHost = target.host;
  // Method and pathname only: the query may carry the token.
  const where = req => `${req.method} ${new URL(req.url, 'http://gateway.invalid').pathname}`;
  const deny = (req, res, verdict) => {
    log(`deny ${verdict.reason} ${verdict.status} ${where(req)}`);
    res.writeHead(verdict.status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(verdict.status === 401 ? DENIED : '');
  };
  const server = createServer((req, res) => {
    const verdict = decide(req, { allowedHosts, token: readToken() });
    if (verdict.status === 303) {
      res.writeHead(303, { location: verdict.location, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer',
        'set-cookie': `${COOKIE}=${readToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` });
      return res.end();
    }
    if (verdict.status) return deny(req, res, verdict);
    const forward = httpRequest({ host: target.hostname, port: target.port, method: req.method, path: req.url,
      headers: upstreamHeaders(req.headers, upstreamHost, upstreamAuth()) }, upstreamRes => {
      res.writeHead(upstreamRes.statusCode, responseHeaders(upstreamRes.headers, upstreamHost));
      upstreamRes.pipe(res);
    });
    forward.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
    req.pipe(forward);
  });
  server.on('upgrade', (req, socket, head) => {
    const verdict = decide(req, { allowedHosts, token: readToken() });
    if (verdict.status) {
      log(`deny-upgrade ${verdict.reason} ${where(req)}`);
      socket.end(`HTTP/1.1 ${verdict.status === 303 ? 401 : verdict.status} Denied\r\nconnection: close\r\ncontent-length: 0\r\n\r\n`);
      return;
    }
    const headers = upstreamHeaders(req.headers, upstreamHost, upstreamAuth(), { keepUpgrade: true });
    const upstreamSocket = connect(Number(target.port), target.hostname, () => {
      const lines = [`${req.method} ${req.url} HTTP/1.1`, ...Object.entries(headers).flatMap(([k, v]) => [].concat(v).map(x => `${k}: ${x}`))];
      upstreamSocket.write(lines.join('\r\n') + '\r\n\r\n');
      if (head?.length) upstreamSocket.write(head);
      upstreamSocket.pipe(socket);
      socket.pipe(upstreamSocket);
    });
    const close = () => { socket.destroy(); upstreamSocket.destroy(); };
    upstreamSocket.on('error', close);
    socket.on('error', close);
  });
  return server;
}

/** Host header values the gateway answers to: each bound address, plus explicit tunnel names. */
export function allowedHostsFor(port, addresses, hostnames) {
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  for (const address of addresses) hosts.add(`${address}:${port}`);
  for (const name of hostnames) { hosts.add(name); hosts.add(`${name}:${port}`); }
  return hosts;
}

// Launched by service.py: config comes from env and files, never argv, so tokens stay out of `ps`.
if (import.meta.main) {
  const settings = JSON.parse(readFileSync(process.env.MMS_REMOTE_SETTINGS, 'utf8'));
  const tokenFile = process.env.MMS_REMOTE_TOKEN_FILE;
  const readToken = () => readFileSync(tokenFile, 'utf8').trim();
  const auth = await upstreamCookie(process.env.MMS_REMOTE_UPSTREAM_START);
  const addresses = settings.mode === 'lan' ? lanAddresses() : [];
  const allowedHosts = allowedHostsFor(settings.port, addresses, settings.hostnames || []);
  const log = line => process.stderr.write(`[mms-remote] ${new Date().toISOString()} ${line}\n`);
  const server = () => createGateway({ upstream: process.env.MMS_REMOTE_UPSTREAM, upstreamAuth: () => auth,
    allowedHosts, readToken, log });
  // One socket per address: a wildcard bind would keep a port open on every interface.
  for (const address of ['127.0.0.1', ...addresses]) {
    server().listen(settings.port, address, () => log(`listening ${address}:${settings.port}`));
  }
}
