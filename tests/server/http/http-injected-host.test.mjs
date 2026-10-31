import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ HttpServer }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'live-server/HttpServer.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('live HTTP injected script rejects an invalid Host header', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-host-'));
    writeFileSync(join(root, 'index.html'), '<html><head></head><body>Home</body></html>');
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
    try {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        const hostileHost = "localhost';globalThis.injectedHostMarker=true;//";
        const response = await new Promise((resolve, reject) => {
            const req = request({ hostname: '127.0.0.1', port: server.server.address().port,
                path: '/?get_injected_code', headers: { Host: hostileHost } }, res => {
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.end();
        });
        assert.equal(response.status, 400);
        assert.equal(response.body, 'Invalid host');
    } finally {
        server.stop();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        rmSync(root, { recursive: true, force: true });
    }
});

test('live HTTP injected script serializes a valid Host header ahead of its query host', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-host-precedence-'));
    writeFileSync(join(root, 'index.html'), '<html><head></head><body>Home</body></html>');
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
    try {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        const response = await new Promise((resolve, reject) => {
            const req = request({ hostname: '127.0.0.1', port: server.server.address().port,
                path: '/?get_injected_code&host=query.example', headers: { Host: 'header.example' } }, res => {
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.end();
        });
        assert.match(response, /var address = "ws:\/\/header\.example\/ws";/);
        assert.doesNotMatch(response, /query\.example/);
    } finally {
        server.stop();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        rmSync(root, { recursive: true, force: true });
    }
});
