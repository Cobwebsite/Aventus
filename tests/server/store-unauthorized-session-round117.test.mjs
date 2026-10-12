import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store, QueryError } = await loadServerModule('store/Store.ts');

test('Store keeps a cached session after HTTP 401 and sends the same bearer token on retry', async () => {
    const previousFetch = globalThis.fetch;
    const previousSettings = Store._settings;
    const requests = [];
    Store._settings = { token: 'saved-token', username: 'alice' };
    let count = 0;
    globalThis.fetch = async (url, options) => {
        requests.push({ url, authorization: options.headers.Authorization });
        if (count++ === 0) return { status: 401, text: async () => '' };
        return { status: 200, text: async () => '{"errors":[],"result":true}' };
    };
    try {
        const denied = await Store.postWithErrors('/package/publish');
        assert.ok(denied instanceof QueryError);
        assert.deepEqual(denied.errors, [{ code: 401, message: 'No token provided' }]);
        assert.equal(Store.isConnected, true);
        assert.equal(Store.token, 'saved-token');
        assert.equal(await Store.postWithErrors('/package/publish'), true);
        assert.deepEqual(requests.map(request => request.url), Array(2).fill(`${Store.url}/api/remote/package/publish`));
        assert.equal(requests[1].authorization, requests[0].authorization);
        assert.match(requests[0].authorization, /^Bearer saved-token\|.+/);
    } finally {
        globalThis.fetch = previousFetch;
        Store._settings = previousSettings;
    }
});
