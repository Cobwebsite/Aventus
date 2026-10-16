import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Store, QueryError }, { DependencyManager }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'project/DependencyManager.ts', 'GenericServer.ts',
]);

async function localApi(t, handler) {
    const server = createServer(handler);
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const oldUrl = Store.url;
    const oldSettings = Store._settings;
    Store.url = `http://127.0.0.1:${server.address().port}`;
    Store._settings = { token: 'local-token', username: 'tester' };
    t.after(async () => {
        Store.url = oldUrl;
        Store._settings = oldSettings;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });
}

test('package publication without README recovers after HTTP validation and server errors', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-publish-recovery-'));
    const output = join(root, 'output');
    mkdirSync(join(output, '@locals'), { recursive: true });
    writeFileSync(join(output, '@locals', 'Demo.package.avt'), 'export namespace Demo {}');
    const oldDependency = DependencyManager.getInstance;
    DependencyManager.getInstance = () => ({ getPath: () => output });
    t.after(() => {
        DependencyManager.getInstance = oldDependency;
        rmSync(root, { recursive: true, force: true });
    });

    const requests = [];
    await localApi(t, async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const form = await new Request('http://localhost/', {
            method: 'POST', headers: { 'content-type': request.headers['content-type'] },
            body: Buffer.concat(chunks),
        }).formData();
        requests.push({
            path: request.url,
            readme: form.get('readMe'),
            packageName: form.get('packageFile')?.name,
            packageText: await form.get('packageFile')?.text(),
        });
        response.setHeader('content-type', 'application/json');
        if (requests.length === 1) {
            response.statusCode = 422;
            response.end(JSON.stringify({ errors: [{ code: 422, message: 'Invalid version' }] }));
        } else if (requests.length === 2) {
            response.statusCode = 500;
            response.end(JSON.stringify({ errors: [{ code: 500, message: 'Temporary failure' }] }));
        } else {
            response.end(JSON.stringify({ errors: [], result: true }));
        }
    });

    const build = {
        buildConfig: { fullname: 'Demo', version: '1.0.0', tags: [] },
        project: { getConfigFile: () => ({ folderPath: root }) },
    };
    const invalid = await Store.publishPackage(build);
    assert.ok(invalid instanceof QueryError);
    assert.deepEqual(invalid.errors, [{ code: 422, message: 'Store request failed with HTTP 422' }]);
    const unavailable = await Store.publishPackage(build);
    assert.ok(unavailable instanceof QueryError);
    assert.deepEqual(unavailable.errors, [{ code: 500, message: 'Store request failed with HTTP 500' }]);
    assert.equal(await Store.publishPackage(build), true);
    assert.equal(requests.length, 3);
    for (const request of requests) {
        assert.equal(request.path, '/api/remote/package/publish');
        assert.equal(request.readme, null);
        assert.equal(request.packageName, 'Demo.package.avt');
        assert.equal(request.packageText, 'export namespace Demo {}');
    }
});

test('template publication removes its archive after HTTP 500 and succeeds on retry', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-publish-recovery-'));
    const folder = join(root, 'template');
    mkdirSync(folder);
    mkdirSync(join(root, 'temp'));
    const config = join(folder, 'template.avt.ts');
    writeFileSync(config, 'export class Template {}');
    const oldServer = GenericServer.instance;
    GenericServer.instance = { _savePath: root };
    t.after(() => {
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    });
    let count = 0;
    await localApi(t, async (request, response) => {
        for await (const _ of request) { /* consume multipart upload */ }
        count++;
        response.setHeader('content-type', 'application/json');
        response.statusCode = count === 1 ? 500 : 200;
        response.end(JSON.stringify(count === 1
            ? { errors: [{ code: 500, message: 'Temporary failure' }] }
            : { errors: [], result: true }));
    });
    const template = {
        name: 'Sample', description: '', version: '1.0.0', isProject: false,
        isGlobal: false, tags: [], folderPath: folder, config,
    };
    const failed = await Store.publishTemplate(template);
    assert.ok(failed instanceof QueryError);
    assert.deepEqual(failed.errors, [{ code: 500, message: 'Store request failed with HTTP 500' }]);
    assert.equal(existsSync(join(root, 'temp', 'Sample.zip')), false);
    assert.equal(await Store.publishTemplate(template), true);
    assert.equal(existsSync(join(root, 'temp', 'Sample.zip')), false);
    assert.equal(count, 2);
});
