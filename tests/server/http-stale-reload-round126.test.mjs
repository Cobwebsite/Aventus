import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ HttpServer }, { GenericServer }] = await loadServerModules([
    'live-server/HttpServer.ts', 'GenericServer.ts',
]);

test('a reload scheduled before HTTP stop does not reach clients connected after restart', async () => {
    const previousGeneric = GenericServer.instance;
    GenericServer.instance = { logLevel: 99, connection: { sendNotification() {} } };
    const server = Object.create(HttpServer.prototype);
    server.config = { delay: 20 };
    server.clients = [{ close() {} }];
    const received = [];
    try {
        server.reload();
        server.stop();
        assert.equal(server.reloadTimeout, undefined);
        server.clients = [{ readyState: 1, send: value => received.push(JSON.parse(value)) }];
        await new Promise(resolve => setTimeout(resolve, 50));
        assert.deepEqual(received, []);
    } finally {
        clearTimeout(server.reloadTimeout);
        GenericServer.instance = previousGeneric;
    }
});
