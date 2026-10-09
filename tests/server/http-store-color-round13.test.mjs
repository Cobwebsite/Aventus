import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer as createNetServer } from 'node:net';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ HttpServer }, { Store, QueryError }, { SettingsManager }, { GenericServer }, { ColorPicker }] =
    await loadServerModules([
        'live-server/HttpServer.ts', 'store/Store.ts', 'settings/Settings.ts',
        'GenericServer.ts', 'color-picker/ColorPicker.ts',
    ]);

test('Store leaves saved credentials untouched when login has no token', async () => {
    const oldPost = Store.post;
    const oldSetSettings = Store.setSettings;
    const writes = [];
    Store.post = async () => null;
    Store.setSettings = value => writes.push(value);
    try {
        assert.equal(await Store.connect('developer', 'invalid'), false);
        assert.deepEqual(writes, []);
    } finally {
        Store.post = oldPost;
        Store.setSettings = oldSetSettings;
    }
});

test('Store clears local credentials even when remote logout reports an error', async () => {
    const oldPost = Store.post;
    const oldSetSettings = Store.setSettings;
    const writes = [];
    Store.post = async uri => {
        assert.equal(uri, '/logout');
        return null;
    };
    Store.setSettings = value => writes.push(value);
    try {
        await Store.disconnect();
        assert.deepEqual(writes, [{ token: '', username: undefined }]);
    } finally {
        Store.post = oldPost;
        Store.setSettings = oldSetSettings;
    }
});

test('Store publishes optional template metadata and repeated tags', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-metadata-'));
    const folder = join(root, 'template');
    mkdirSync(folder);
    mkdirSync(join(root, 'temp'));
    const config = join(folder, 'template.avt.ts');
    writeFileSync(config, 'export class Template {}');
    const oldServer = GenericServer.instance;
    const oldPost = Store.postWithErrors;
    let submitted;
    GenericServer.instance = { _savePath: root };
    Store.postWithErrors = async (uri, form) => {
        assert.equal(uri, '/template/publish');
        submitted = form;
        return true;
    };
    try {
        assert.equal(await Store.publishTemplate({
            config, folderPath: folder, name: 'Starter', description: 'Example', version: '2.0.0',
            isProject: false, isGlobal: true, organization: 'Team',
            documentation: 'https://example.test/docs', repository: 'https://example.test/repo',
            tags: ['starter', 'global'],
        }), true);
        assert.equal(submitted.get('is_project'), '0');
        assert.equal(submitted.get('is_global'), '1');
        assert.equal(submitted.get('organization'), 'Team');
        assert.equal(submitted.get('documentation'), 'https://example.test/docs');
        assert.equal(submitted.get('repository'), 'https://example.test/repo');
        assert.deepEqual(submitted.getAll('tags[]'), ['starter', 'global']);
        assert.equal(submitted.get('readMe'), null);
    } finally {
        Store.postWithErrors = oldPost;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Store preserves multiple API errors and the public post reports each one', async () => {
    const oldFetch = globalThis.fetch;
    const oldServer = GenericServer.instance;
    const oldLog = console.log;
    const logs = [];
    GenericServer.instance = { logLevel: 4, connection: {} };
    console.log = message => logs.push(message);
    globalThis.fetch = async () => ({ status: 200, text: async () => JSON.stringify({
        errors: [{ code: 11, message: 'First' }, { code: 12, message: 'Second' }],
    }) });
    try {
        const result = await Store.postWithErrors('/login', {}, { withoutBearer: true });
        assert.ok(result instanceof QueryError);
        assert.deepEqual(result.errors.map(error => error.code), [11, 12]);
        assert.equal(await Store.post('/login', {}, { withoutBearer: true }), null);
        assert.deepEqual(logs, ['First', 'Second']);
    } finally {
        globalThis.fetch = oldFetch;
        GenericServer.instance = oldServer;
        console.log = oldLog;
    }
});

test('HTTP injected script uses the request host and permits cross-origin retrieval', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-script-'));
    writeFileSync(join(root, 'index.html'), '<html><body>Demo</body></html>');
    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    SettingsManager.instance = { settings: { liveserver: {
        host: '127.0.0.1', port: 0, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 1, launch_browser: false, auto_close: false,
    } } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification() {}, showInformationMessage() {}, showErrorMessage() {},
    } };
    const server = Object.create(HttpServer.prototype);
    try {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        const port = server.server.address().port;
        const response = await fetch(`http://127.0.0.1:${port}/?get_injected_code`, {
            headers: { Origin: 'https://example.test' },
        });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('access-control-allow-origin'), '*');
        assert.match(await response.text(), new RegExp(`ws://127\\.0\\.0\\.1:${port}/ws`));
    } finally {
        server.stop();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('HTTP start reports an occupied configured port without listening when incrementing is disabled', async () => {
    const occupied = createNetServer();
    occupied.listen(0, '127.0.0.1');
    await once(occupied, 'listening');
    const root = mkdtempSync(join(tmpdir(), 'aventus-http-busy-'));
    writeFileSync(join(root, 'index.html'), '<html><body>Demo</body></html>');
    const port = occupied.address().port;
    const messages = [];
    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    SettingsManager.instance = { settings: { liveserver: {
        host: '127.0.0.1', port, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 1, launch_browser: false, auto_close: false,
    } } };
    GenericServer.instance = { logLevel: 99, connection: {
        sendNotification() {}, showInformationMessage() {},
        showErrorMessage: message => messages.push(message),
    } };
    const server = Object.create(HttpServer.prototype);
    try {
        await server.start();
        assert.equal(server.server.listening, false);
        assert.deepEqual(messages, [`The port ${port} is already in use`]);
    } finally {
        server.stop();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        occupied.close();
        await once(occupied, 'close');
        rmSync(root, { recursive: true, force: true });
    }
});

test('color picker returns exact ranges for repeated colors on later lines', () => {
    const text = '\n.a { color: red; }\n.b { color: blue; }';
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, text);
    const colors = ColorPicker.onDocumentColor(document);
    assert.deepEqual(colors.map(value => value.range), [
        { start: { line: 1, character: 12 }, end: { line: 1, character: 15 } },
        { start: { line: 2, character: 12 }, end: { line: 2, character: 16 } },
    ]);
    assert.deepEqual(colors.map(value => value.color), [
        { red: 1, green: 0, blue: 0, alpha: 1 },
        { red: 0, green: 0, blue: 1, alpha: 1 },
    ]);
});
