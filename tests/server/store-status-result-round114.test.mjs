import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store } = await loadServerModule('store/Store.ts');

test('Store currently accepts a success payload even when HTTP reports an error', async () => {
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
        assert.deepEqual(results, [true, true, true]);
        assert.deepEqual(requests.map(([url]) => url), Array(3).fill(`${Store.url}/api/remote/login`));
        assert.equal(responses.length, 0);
    } finally {
        globalThis.fetch = previousFetch;
    }
});
