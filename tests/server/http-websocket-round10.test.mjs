import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const { WebSocket } = require('ws');
const [{ HttpServer }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'live-server/HttpServer.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('HTTP live server accepts WebSocket clients, broadcasts updates and removes closed clients', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-ws-'));
    writeFileSync(join(root, 'index.html'), '<html><body>Demo</body></html>');
    const oldSettings = SettingsManager.instance;
    const oldGeneric = GenericServer.instance;
    SettingsManager.instance = { settings: { liveserver: {
        host: '127.0.0.1', port: 0, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 1, launch_browser: false, auto_close: false,
    } } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification() {}, showInformationMessage() {}, showErrorMessage() {},
    } };
    const server = Object.create(HttpServer.prototype);
    let client;
    try {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        client = new WebSocket(`ws://127.0.0.1:${server.server.address().port}/ws`);
        await once(client, 'open');
        assert.equal(server.clients.length, 1);
        const message = once(client, 'message');
        server.updateGlobalCSS('theme', ':root { color: red; }');
        assert.deepEqual(JSON.parse((await message)[0].toString()), {
            cmd: 'update_global_css', params: { name: 'theme', css: ':root { color: red; }' },
        });
        const serverClose = once(server.clients[0], 'close');
        client.close();
        await Promise.all([once(client, 'close'), serverClose]);
        assert.equal(server.clients.length, 0);
    } finally {
        client?.terminate();
        server.stop();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldGeneric;
        rmSync(root, { recursive: true, force: true });
    }
});
