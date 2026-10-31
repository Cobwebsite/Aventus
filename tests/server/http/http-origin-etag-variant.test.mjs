import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('les variantes HTML avec et sans Origin ont des ETag distincts', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-origin-etag-'));
    const html = '<html><head></head><body>Variant</body></html>';
    writeFileSync(join(root, 'index.html'), html);
    const liveServer = Object.create(HttpServer.prototype);
    liveServer.config = { rootFolder: root, auto_close: false };
    const handler = liveServer.createStaticServer();
    const http = createServer((incoming, response) => handler(incoming, response, () => {
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
    const get = headers => new Promise((resolve, reject) => {
        const outgoing = request(url, { headers }, response => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve({
                status: response.statusCode,
                headers: response.headers,
                body: Buffer.concat(chunks).toString('utf8'),
            }));
            response.on('error', reject);
        });
        outgoing.on('error', reject);
        outgoing.end();
    });

    const raw = await get({ Origin: 'https://example.test' });
    const injected = await get({});
    assert.equal(raw.status, 200);
    assert.equal(injected.status, 200);
    assert.equal(raw.body, html);
    assert.match(injected.body, /WebSocket|websocket|new WebSocket/);
    assert.notEqual(injected.body, raw.body);
    assert.notEqual(injected.headers.etag, raw.headers.etag);
    assert.match(raw.headers.vary ?? '', /\bOrigin\b/i);
    assert.match(injected.headers.vary ?? '', /\bOrigin\b/i);

    const conditional = await get({ 'If-None-Match': raw.headers.etag });
    assert.equal(conditional.status, 200);
    assert.equal(conditional.body, injected.body);
    const reverseConditional = await get({
        Origin: 'https://example.test', 'If-None-Match': injected.headers.etag,
    });
    assert.equal(reverseConditional.status, 200);
    assert.equal(reverseConditional.body, raw.body);
    assert.equal((await get({ 'If-None-Match': injected.headers.etag })).status, 304);
    assert.equal((await get({ Origin: 'https://example.test', 'If-None-Match': raw.headers.etag })).status, 304);
});
