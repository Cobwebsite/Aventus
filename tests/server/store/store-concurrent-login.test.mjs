import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { Store } = await loadServerModule('store/Store.ts');

test('an earlier Store login response cannot overwrite a later successful login', async t => {
    let releaseFirst;
    const firstGate = new Promise(resolve => { releaseFirst = resolve; });
    let firstArrived;
    const firstRequest = new Promise(resolve => { firstArrived = resolve; });
    const requests = [];
    const server = createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        requests.push({ path: request.url, username: body.username, authorization: request.headers.authorization });
        if (body.username === 'alice') {
            firstArrived();
            await firstGate;
        }
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ errors: [], result: `${body.username}-token` }));
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
        releaseFirst();
        Store.url = previous.url;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });

    const oldLogin = Store.connect('alice', 'old-password');
    await firstRequest;
    assert.equal(await Store.connect('bob', 'new-password'), true);
    assert.deepEqual(Store._settings, { token: 'bob-token', username: 'bob' });

    releaseFirst();
    assert.equal(await oldLogin, false);
    assert.deepEqual(Store._settings, { token: 'bob-token', username: 'bob' });
    assert.deepEqual(requests, [
        { path: '/api/remote/login', username: 'alice', authorization: undefined },
        { path: '/api/remote/login', username: 'bob', authorization: undefined },
    ]);
});
