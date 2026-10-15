import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store, QueryError } = await loadServerModule('store/Store.ts');

test('Store rejects malformed response envelopes', async () => {
    const previousFetch = globalThis.fetch;
    const bodies = [
        { errors: { code: 7, message: 'invalid' }, result: true },
        { errors: { code: 7, message: 'invalid' } },
        { errors: [] },
        { errors: [{ code: 7, message: 'invalid' }] },
        { errors: [], result: true },
    ];
    globalThis.fetch = async () => ({ status: 200, text: async () => JSON.stringify(bodies.shift()) });
    try {
        for (let i = 0; i < 3; i++) {
            const result = await Store.postWithErrors('/login', {}, { withoutBearer: true });
            assert.ok(result instanceof QueryError);
            assert.deepEqual(result.errors, [{ code: -500, message: 'Wrong response format from the api' }]);
        }
        const apiError = await Store.postWithErrors('/login', {}, { withoutBearer: true });
        assert.ok(apiError instanceof QueryError);
        assert.deepEqual(apiError.errors, [{ code: 7, message: 'invalid' }]);
        assert.equal(await Store.postWithErrors('/login', {}, { withoutBearer: true }), true);
        assert.equal(bodies.length, 0);
    } finally {
        globalThis.fetch = previousFetch;
    }
});
