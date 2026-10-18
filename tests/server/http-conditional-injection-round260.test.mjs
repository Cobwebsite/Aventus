import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('une requête conditionnelle HTML reste sans corps puis reprend l injection après modification', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-conditional-'));
    const path = join(root, 'index.html');
    writeFileSync(path, '<html><head></head><body>First</body></html>');
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
    const get = headers => new Promise((resolve, reject) => {
        const req = request(url, { headers }, response => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve({
                status: response.statusCode,
                headers: response.headers,
                body: Buffer.concat(chunks).toString('utf8'),
            }));
            response.on('error', reject);
        });
        req.on('error', reject);
        req.end();
    });

    const first = await get({});
    const firstBody = first.body;
    const etag = first.headers.etag;
    assert.equal(first.status, 200);
    assert.ok(etag);
    assert.match(firstBody, /First/);
    assert.match(firstBody, /WebSocket|websocket|new WebSocket/);

    const cached = await get({ 'If-None-Match': etag });
    assert.equal(cached.status, 304);
    assert.equal(cached.body, '');

    writeFileSync(path, '<html><head></head><body>Second revision</body></html>');
    const revised = await get({ 'If-None-Match': etag });
    const revisedBody = revised.body;
    assert.equal(revised.status, 200);
    assert.notEqual(revised.headers.etag, etag);
    assert.match(revisedBody, /Second revision/);
    assert.doesNotMatch(revisedBody, /First/);
    assert.match(revisedBody, /WebSocket|websocket|new WebSocket/);
});
