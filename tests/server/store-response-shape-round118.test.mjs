import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store } = await loadServerModule('store/Store.ts');

test('Store accepts malformed errors objects and may return undefined instead of an API error', async () => {
    const previousFetch = globalThis.fetch;
    const bodies = [
        { errors: { code: 7, message: 'invalid' }, result: true },
        { errors: { code: 7, message: 'invalid' } },
        { errors: [], result: true },
    ];
    globalThis.fetch = async () => ({ status: 200, text: async () => JSON.stringify(bodies.shift()) });
    try {
        assert.equal(await Store.postWithErrors('/login', {}, { withoutBearer: true }), true);
        assert.equal(await Store.postWithErrors('/login', {}, { withoutBearer: true }), undefined);
        assert.equal(await Store.postWithErrors('/login', {}, { withoutBearer: true }), true);
        assert.equal(bodies.length, 0);
    } finally {
        globalThis.fetch = previousFetch;
    }
});
