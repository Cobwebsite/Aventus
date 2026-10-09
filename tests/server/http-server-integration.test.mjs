import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { once } from 'node:events';
import { createServer as createNetServer } from 'node:net';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ HttpServer }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'live-server/HttpServer.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

async function startFixture(overrides = {}) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-'));
    writeFileSync(join(root, 'index.html'), '<html><head></head><body>Home</body></html>');
    writeFileSync(join(root, 'plain.txt'), 'Plain text');
    const settings = { host: '127.0.0.1', port: 0, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 5, launch_browser: false, browser: '', auto_close: false, ...overrides };
    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    const notifications = [];
    const messages = [];
    SettingsManager.instance = { settings: { liveserver: settings } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification: (name, params) => notifications.push([name, params]),
        showInformationMessage: value => messages.push(value),
        showErrorMessage: value => messages.push(value),
    } };
    const server = Object.create(HttpServer.prototype);
    try {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        const port = server.server.address().port;
        return {
            server, root, port, notifications, messages,
            cleanup: () => {
                server.stop();
                SettingsManager.instance = oldSettings;
                GenericServer.instance = oldServer;
                rmSync(root, { recursive: true, force: true });
            },
        };
    } catch (error) {
        server.stop();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
        throw error;
    }
}

test('HTTP server serves static assets and injects live reload into HTML', async () => {
    const fixture = await startFixture();
    try {
        assert.equal(fixture.server.server.listening, true);
        assert.equal(HttpServer.isRunning, false); // fixture is deliberately separate from the singleton
        const base = `http://127.0.0.1:${fixture.port}`;
        const html = await fetch(`${base}/index.html`);
        assert.equal(html.status, 200);
        const body = await html.text();
        assert.match(body, /Home/);
        assert.match(body, /WebSocket|websocket|new WebSocket/);
        const plain = await fetch(`${base}/plain.txt`);
        assert.equal(plain.status, 200);
        assert.equal(await plain.text(), 'Plain text');
        const crossOrigin = await fetch(`${base}/index.html`, { headers: { Origin: 'https://example.test' } });
        const rawHtml = await crossOrigin.text();
        assert.equal(rawHtml, '<html><head></head><body>Home</body></html>');
        assert.ok(fixture.notifications.length >= 1);
    } finally {
        fixture.cleanup();
    }
});

test('HTTP server serves its index fallback and injected-code endpoint', async () => {
    const fixture = await startFixture();
    try {
        const base = `http://127.0.0.1:${fixture.port}`;
        const fallback = await fetch(`${base}/missing-route`);
        assert.equal(fallback.status, 200);
        assert.match(await fallback.text(), /Home/);
        const script = await fetch(`${base}/?get_injected_code`);
        assert.equal(script.status, 200);
        assert.match(script.headers.get('content-type'), /text\/javascript/);
        assert.match(await script.text(), /ws:\/\//);
    } finally {
        fixture.cleanup();
    }
});

test('HTTP server detects a busy port and a free ephemeral port', async () => {
    const occupied = createNetServer();
    occupied.listen(0, '127.0.0.1');
    await once(occupied, 'listening');
    try {
        const server = Object.create(HttpServer.prototype);
        assert.equal(await server.portInUse('127.0.0.1', occupied.address().port), true);
        assert.equal(await server.portInUse('127.0.0.1', 0), false);
    } finally {
        occupied.close();
        await once(occupied, 'close');
    }
});

test('HTTP server start is idempotent and toggle closes clients and announces stop', async () => {
    const fixture = await startFixture();
    const oldServer = fixture.server.server;
    let closed = 0;
    fixture.server.clients.push({ close: () => { closed++; } });
    try {
        await fixture.server.start();
        assert.equal(fixture.server.server, oldServer);
        fixture.server.toggle();
        assert.equal(closed, 1);
        assert.equal(fixture.server.server, undefined);
        assert.ok(fixture.notifications.some(([name]) => name === 'aventus/server/stop'));
    } finally {
        fixture.cleanup();
    }
});

test('HTTP server increments a configured port already in use', async () => {
    const occupied = createNetServer();
    occupied.listen(0, '127.0.0.1');
    await once(occupied, 'listening');
    let fixture;
    try {
        const busyPort = occupied.address().port;
        fixture = await startFixture({ port: busyPort, autoIncrementPort: true });
        assert.notEqual(fixture.port, busyPort);
        assert.ok(fixture.port > busyPort);
    } finally {
        fixture?.cleanup();
        occupied.close();
        await once(occupied, 'close');
    }
});

test('HTTP server does not expose a file above its configured root', async () => {
    const fixture = await startFixture();
    const secretName = `${basename(fixture.root)}-secret.txt`;
    const secretPath = join(fixture.root, '..', secretName);
    writeFileSync(secretPath, 'PRIVATE_SENTINEL');
    try {
        const response = await fetch(`http://127.0.0.1:${fixture.port}/..%2F${secretName}`);
        assert.ok(!((await response.text()).includes('PRIVATE_SENTINEL')));
    } finally {
        rmSync(secretPath, { force: true });
        fixture.cleanup();
    }
});
