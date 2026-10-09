import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ HttpServer }, { SettingsManager }, { GenericServer }, { ColorInfo }] =
    await loadServerModules([
        'live-server/HttpServer.ts', 'settings/Settings.ts', 'GenericServer.ts',
        'color-picker/ColorInfo.ts',
    ]);

async function withServer(run, overrides = {}) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-round15-'));
    mkdirSync(join(root, 'docs'));
    writeFileSync(join(root, 'index.html'), '<html><head></head><body>Home</body></html>');
    writeFileSync(join(root, 'docs', 'page.html'), '<html><body>Docs</body></html>');
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    SettingsManager.instance = { settings: { liveserver: {
        host: '127.0.0.1', port: 0, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 5, launch_browser: false, auto_close: false,
        ...overrides,
    } } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification() {}, showInformationMessage() {}, showErrorMessage() {},
    } };
    const server = Object.create(HttpServer.prototype);
    try {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        return await run(`http://127.0.0.1:${server.server.address().port}`);
    } finally {
        server.stop();
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
}

test('HTTP HEAD returns HTML headers without a body', async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/index.html`, { method: 'HEAD' });
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type'), /text\/html/);
        assert.equal(await response.text(), '');
    });
});

test('HTTP redirects a directory request to its slash-terminated path', async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/docs`, { redirect: 'manual' });
        assert.equal(response.status, 301);
        assert.equal(response.headers.get('location'), '/docs/');
    });
});

test('HTTP auto-close setting injects the socket close handler into HTML', async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/index.html`);
        assert.equal(response.status, 200);
        assert.match(await response.text(), /socket\.onclose = function \(\) \{ setTimeout\(\(\) => window\.close\(\), 100\); \}/);
    }, { auto_close: true });
});

test('ColorInfo renders translucent colors across HEX, RGB and HSL notation', () => {
    const color = ColorInfo.fromHex('#336699');
    color.alpha = 0.5;
    assert.equal(color.toString('hexa'), '#33669980');
    assert.equal(color.toString('rgba'), 'rgba(51, 102, 153, 0.5)');
    assert.equal(color.toString('hsla'), 'hsla(210, 50%, 40%, 0.5)');
    assert.deepEqual(color.toRgb(), { r: 51, g: 102, b: 153 });
});
