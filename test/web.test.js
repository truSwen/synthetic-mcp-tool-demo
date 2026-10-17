import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createWebServer } from '../web.js';
let server, base;
before(async () => { server = createWebServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => new Promise(resolve => server.close(resolve)));
test('local UI serves clear synthetic disclosure and restrictive CSP', async () => {
 const r = await fetch(base); assert.equal(r.status, 200); assert.match(await r.text(), /SYNTHETIC DATA ONLY/); assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});
test('web bridge executes a real MCP call', async () => {
 const r = await fetch(`${base}/run?scenario=unknown`); assert.equal(r.status, 200); const d = await r.json(); assert.equal(d.transport, 'MCP over stdio'); assert.equal(d.result.structuredContent.status, 'unknown');
});
test('web bridge exposes validation refusal', async () => { const d = await (await fetch(`${base}/run?scenario=refused`)).json(); assert.equal(d.result.isError, true); });
test('unknown scenario is rejected before MCP execution', async () => { assert.equal((await fetch(`${base}/run?scenario=__proto__`)).status, 400); });
test('cross-origin requests are rejected', async () => { assert.equal((await fetch(base, {headers:{Origin:'https://example.invalid'}})).status, 403); });
test('untrusted Host header is rejected', async () => {
 const status = await new Promise((resolve, reject) => {
  const req = http.get(base, { headers: { Host: 'example.invalid' } }, res => { res.resume(); resolve(res.statusCode); });
  req.on('error', reject);
 });
 assert.equal(status, 403);
});
test('write HTTP methods are rejected', async () => { assert.equal((await fetch(base, {method:'POST'})).status, 405); });
test('arbitrary file routes are unavailable', async () => { assert.equal((await fetch(`${base}/server.js`)).status, 404); });
