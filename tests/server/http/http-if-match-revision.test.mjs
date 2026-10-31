import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('If-Match precondition follows the current ETag across a file revision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-if-match-'));
    const path = join(root, 'index.html');
    const firstText = '<html><head></head><body>Initial</body></html>';
    const secondText = '<html><head></head><body>Updated content</body></html>';
    writeFileSync(path, firstText);
    const liveServer = Object.create(HttpServer.prototype);
    liveServer.config = { rootFolder: root, auto_close: false };
    const handler = liveServer.createStaticServer();
    const http = createServer((incoming, response) => handler(incoming, response, error => {
        response.statusCode = error?.status ?? 404;
        response.end(error?.message ?? 'Not found');
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
        const outgoing = request(url, { headers: { Origin: 'https://example.test', ...headers } }, response => {
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

    const first = await get({});
    assert.equal(first.status, 200);
    assert.equal(first.body, firstText);
    assert.ok(first.headers.etag);
    const matched = await get({ 'If-Match': first.headers.etag });
    assert.equal(matched.status, 200);
    assert.equal(matched.body, firstText);

    writeFileSync(path, secondText);
    const stale = await get({ 'If-Match': first.headers.etag });
    assert.equal(stale.status, 412);
    assert.notEqual(stale.headers.etag, first.headers.etag);
    const current = await get({});
    assert.equal(current.status, 200);
    assert.equal(current.body, secondText);
    assert.equal((await get({ 'If-Match': current.headers.etag })).body, secondText);
});
