import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('If-Modified-Since évite le corps injecté puis sert la révision HTML plus récente', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-modified-since-'));
    const path = join(root, 'index.html');
    writeFileSync(path, '<html><head></head><body>First</body></html>');
    const firstTime = new Date('2020-01-01T00:00:00Z');
    utimesSync(path, firstTime, firstTime);
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

    const first = await get({});
    assert.equal(first.status, 200);
    assert.match(first.body, /First/);
    assert.match(first.body, /WebSocket|websocket|new WebSocket/);
    const modified = first.headers['last-modified'];
    assert.ok(modified);
    const cached = await get({ 'If-Modified-Since': modified });
    assert.equal(cached.status, 304);
    assert.equal(cached.body, '');

    writeFileSync(path, '<html><head></head><body>Second revision</body></html>');
    const secondTime = new Date('2020-01-01T00:00:05Z');
    utimesSync(path, secondTime, secondTime);
    const revised = await get({ 'If-Modified-Since': modified });
    assert.equal(revised.status, 200);
    assert.notEqual(revised.headers['last-modified'], modified);
    assert.match(revised.body, /Second revision/);
    assert.doesNotMatch(revised.body, /First/);
    assert.match(revised.body, /WebSocket|websocket|new WebSocket/);
});
