import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store, QueryError } = await loadServerModule('store/Store.ts');

test('an old Store request returning 401 clears a newer successful session', async t => {
    const previous = {
        fetch: globalThis.fetch,
        settings: Store._settings,
        setSettings: Store.setSettings,
    };
    let releaseOld;
    const oldResponse = new Promise(resolve => { releaseOld = resolve; });
    let oldArrived;
    const oldRequest = new Promise(resolve => { oldArrived = resolve; });
    const requests = [];
    Store._settings = { token: 'old-token', username: 'alice' };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    globalThis.fetch = async (url, options) => {
        requests.push({ url, authorization: options.headers.Authorization });
        if (url.endsWith('/package/publish')) {
            oldArrived();
            return oldResponse;
        }
        return { status: 200, text: async () => '{"errors":[],"result":"new-token"}' };
    };
    t.after(() => {
        releaseOld?.({ status: 401, text: async () => '' });
        globalThis.fetch = previous.fetch;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
    });

    const oldPublication = Store.postWithErrors('/package/publish');
    await oldRequest;
    assert.equal(await Store.connect('bob', 'password'), true);
    assert.deepEqual(Store._settings, { token: 'new-token', username: 'bob' });

    releaseOld({ status: 401, text: async () => '' });
    const result = await oldPublication;
    assert.ok(result instanceof QueryError);
    assert.deepEqual(result.errors, [{ code: 401, message: 'No token provided' }]);
    assert.deepEqual(Store._settings, { token: '', username: undefined });
    assert.deepEqual(requests.map(request => request.url), [
        `${Store.url}/api/remote/package/publish`,
        `${Store.url}/api/remote/login`,
    ]);
    assert.match(requests[0].authorization, /^Bearer old-token\|.+/);
    assert.equal(requests[1].authorization, undefined);
});
