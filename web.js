import http from 'node:http';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runScenario, scenarios } from './client.js';

const assets = new Map([['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/style.css', ['style.css', 'text/css; charset=utf-8']]]);
export function createWebServer() {
  let busy = false;
  return http.createServer(async (req, res) => {
    const send = (code, type, body) => { res.writeHead(code, { 'Content-Type': type,
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'" }); res.end(body); };
    const json = (code, data) => send(code, 'application/json', JSON.stringify(data));
    // Loopback-only UI, no CORS. Reject rebinding hostnames and cross-origin browser requests.
    const expected = `127.0.0.1:${req.socket.localPort}`;
    if (req.headers.host !== expected || (req.headers.origin && req.headers.origin !== `http://${expected}`) ||
        (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])))
      return json(403, { error: 'Local same-origin requests only' });
    if (req.method !== 'GET') return json(405, { error: 'GET only' });
    const url = new URL(req.url, 'http://localhost');
    if (assets.has(url.pathname)) {
      const [file, type] = assets.get(url.pathname);
      return send(200, type, readFileSync(new URL(file, import.meta.url)));
    }
    if (url.pathname !== '/run') return json(404, { error: 'Not found' });
    const key = url.searchParams.get('scenario');
    if (!key || !Object.hasOwn(scenarios, key)) return json(400, { error: 'Unknown scenario' });
    if (busy) return json(429, { error: 'A demonstration is already running' });
    busy = true;
    try { json(200, await runScenario(key)); }
    catch { json(500, { error: 'MCP demonstration failed. Check local test output.' }); }
    finally { busy = false; }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.DEMO_PORT || 8766);
  createWebServer().listen(port, '127.0.0.1', () => console.log(`Open http://127.0.0.1:${port}`));
}
