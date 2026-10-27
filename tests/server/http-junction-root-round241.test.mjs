import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ HttpServer }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'live-server/HttpServer.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('HTTP confines files and directory listings to the real root', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'aventus-http-junction-'));
    const root = join(workspace, 'public');
    const outside = join(workspace, 'private');
    mkdirSync(root);
    mkdirSync(outside);
    writeFileSync(join(root, 'index.html'), '<html><body>Index</body></html>');
    writeFileSync(join(outside, 'secret.txt'), 'OUTSIDE_ROOT_SENTINEL');
    symlinkSync(outside, join(root, 'linked'), 'junction');
    const inside = join(root, 'assets');
    mkdirSync(inside);
    writeFileSync(join(inside, 'public.txt'), 'INSIDE_ROOT_SENTINEL');
    symlinkSync(inside, join(root, 'local-link'), 'junction');
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
        const port = server.server.address().port;
        const response = await fetch(`http://127.0.0.1:${port}/linked/secret.txt`);
        assert.equal(response.status, 403);
        assert.equal((await fetch(`http://127.0.0.1:${port}/linked/`)).status, 403);
        const allowed = await fetch(`http://127.0.0.1:${port}/local-link/public.txt`);
        assert.equal(allowed.status, 200);
        assert.equal(await allowed.text(), 'INSIDE_ROOT_SENTINEL');
    } finally {
        server.stop();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousGeneric;
        rmSync(workspace, { recursive: true, force: true });
    }
});
