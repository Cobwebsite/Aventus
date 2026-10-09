import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Store }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('Store HTTP session persists login, retains it after failed login, and clears it on logout', async t => {
    const directory = mkdtempSync(join(tmpdir(), 'aventus-store-session-http-'));
    const requests = [];
    const server = createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        requests.push({ path: request.url, authorization: request.headers.authorization, body });
        response.setHeader('Content-Type', 'application/json');
        if (request.url.endsWith('/login')) {
            response.end(JSON.stringify(body.password === 'valid'
                ? { errors: [], result: 'saved-token' }
                : { errors: [{ code: 7, message: 'invalid credentials' }] }));
        } else {
            response.end(JSON.stringify({ errors: [], result: true }));
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const previous = {
        url: Store.url, settings: Store._settings, manager: SettingsManager.instance,
        server: GenericServer.instance, error: GenericServer.error,
    };
    const errors = [];
    Store.url = `http://127.0.0.1:${server.address().port}`;
    Store._settings = undefined;
    SettingsManager.instance = undefined;
    GenericServer.instance = { _savePath: directory };
    GenericServer.error = message => errors.push(message);
    t.after(async () => {
        Store.url = previous.url;
        Store._settings = previous.settings;
        SettingsManager.instance = previous.manager;
        GenericServer.instance = previous.server;
        GenericServer.error = previous.error;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(directory, { recursive: true, force: true });
    });

    assert.equal(await Store.connect('alice', 'valid'), true);
    assert.equal(Store.isConnected, true);
    assert.equal(Store.token, 'saved-token');
    assert.deepEqual(JSON.parse(readFileSync(join(directory, 'config.json'), 'utf8')).store,
        { token: 'saved-token', username: 'alice' });

    assert.equal(await Store.connect('alice', 'invalid'), false);
    assert.equal(Store.token, 'saved-token');
    assert.deepEqual(JSON.parse(readFileSync(join(directory, 'config.json'), 'utf8')).store,
        { token: 'saved-token', username: 'alice' });
    assert.deepEqual(errors, ['invalid credentials']);

    await Store.disconnect();
    assert.equal(Store.isConnected, false);
    assert.equal(Store.token, '');
    assert.deepEqual(JSON.parse(readFileSync(join(directory, 'config.json'), 'utf8')).store,
        { token: '' });
    assert.deepEqual(requests.map(request => request.path),
        ['/api/remote/login', '/api/remote/login', '/api/remote/logout']);
    assert.equal(requests[0].authorization, undefined);
    assert.equal(requests[1].authorization, undefined);
    assert.match(requests[2].authorization, /^Bearer saved-token\|.+/);
    assert.equal(requests[0].body.username, 'alice');
    assert.equal(requests[0].body.password, 'valid');
});
