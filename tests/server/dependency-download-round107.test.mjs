import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }] = await loadServerModules(['project/DependencyManager.ts']);

test('dependency download replaces only after success and preserves the prior file on failure', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-download-'));
    const requests = [];
    const server = createServer((request, response) => {
        requests.push(request.url);
        if (request.url === '/redirect') {
            response.writeHead(302, { location: `http://127.0.0.1:${server.address().port}/package` });
            response.end();
        } else if (request.url === '/package') {
            response.writeHead(200, { 'content-type': 'application/octet-stream' });
            response.end('package bytes\n');
        } else if (request.url === '/updated') {
            response.writeHead(200, { 'content-type': 'application/octet-stream' });
            response.end('updated package\n');
        } else {
            response.writeHead(404);
            response.end('missing');
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const manager = Object.create(DependencyManager.prototype);
    const destination = join(root, 'download.package.avt');
    const previousError = console.error;
    const errors = [];
    console.error = (...parts) => errors.push(parts.join(' '));
    try {
        assert.equal(await manager.downloadFile(destination, `${base}/redirect`), true);
        assert.equal(readFileSync(destination, 'utf8'), 'package bytes\n');
        assert.deepEqual(requests, ['/redirect', '/package']);

        assert.equal(await manager.downloadFile(destination, `${base}/missing`), false);
        assert.equal(readFileSync(destination, 'utf8'), 'package bytes\n');
        assert.deepEqual(readdirSync(root), ['download.package.avt']);
        assert.ok(errors.some(message => message.includes('HTTP 404')));

        assert.equal(await manager.downloadFile(destination, `${base}/updated`), true);
        assert.equal(readFileSync(destination, 'utf8'), 'updated package\n');
        assert.deepEqual(readdirSync(root), ['download.package.avt']);
    } finally {
        console.error = previousError;
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    }
});
