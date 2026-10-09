import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Store, QueryError } = await loadServerModule('store/Store.ts');

test('Store exchanges JSON with a local HTTP endpoint and maps authorization failure', async t => {
    const received = [];
    const server = createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        received.push({
            method: request.method,
            path: request.url,
            type: request.headers['content-type'],
            authorization: request.headers.authorization,
            body: JSON.parse(Buffer.concat(chunks).toString()),
        });
        response.setHeader('Content-Type', 'application/json');
        if (received.length === 1) {
            response.end(JSON.stringify({ errors: [], result: 'session-token' }));
        } else {
            response.writeHead(401);
            response.end(JSON.stringify({ errors: [{ code: 401, message: 'denied' }] }));
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const previousUrl = Store.url;
    Store.url = `http://127.0.0.1:${server.address().port}`;
    t.after(async () => {
        Store.url = previousUrl;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });

    assert.equal(await Store.postWithErrors('/login', { username: 'alice', password: 'secret' }, { withoutBearer: true }), 'session-token');
    const rejected = await Store.postWithErrors('/login', { username: 'alice', password: 'wrong' }, { withoutBearer: true });
    assert.ok(rejected instanceof QueryError);
    assert.deepEqual(rejected.errors, [{ code: 401, message: 'No token provided' }]);
    assert.deepEqual(received, [
        { method: 'POST', path: '/api/remote/login', type: 'application/json', authorization: undefined,
            body: { username: 'alice', password: 'secret' } },
        { method: 'POST', path: '/api/remote/login', type: 'application/json', authorization: undefined,
            body: { username: 'alice', password: 'wrong' } },
    ]);
});
