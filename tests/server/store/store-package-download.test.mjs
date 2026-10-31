import assert from 'node:assert/strict';
import { createWriteStream, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
const [{ DependencyManager }, { FilesManager }, { Store }] = await loadServerModules([
    'project/DependencyManager.ts', 'files/FilesManager.ts', 'store/Store.ts',
]);

async function zip(entries) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-package-zip-'));
    const target = join(root, 'body.zip');
    const stream = createWriteStream(target);
    const archive = archiver('zip');
    const closed = new Promise((resolve, reject) => {
        stream.once('close', resolve);
        stream.once('error', reject);
        archive.once('error', reject);
    });
    archive.pipe(stream);
    for (const [name, body] of Object.entries(entries)) archive.append(body, { name });
    try {
        await archive.finalize();
        await closed;
        return readFileSync(target);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

test('Store package download recovers from HTTP error and invalid archive, then caches a valid version', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-package-download-'));
    const invalid = Buffer.from('not a zip');
    const valid = await zip({ 'Demo.package.avt': '// Demo:1.2.3\nexport namespace Demo {}' });
    const requests = [];
    const server = createServer((request, response) => {
        requests.push(request.url);
        response.writeHead(requests.length === 1 ? 503 : 200, { 'content-type': 'application/zip' });
        response.end(requests.length === 2 ? invalid : valid);
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const oldUrl = Store.url;
    const oldGetInstance = FilesManager.getInstance;
    const oldError = console.error;
    const errors = [];
    Store.url = `http://127.0.0.1:${server.address().port}`;
    FilesManager.getInstance = () => ({ registerFilePackage: async uri => ({ uri }) });
    console.error = (...args) => errors.push(args.join(' '));
    t.after(async () => {
        Store.url = oldUrl;
        FilesManager.getInstance = oldGetInstance;
        console.error = oldError;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    });

    const manager = Object.create(DependencyManager.prototype);
    manager.path = root;
    manager.loadPackage = file => ({ uri: file.uri });
    const build = { buildConfig: {} };
    assert.equal(await manager.loadStore('Demo', '1.2.3', build), null);
    assert.equal(existsSync(join(root, 'store', 'Demo', '1.2.3', 'temp.zip')), false);
    assert.equal(await manager.loadStore('Demo', '1.2.3', build), null);
    const downloaded = await manager.loadStore('Demo', '1.2.3', build);
    assert.equal(downloaded.file.uri, downloaded.uri);
    assert.match(downloaded.uri, /Demo\.package\.avt$/);
    assert.equal(readFileSync(join(root, 'store', 'Demo', '1.2.3', 'Demo.package.avt'), 'utf8'),
        '// Demo:1.2.3\nexport namespace Demo {}');
    assert.equal(existsSync(join(root, 'store', 'Demo', '1.2.3', 'temp.zip')), false);
    assert.deepEqual(requests, [
        '/package/download/Demo/1.2.3', '/package/download/Demo/1.2.3',
        '/package/download/Demo/1.2.3',
    ]);
    assert.ok(errors.some(message => message.includes('HTTP 503')));
    assert.ok(errors.some(message => message.includes('ZIP')));
    assert.equal((await manager.loadStore('Demo', '1.2.3', build)).uri, downloaded.uri);
    assert.equal(requests.length, 3);
});
