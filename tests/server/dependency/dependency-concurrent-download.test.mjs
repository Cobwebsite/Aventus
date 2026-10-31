import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }] = await loadServerModules(['project/DependencyManager.ts']);

test('concurrent downloads isolate a failed request from a successful replacement', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-concurrent-package-download-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const destination = join(root, 'shared.package.avt');
    writeFileSync(destination, 'previous package');
    let releaseFailure;
    const failureGate = new Promise(resolve => { releaseFailure = resolve; });
    let failureReceived;
    const received = new Promise(resolve => { failureReceived = resolve; });
    const server = createServer(async (request, response) => {
        if (request.url === '/failure') {
            failureReceived();
            await failureGate;
            response.writeHead(503);
            response.end('unavailable');
        } else {
            response.writeHead(200, { 'content-type': 'application/octet-stream' });
            response.end('new package');
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    const manager = Object.create(DependencyManager.prototype);
    const oldError = console.error;
    const errors = [];
    console.error = (...parts) => errors.push(parts.join(' '));
    t.after(() => { console.error = oldError; });

    const failed = manager.downloadFile(destination, `${base}/failure`);
    await received;
    const succeeded = manager.downloadFile(destination, `${base}/success`);
    assert.equal(await succeeded, true);
    assert.equal(readFileSync(destination, 'utf8'), 'new package');
    releaseFailure();
    assert.equal(await failed, false);
    assert.equal(readFileSync(destination, 'utf8'), 'new package');
    assert.deepEqual(readdirSync(root), ['shared.package.avt']);
    assert.ok(errors.some(error => error.includes('HTTP 503')));
});

test('an interrupted response keeps the installed package and leaves no temporary file', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-interrupted-package-download-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const destination = join(root, 'shared.package.avt');
    writeFileSync(destination, 'installed package');
    const server = createServer((request, response) => {
        if (request.url === '/partial') {
            response.writeHead(200);
            response.write('incomplete package');
            response.destroy();
        } else {
            response.writeHead(200);
            response.end('recovered package');
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    const manager = Object.create(DependencyManager.prototype);
    const oldError = console.error;
    console.error = () => {};
    t.after(() => { console.error = oldError; });

    assert.equal(await manager.downloadFile(destination, `${base}/partial`), false);
    assert.equal(readFileSync(destination, 'utf8'), 'installed package');
    assert.deepEqual(readdirSync(root), ['shared.package.avt']);
    assert.equal(await manager.downloadFile(destination, `${base}/recovered`), true);
    assert.equal(readFileSync(destination, 'utf8'), 'recovered package');
    assert.deepEqual(readdirSync(root), ['shared.package.avt']);
});
