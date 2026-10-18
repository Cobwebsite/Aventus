import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('une réponse HTML partielle injecte du code hors de la plage annoncée sans Origin', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-range-round249-'));
    const html = '<html><head></head><body>Range check</body></html>';
    writeFileSync(join(root, 'index.html'), html);
    const liveServer = Object.create(HttpServer.prototype);
    liveServer.config = { rootFolder: root, auto_close: false };
    const handler = liveServer.createStaticServer();
    const http = createServer((request, response) => handler(request, response, () => {
        response.statusCode = 404;
        response.end('Not found');
    }));
    http.listen(0, '127.0.0.1');
    await once(http, 'listening');
    t.after(async () => {
        http.close();
        await once(http, 'close');
        rmSync(root, { recursive: true, force: true });
    });
    const url = `http://127.0.0.1:${http.address().port}/index.html`;
    const range = 'bytes=0-18';

    const injected = await fetch(url, { headers: { Range: range } });
    const injectedBody = await injected.text();
    assert.equal(injected.status, 206);
    assert.equal(injected.headers.get('content-range'), `bytes 0-18/${Buffer.byteLength(html)}`);
    assert.equal(Number(injected.headers.get('content-length')), Buffer.byteLength(injectedBody));
    assert.match(injectedBody, /^<html><head><script type="text\/javascript">/);
    assert.ok(Buffer.byteLength(injectedBody) > 19);

    const raw = await fetch(url, { headers: { Range: range, Origin: 'https://example.test' } });
    const rawBody = await raw.text();
    assert.equal(raw.status, 206);
    assert.equal(raw.headers.get('content-range'), `bytes 0-18/${Buffer.byteLength(html)}`);
    assert.equal(Number(raw.headers.get('content-length')), Buffer.byteLength(rawBody));
    assert.equal(rawBody, html.slice(0, 19));

    const beforeTag = await fetch(url, { headers: { Range: 'bytes=0-10', Connection: 'close' } });
    assert.equal(beforeTag.status, 206);
    assert.equal(beforeTag.headers.get('content-range'), `bytes 0-10/${Buffer.byteLength(html)}`);
    assert.ok(Number(beforeTag.headers.get('content-length')) > 11);
    await assert.rejects(beforeTag.text(), /terminated/);
});
