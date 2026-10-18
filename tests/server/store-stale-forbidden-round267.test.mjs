import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store, QueryError } = await loadServerModule('store/Store.ts');

test('a stale forbidden Store publication logs out a newer session', async t => {
    const previous = {
        fetch: globalThis.fetch,
        settings: Store._settings,
        setSettings: Store.setSettings,
    };
    let releasePublication;
    const publicationResponse = new Promise(resolve => { releasePublication = resolve; });
    let publicationArrived;
    const publicationRequest = new Promise(resolve => { publicationArrived = resolve; });
    const requests = [];
    Store._settings = { token: 'old-token', username: 'alice' };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    globalThis.fetch = async (url, options) => {
        requests.push({ path: new URL(url).pathname, authorization: options.headers.Authorization });
        if (url.endsWith('/package/publish')) {
            publicationArrived();
            return publicationResponse;
        }
        if (url.endsWith('/login')) {
            return { status: 200, text: async () => '{"errors":[],"result":"new-token"}' };
        }
        return { status: 200, text: async () => '{"errors":[],"result":true}' };
    };
    t.after(() => {
        releasePublication?.({ status: 403, text: async () => '' });
        globalThis.fetch = previous.fetch;
        Store._settings = previous.settings;
        Store.setSettings = previous.setSettings;
    });

    const publication = Store.postWithErrors('/package/publish');
    await publicationRequest;
    assert.equal(await Store.connect('bob', 'password'), true);
    assert.deepEqual(Store._settings, { token: 'new-token', username: 'bob' });

    releasePublication({ status: 403, text: async () => '' });
    const result = await publication;
    assert.ok(result instanceof QueryError);
    assert.deepEqual(result.errors, [{ code: 403, message: 'You must connect to your account first' }]);
    assert.deepEqual(Store._settings, { token: '', username: undefined });
    assert.deepEqual(requests.map(request => request.path), [
        '/api/remote/package/publish', '/api/remote/login', '/api/remote/logout',
    ]);
    assert.match(requests[0].authorization, /^Bearer old-token\|.+/);
    assert.equal(requests[1].authorization, undefined);
    assert.match(requests[2].authorization, /^Bearer new-token\|.+/);
});
