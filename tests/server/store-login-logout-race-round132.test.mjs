import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store } = await loadServerModule('store/Store.ts');

test('a pending login cannot reconnect Store after a later logout', async t => {
    let releaseLogin;
    const loginGate = new Promise(resolve => { releaseLogin = resolve; });
    let signalLogin;
    const loginArrived = new Promise(resolve => { signalLogin = resolve; });
    const requests = [];
    const server = createServer(async (request, response) => {
        for await (const _ of request) { /* consume request */ }
        requests.push(request.url);
        if (request.url.endsWith('/login')) {
            signalLogin();
            await loginGate;
        }
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ errors: [], result: request.url.endsWith('/login') ? 'late-token' : true }));
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const previous = { url: Store.url, settings: Store._settings, setSettings: Store.setSettings };
    Store.url = `http://127.0.0.1:${server.address().port}`;
    Store._settings = { token: '', username: undefined };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    t.after(async () => {
        releaseLogin();
        Store.url = previous.url;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });

    const login = Store.connect('alice', 'password');
    await loginArrived;
    await Store.disconnect();
    assert.equal(Store.isConnected, false);

    releaseLogin();
    assert.equal(await login, false);
    assert.deepEqual(Store._settings, { token: '', username: undefined });
    assert.deepEqual(requests, ['/api/remote/login', '/api/remote/logout']);
});
