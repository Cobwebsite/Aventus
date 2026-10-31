import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('live HTML injection chooses head, falls back to body, and skips tagless content', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-tag-fallback-'));
    const sources = {
        'head.HTML': '<HTML><HEAD></HEAD><BODY>Head</BODY></HTML>',
        'body.html': '<html><body>Body</body></html>',
        'plain.html': '<main>Plain fragment</main>',
        extensionless: '<html><head></head><body>Extensionless</body></html>',
        'literal.txt': '<html><head></head><body>Text file</body></html>',
    };
    for (const [name, content] of Object.entries(sources)) writeFileSync(join(root, name), content);
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
    const base = `http://127.0.0.1:${http.address().port}`;
    const get = async (name, headers = {}) => {
        const response = await fetch(`${base}/${name}`, { headers });
        const body = await response.text();
        assert.equal(response.status, 200);
        assert.equal(Number(response.headers.get('content-length')), Buffer.byteLength(body));
        return body;
    };

    const head = await get('head.HTML');
    assert.match(head, /^<HTML><HEAD><script type="text\/javascript">/);
    assert.match(head, /<\/script><\/HEAD><BODY>Head<\/BODY><\/HTML>$/);

    const body = await get('body.html');
    assert.match(body, /^<html><body>Body<script type="text\/javascript">/);
    assert.match(body, /<\/script><\/body><\/html>$/);

    assert.equal(await get('plain.html'), sources['plain.html']);
    assert.match(await get('extensionless'), /^<html><head><script type="text\/javascript">/);
    assert.equal(await get('literal.txt'), sources['literal.txt']);
    assert.equal(await get('body.html', { Origin: 'https://example.test' }), sources['body.html']);
    for (const method of ['POST', 'OPTIONS']) {
        const response = await fetch(`${base}/head.HTML`, { method });
        assert.equal(response.status, 404);
        assert.equal(await response.text(), 'Not found');
    }
});
