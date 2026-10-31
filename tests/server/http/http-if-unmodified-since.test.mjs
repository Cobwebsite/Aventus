import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('If-Unmodified-Since rejects a revised file and accepts its current date', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-unmodified-'));
    const path = join(root, 'index.html');
    const before = '<html><head></head><body>Before</body></html>';
    const after = '<html><head></head><body>After update</body></html>';
    const firstDate = new Date('2020-02-03T10:11:12Z');
    const secondDate = new Date('2021-02-03T10:11:12Z');
    writeFileSync(path, before);
    utimesSync(path, firstDate, firstDate);
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
    assert.equal(first.headers['last-modified'], firstDate.toUTCString());
    const matched = await get({ 'If-Unmodified-Since': first.headers['last-modified'] });
    assert.equal(matched.status, 200);
    assert.equal(matched.body, before);

    writeFileSync(path, after);
    utimesSync(path, secondDate, secondDate);
    const stale = await get({ 'If-Unmodified-Since': first.headers['last-modified'] });
    assert.equal(stale.status, 412);
    const current = await get({});
    assert.equal(current.headers['last-modified'], secondDate.toUTCString());
    assert.equal((await get({ 'If-Unmodified-Since': current.headers['last-modified'] })).body, after);
});
