import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { loadServerModules } from '../helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const { WebSocket } = require('ws');
const [{ HttpServer }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'live-server/HttpServer.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('live HTTP recovers on the same instance after its configured port is released', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-port-retry-'));
    writeFileSync(join(root, 'index.html'), '<html><body>Recovered</body></html>');
    const occupied = createNetServer();
    occupied.listen(0, '127.0.0.1');
    await once(occupied, 'listening');
    const port = occupied.address().port;
    const previousSettings = SettingsManager.instance;
    const previousGeneric = GenericServer.instance;
    const errors = [];
    SettingsManager.instance = { settings: { liveserver: {
        host: '127.0.0.1', port, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 5, launch_browser: false, auto_close: false,
    } } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification() {}, showInformationMessage() {}, showErrorMessage: message => errors.push(message),
    } };
    const server = Object.create(HttpServer.prototype);
    let socket;
    try {
        await server.start();
        assert.equal(server.server.listening, false);
        assert.deepEqual(errors, [`The port ${port} is already in use`]);

        const occupiedClosed = once(occupied, 'close');
        occupied.close();
        await occupiedClosed;
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        assert.equal(server.server.address().port, port);

        const response = await fetch(`http://127.0.0.1:${port}/index.html`);
        assert.equal(response.status, 200);
        assert.match(await response.text(), /Recovered/);
        socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        await once(socket, 'open');
        const message = once(socket, 'message');
        server.updateGlobalCSS('theme', ':root { color: green; }');
        assert.deepEqual(JSON.parse((await message)[0].toString()), {
            cmd: 'update_global_css', params: { name: 'theme', css: ':root { color: green; }' },
        });
    } finally {
        socket?.terminate();
        server.stop();
        occupied.close();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        rmSync(root, { recursive: true, force: true });
    }
});
