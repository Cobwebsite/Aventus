import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('HEAD conditionnel suit ETag et la nouvelle longueur avec ou sans origine externe', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-conditional-head-'));
    const path = join(root, 'index.html');
    const initial = '<html><head></head><body>One</body></html>';
    const revised = '<html><head></head><body>A longer revision</body></html>';
    writeFileSync(path, initial);
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
    const send = (method, headers = {}) => new Promise((resolve, reject) => {
        const outgoing = request(url, { method, headers }, response => {
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

    const first = await send('GET', { Origin: 'https://example.test' });
    assert.equal(first.status, 200);
    assert.equal(first.body, initial);
    const etag = first.headers.etag;
    assert.ok(etag);
    const injected = await send('HEAD', { 'If-None-Match': etag });
    assert.equal(injected.status, 200);
    assert.notEqual(injected.headers.etag, etag);
    assert.equal(injected.body, '');
    const cached = await send('HEAD', { 'If-None-Match': etag, Origin: 'https://example.test' });
    assert.equal(cached.status, 304);
    assert.equal(cached.body, '');

    writeFileSync(path, revised);
    const current = await send('HEAD', { 'If-None-Match': etag, Origin: 'https://example.test' });
    assert.equal(current.status, 200);
    assert.notEqual(current.headers.etag, etag);
    assert.equal(Number(current.headers['content-length']), Buffer.byteLength(revised));
    assert.equal(current.body, '');
    assert.equal((await send('GET', { Origin: 'https://example.test' })).body, revised);
});
