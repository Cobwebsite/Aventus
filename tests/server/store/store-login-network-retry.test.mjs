import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Store }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'GenericServer.ts',
]);

test('Store retains the current session after a network login failure and replaces it on retry', async t => {
    const previous = {
        fetch: globalThis.fetch,
        settings: Store._settings,
        setSettings: Store.setSettings,
        error: GenericServer.error,
        sessionRevision: Store.sessionRevision,
    };
    const errors = [];
    const requests = [];
    Store._settings = { token: 'old-token', username: 'alice' };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    GenericServer.error = message => { errors.push(message); };
    globalThis.fetch = async (url, options) => {
        requests.push({ path: new URL(url).pathname, authorization: options.headers.Authorization });
        if (requests.length === 1) throw new Error('connection refused');
        return { status: 200, text: async () => '{"errors":[],"result":"new-token"}' };
    };
    t.after(() => {
        globalThis.fetch = previous.fetch;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
        GenericServer.error = previous.error;
        Store.sessionRevision = previous.sessionRevision;
    });

    assert.equal(await Store.connect('bob', 'password'), false);
    assert.deepEqual(Store._settings, { token: 'old-token', username: 'alice' });
    assert.deepEqual(errors, ['Error: connection refused']);

    assert.equal(await Store.connect('bob', 'password'), true);
    assert.deepEqual(Store._settings, { token: 'new-token', username: 'bob' });
    assert.deepEqual(requests.map(request => request.path), ['/api/remote/login', '/api/remote/login']);
    assert.deepEqual(requests.map(request => request.authorization), [undefined, undefined]);
});
