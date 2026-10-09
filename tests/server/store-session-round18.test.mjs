import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Store, QueryError }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'GenericServer.ts',
]);

test('Store leaves saved credentials unchanged when login returns no token', async () => {
    const originalPost = Store.post;
    const originalSetSettings = Store.setSettings;
    const writes = [];
    Store.post = async (uri, body, options) => {
        assert.equal(uri, '/login');
        assert.equal(body.username, 'dev');
        assert.equal(body.password, 'bad-password');
        assert.deepEqual(options, { withoutBearer: true });
        return null;
    };
    Store.setSettings = settings => writes.push(settings);
    try {
        assert.equal(await Store.connect('dev', 'bad-password'), false);
        assert.deepEqual(writes, []);
    } finally {
        Store.post = originalPost;
        Store.setSettings = originalSetSettings;
    }
});

test('Store clears credentials after logout fails on the network', async () => {
    const originalPost = Store.post;
    const originalSetSettings = Store.setSettings;
    const writes = [];
    Store.post = async uri => {
        assert.equal(uri, '/logout');
        return null;
    };
    Store.setSettings = settings => writes.push(settings);
    try {
        await Store.disconnect();
        assert.deepEqual(writes, [{ token: '', username: undefined }]);
    } finally {
        Store.post = originalPost;
        Store.setSettings = originalSetSettings;
    }
});

test('Store post reports all API errors in their original order', async () => {
    const originalFetch = globalThis.fetch;
    const originalError = GenericServer.error;
    const messages = [];
    GenericServer.error = message => messages.push(message);
    globalThis.fetch = async () => ({
        status: 422,
        text: async () => JSON.stringify({ errors: [
            { code: 1, message: 'name required' },
            { code: 2, message: 'version invalid' },
        ] }),
    });
    try {
        assert.equal(await Store.post('/login', {}, { withoutBearer: true }), null);
        assert.deepEqual(messages, ['name required', 'version invalid']);
    } finally {
        globalThis.fetch = originalFetch;
        GenericServer.error = originalError;
    }
});
