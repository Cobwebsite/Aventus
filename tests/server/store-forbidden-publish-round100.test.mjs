import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Store, QueryError }, { DependencyManager }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'project/DependencyManager.ts', 'GenericServer.ts',
]);

test('Store invalidates a live session after publication is forbidden even when logout fails', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-forbidden-'));
    const output = join(root, 'output');
    mkdirSync(join(output, '@locals'), { recursive: true });
    writeFileSync(join(output, '@locals', 'Demo.package.avt'), 'export namespace Demo {}');
    const requests = [];
    let releaseLogout;
    const logoutGate = new Promise(resolve => { releaseLogout = resolve; });
    const server = createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        requests.push({ path: request.url, authorization: request.headers.authorization });
        response.setHeader('content-type', 'application/json');
        if (request.url.endsWith('/login')) {
            response.end(JSON.stringify({ errors: [], result: 'live-token' }));
        } else if (request.url.endsWith('/package/publish')) {
            response.statusCode = 403;
            response.end(JSON.stringify({ errors: [{ code: 403, message: 'Forbidden' }] }));
        } else {
            await logoutGate;
            response.statusCode = 500;
            response.end(JSON.stringify({ errors: [{ code: 500, message: 'Logout failed' }] }));
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const previous = {
        url: Store.url, settings: Store._settings, setSettings: Store.setSettings,
        dependency: DependencyManager.getInstance, error: GenericServer.error,
    };
    const errors = [];
    Store.url = `http://127.0.0.1:${server.address().port}`;
    Store._settings = { token: '', username: undefined };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    DependencyManager.getInstance = () => ({ getPath: () => output });
    GenericServer.error = message => errors.push(message);
    t.after(async () => {
        releaseLogout();
        Store.url = previous.url;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
        DependencyManager.getInstance = previous.dependency;
        GenericServer.error = previous.error;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    });

    assert.equal(await Store.connect('alice', 'password'), true);
    assert.equal(Store.isConnected, true);
    const result = await Store.publishPackage({
        buildConfig: { fullname: 'Demo', version: '1.0.0', tags: [] },
        project: { getConfigFile: () => ({ folderPath: root }) },
    });
    assert.ok(result instanceof QueryError);
    assert.deepEqual(result.errors, [{ code: 403, message: 'You must connect to your account first' }]);
    await new Promise((resolve, reject) => {
        const deadline = Date.now() + 2000;
        const poll = () => {
            if (requests.length === 3) return resolve();
            if (Date.now() > deadline) return reject(new Error('Store did not request logout after forbidden publication'));
            setTimeout(poll, 10);
        };
        poll();
    });
    assert.equal(Store.isConnected, true, 'the 403 result returns before the logout response clears credentials');
    releaseLogout();
    await new Promise((resolve, reject) => {
        const deadline = Date.now() + 2000;
        const poll = () => {
            if (!Store.isConnected && requests.length === 3) return resolve();
            if (Date.now() > deadline) return reject(new Error('Store session did not clear after forbidden publication'));
            setTimeout(poll, 10);
        };
        poll();
    });
    assert.deepEqual(Store._settings, { token: '', username: undefined });
    assert.deepEqual(requests.map(request => request.path), [
        '/api/remote/login', '/api/remote/package/publish', '/api/remote/logout',
    ]);
    assert.equal(requests[0].authorization, undefined);
    assert.match(requests[1].authorization, /^Bearer live-token\|.+/);
    assert.match(requests[2].authorization, /^Bearer live-token\|.+/);
    assert.deepEqual(errors, ['Logout failed']);
});
