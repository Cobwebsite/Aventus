import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store, QueryError } = await loadServerModule('store/Store.ts');

test('Store rejects success payloads when HTTP reports an error and accepts a later retry', async () => {
    const previousFetch = globalThis.fetch;
    const responses = [
        { status: 500, text: async () => '{"errors":[],"result":true}' },
        { status: 429, text: async () => '{"errors":[],"result":true}' },
        { status: 200, text: async () => '{"errors":[],"result":true}' },
    ];
    const requests = [];
    globalThis.fetch = async (...args) => {
        requests.push(args);
        return responses.shift();
    };
    try {
        const results = [];
        for (let i = 0; i < 3; i++) {
            results.push(await Store.postWithErrors('/login', { username: 'dev' }, { withoutBearer: true }));
        }
        assert.ok(results[0] instanceof QueryError);
        assert.deepEqual(results[0].errors, [{ code: 500, message: 'Store request failed with HTTP 500' }]);
        assert.ok(results[1] instanceof QueryError);
        assert.deepEqual(results[1].errors, [{ code: 429, message: 'Store request failed with HTTP 429' }]);
        assert.equal(results[2], true);
        assert.deepEqual(requests.map(([url]) => url), Array(3).fill(`${Store.url}/api/remote/login`));
        assert.equal(responses.length, 0);
    } finally {
        globalThis.fetch = previousFetch;
    }
});
