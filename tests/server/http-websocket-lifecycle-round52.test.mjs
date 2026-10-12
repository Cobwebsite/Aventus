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

async function fixture() {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-ws-life-'));
    writeFileSync(join(root, 'index.html'), '<html><head></head><body>Live</body></html>');
    writeFileSync(join(root, 'asset.txt'), 'asset v1');
    const previousSettings = SettingsManager.instance;
    const previousGeneric = GenericServer.instance;
    SettingsManager.instance = { settings: { liveserver: {
        host: '127.0.0.1', port: 0, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 5, launch_browser: false, auto_close: false,
    } } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification() {}, showInformationMessage() {}, showErrorMessage() {},
    } };
    const server = Object.create(HttpServer.prototype);
    const sockets = [];
    const start = async () => {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        return server.server.address().port;
    };
    const connect = async port => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        sockets.push(socket);
        await once(socket, 'open');
        return socket;
    };
    const cleanup = () => {
        for (const socket of sockets) socket.terminate();
        server.stop();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        rmSync(root, { recursive: true, force: true });
    };
    return { root, server, start, connect, cleanup };
}

test('live server broadcasts to two clients and keeps serving the survivor after one disconnects', async () => {
    const f = await fixture();
    try {
        const port = await f.start();
        const first = await f.connect(port);
        const second = await f.connect(port);
        assert.equal(f.server.clients.length, 2);

        const firstMessage = once(first, 'message');
        const secondMessage = once(second, 'message');
        f.server.updateComponent('class Demo {}', 'demo-card', ['child-card']);
        const expected = { cmd: 'update_component', params: {
            js: 'class Demo {}', element: 'demo-card', children: ['child-card'],
        } };
        assert.deepEqual(JSON.parse((await firstMessage)[0].toString()), expected);
        assert.deepEqual(JSON.parse((await secondMessage)[0].toString()), expected);

        const closedOnServer = once(f.server.clients[0], 'close');
        first.close();
        await Promise.all([once(first, 'close'), closedOnServer]);
        assert.equal(f.server.clients.length, 1);
        const survivorMessage = once(second, 'message');
        f.server.updateCSS('.demo {}', 'demo-card', []);
        assert.deepEqual(JSON.parse((await survivorMessage)[0].toString()), {
            cmd: 'update_css', params: { css: '.demo {}', element: 'demo-card', children: [] },
        });
        const asset = await fetch(`http://127.0.0.1:${port}/asset.txt`);
        assert.equal(await asset.text(), 'asset v1');
    } finally {
        f.cleanup();
    }
});

test('live server closes its client on stop and accepts a new client after restart', async () => {
    const f = await fixture();
    try {
        const firstPort = await f.start();
        const first = await f.connect(firstPort);
        const oldHttpServer = f.server.server;
        const clientClosed = once(first, 'close');
        const serverClosed = once(oldHttpServer, 'close');
        f.server.stop();
        await Promise.all([clientClosed, serverClosed]);
        assert.equal(f.server.clients.length, 0);

        writeFileSync(join(f.root, 'asset.txt'), 'asset v2');
        const secondPort = await f.start();
        const second = await f.connect(secondPort);
        const message = once(second, 'message');
        f.server.updateGlobalCSS('theme', ':root { color: blue; }');
        assert.deepEqual(JSON.parse((await message)[0].toString()), {
            cmd: 'update_global_css', params: { name: 'theme', css: ':root { color: blue; }' },
        });
        const asset = await fetch(`http://127.0.0.1:${secondPort}/asset.txt`);
        assert.equal(await asset.text(), 'asset v2');
    } finally {
        f.cleanup();
    }
});
