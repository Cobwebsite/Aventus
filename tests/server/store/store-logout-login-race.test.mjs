import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { Store } = await loadServerModule('store/Store.ts');

test('an earlier logout cannot clear a newer successful Store login', async t => {
    let releaseLogout;
    const logoutGate = new Promise(resolve => { releaseLogout = resolve; });
    let signalLogout;
    const logoutArrived = new Promise(resolve => { signalLogout = resolve; });
    const requests = [];
    const server = createServer(async (request, response) => {
        for await (const _ of request) { /* consume request */ }
        requests.push({ path: request.url, authorization: request.headers.authorization });
        if (request.url.endsWith('/logout')) {
            signalLogout();
            await logoutGate;
        }
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ errors: [], result: request.url.endsWith('/login') ? 'new-token' : true }));
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const previous = { url: Store.url, settings: Store._settings, setSettings: Store.setSettings };
    Store.url = `http://127.0.0.1:${server.address().port}`;
    Store._settings = { token: 'old-token', username: 'old' };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    t.after(async () => {
        releaseLogout();
        Store.url = previous.url;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });

    const logout = Store.disconnect();
    await logoutArrived;
    assert.equal(await Store.connect('new', 'password'), true);
    assert.deepEqual(Store._settings, { token: 'new-token', username: 'new' });

    releaseLogout();
    await logout;
    assert.deepEqual(Store._settings, { token: 'new-token', username: 'new' });
    assert.equal(requests[0].path, '/api/remote/logout');
    assert.match(requests[0].authorization, /^Bearer old-token\|.+/);
    assert.deepEqual(requests.map(request => request.path), ['/api/remote/logout', '/api/remote/login']);
});
