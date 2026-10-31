import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('If-Range sert une plage pour l ETag courant puis le fichier entier après révision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-if-range-'));
    const path = join(root, 'index.html');
    const initial = '<html><head></head><body>First</body></html>';
    const revised = '<html><head></head><body>Second revision</body></html>';
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
    assert.equal(first.body, initial);
    const etag = first.headers.etag;
    assert.ok(etag);
    const partial = await get({ Range: 'bytes=0-4', 'If-Range': etag });
    assert.equal(partial.status, 206);
    assert.equal(partial.body, initial.slice(0, 5));
    assert.equal(partial.headers['content-range'], `bytes 0-4/${Buffer.byteLength(initial)}`);

    writeFileSync(path, revised);
    const current = await get({ Range: 'bytes=0-4', 'If-Range': etag });
    assert.equal(current.status, 200);
    assert.equal(current.body, revised);
    assert.notEqual(current.headers.etag, etag);
    assert.equal(current.headers['content-range'], undefined);
});
