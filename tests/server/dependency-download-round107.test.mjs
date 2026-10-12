import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }] = await loadServerModules(['project/DependencyManager.ts']);

test('dependency download follows an absolute redirect and cleans a failed download', async () => {
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
        assert.equal(existsSync(destination), false);
        assert.ok(errors.some(message => message.includes('HTTP 404')));
    } finally {
        console.error = previousError;
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    }
});
