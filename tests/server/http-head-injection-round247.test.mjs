import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('HEAD garde la longueur du HTML brut même quand GET injecte le script live reload', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-head-round247-'));
    const html = '<html><head></head><body>Head check</body></html>';
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

    for (const headers of [{}, { Origin: 'https://example.test' }]) {
        const get = await fetch(url, { headers });
        const body = await get.text();
        const head = await fetch(url, { method: 'HEAD', headers });
        assert.equal(get.status, 200);
        assert.equal(head.status, 200);
        assert.equal(Number(head.headers.get('content-length')), Buffer.byteLength(html));
        assert.equal(await head.text(), '');
        if (headers.Origin) {
            assert.equal(body, html);
            assert.equal(get.headers.get('content-length'), head.headers.get('content-length'));
        } else {
            assert.match(body, /Head check/);
            assert.match(body, /WebSocket|websocket|new WebSocket/);
            assert.equal(Number(get.headers.get('content-length')), Buffer.byteLength(body));
            assert.ok(Number(get.headers.get('content-length')) > Number(head.headers.get('content-length')));
        }
    }
});
