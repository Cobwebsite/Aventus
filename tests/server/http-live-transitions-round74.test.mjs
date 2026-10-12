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
    const firstRoot = mkdtempSync(join(tmpdir(), 'aventus-http-first-'));
    const secondRoot = mkdtempSync(join(tmpdir(), 'aventus-http-second-'));
    const previousSettings = SettingsManager.instance;
    const previousGeneric = GenericServer.instance;
    const settings = { host: '127.0.0.1', port: 0, autoIncrementPort: false,
        rootFolder: firstRoot, indexFile: 'index.html', delay: 5,
        launch_browser: false, auto_close: false };
    writeFileSync(join(firstRoot, 'index.html'), '<html><head></head><body>First</body></html>');
    writeFileSync(join(secondRoot, 'index.html'), '<html><head></head><body>Second</body></html>');
    SettingsManager.instance = { settings: { liveserver: settings } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification() {}, showInformationMessage() {}, showErrorMessage() {},
    } };
    const server = Object.create(HttpServer.prototype);
    const start = async () => {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        return `http://127.0.0.1:${server.server.address().port}`;
    };
    const cleanup = () => {
        clearTimeout(server.reloadTimeout);
        server.stop();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        rmSync(firstRoot, { recursive: true, force: true });
        rmSync(secondRoot, { recursive: true, force: true });
    };
    return { server, settings, firstRoot, secondRoot, start, cleanup };
}

test('live HTTP serves edited HTML with a fresh injection and matching byte count', async () => {
    const f = await fixture();
    try {
        const base = await f.start();
        const first = await fetch(`${base}/index.html`);
        assert.equal(first.status, 200);
        assert.match(await first.text(), /First/);
        const updated = '<html><head></head><body>Second édition & 🍋</body></html>';
        writeFileSync(join(f.firstRoot, 'index.html'), updated);
        const second = await fetch(`${base}/index.html`);
        const body = await second.text();
        assert.equal(second.status, 200);
        assert.match(body, /Second édition & 🍋/);
        assert.match(body, /new WebSocket|WebSocket/);
        assert.equal(Number(second.headers.get('content-length')), Buffer.byteLength(body));
        const crossOrigin = await fetch(`${base}/index.html`, { headers: { Origin: 'https://example.test' } });
        assert.equal(await crossOrigin.text(), updated);
    } finally {
        f.cleanup();
    }
});

test('live HTTP restart adopts a new root and stops serving the former root', async () => {
    const f = await fixture();
    try {
        const firstBase = await f.start();
        writeFileSync(join(f.firstRoot, 'only-first.txt'), 'first root');
        assert.equal(await (await fetch(`${firstBase}/only-first.txt`)).text(), 'first root');
        const closed = once(f.server.server, 'close');
        f.server.stop();
        await closed;
        f.settings.rootFolder = f.secondRoot;
        const secondBase = await f.start();
        const index = await fetch(`${secondBase}/index.html`);
        assert.match(await index.text(), /Second/);
        const former = await fetch(`${secondBase}/only-first.txt`);
        assert.doesNotMatch(await former.text(), /first root/);
    } finally {
        f.cleanup();
    }
});

test('live HTTP reload burst after restart reaches only the current WebSocket client', async () => {
    const f = await fixture();
    let first;
    let second;
    try {
        const firstBase = await f.start();
        first = new WebSocket(firstBase.replace('http:', 'ws:') + '/ws');
        await once(first, 'open');
        const firstClosed = once(first, 'close');
        const oldServerClosed = once(f.server.server, 'close');
        f.server.stop();
        await Promise.all([firstClosed, oldServerClosed]);
        const secondBase = await f.start();
        second = new WebSocket(secondBase.replace('http:', 'ws:') + '/ws');
        await once(second, 'open');
        const reloadMessage = once(second, 'message');
        f.server.reload();
        f.server.reload();
        assert.deepEqual(JSON.parse((await reloadMessage)[0].toString()), { cmd: 'reload', params: {} });
        assert.equal(f.server.clients.length, 1);
    } finally {
        first?.terminate();
        second?.terminate();
        f.cleanup();
    }
});
