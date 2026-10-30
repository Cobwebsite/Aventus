import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Store }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'GenericServer.ts',
]);

test('a stale forbidden login preserves the newer Store session', async t => {
    const previous = {
        fetch: globalThis.fetch,
        settings: Store._settings,
        setSettings: Store.setSettings,
        sessionRevision: Store.sessionRevision,
        error: GenericServer.error,
    };
    let releaseOld;
    const oldResponse = new Promise(resolve => { releaseOld = resolve; });
    let signalOld;
    const oldArrived = new Promise(resolve => { signalOld = resolve; });
    const requests = [];
    const errors = [];
    Store._settings = { token: '', username: undefined };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    GenericServer.error = message => { errors.push(message); };
    globalThis.fetch = async (url, options) => {
        requests.push({ path: new URL(url).pathname, authorization: options.headers.Authorization });
        if (requests.length === 1) {
            signalOld();
            return oldResponse;
        }
        if (url.endsWith('/logout')) {
            return { status: 200, text: async () => '{"errors":[],"result":true}' };
        }
        return { status: 200, text: async () => '{"errors":[],"result":"new-token"}' };
    };
    t.after(() => {
        releaseOld?.({ status: 403, text: async () => '' });
        globalThis.fetch = previous.fetch;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
        Store.sessionRevision = previous.sessionRevision;
        GenericServer.error = previous.error;
    });

    const oldLogin = Store.connect('alice', 'old-password');
    await oldArrived;
    assert.equal(await Store.connect('bob', 'new-password'), true);
    assert.deepEqual(Store._settings, { token: 'new-token', username: 'bob' });

    releaseOld({ status: 403, text: async () => '' });
    assert.equal(await oldLogin, false);
    assert.deepEqual(Store._settings, { token: 'new-token', username: 'bob' });
    assert.deepEqual(requests.map(request => request.path), [
        '/api/remote/login', '/api/remote/login',
    ]);
    assert.deepEqual(requests.slice(0, 2).map(request => request.authorization), [undefined, undefined]);
    assert.deepEqual(errors, ['You must connect to your account first']);
});
