import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('If-Range date follows the file modification time across revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-if-range-date-'));
    const path = join(root, 'index.html');
    const firstText = '<html><head></head><body>Alpha</body></html>';
    const secondText = '<html><head></head><body>Beta updated</body></html>';
    const firstDate = new Date('2020-01-01T12:00:00Z');
    const secondDate = new Date('2021-01-01T12:00:00Z');
    writeFileSync(path, firstText);
    utimesSync(path, firstDate, firstDate);
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
    assert.equal(first.headers['last-modified'], firstDate.toUTCString());
    const firstRange = await get({ Range: 'bytes=1-3', 'If-Range': first.headers['last-modified'] });
    assert.equal(firstRange.status, 206);
    assert.equal(firstRange.body, firstText.slice(1, 4));
    assert.equal(firstRange.headers['content-range'], `bytes 1-3/${Buffer.byteLength(firstText)}`);

    writeFileSync(path, secondText);
    utimesSync(path, secondDate, secondDate);
    const staleRange = await get({ Range: 'bytes=1-3', 'If-Range': first.headers['last-modified'] });
    assert.equal(staleRange.status, 200);
    assert.equal(staleRange.body, secondText);
    assert.equal(staleRange.headers['content-range'], undefined);
    assert.equal(staleRange.headers['last-modified'], secondDate.toUTCString());

    const currentRange = await get({ Range: 'bytes=1-3', 'If-Range': staleRange.headers['last-modified'] });
    assert.equal(currentRange.status, 206);
    assert.equal(currentRange.body, secondText.slice(1, 4));
});
