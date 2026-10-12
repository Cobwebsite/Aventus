import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { Build }, { FilesManager }, { SettingsManager }] = await loadServerModules([
    'GenericServer.ts', 'project/Build.ts', 'files/FilesManager.ts', 'settings/Settings.ts',
]);

test('LSP noBuild suppresses requested output while read services and settings refresh remain available', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.no-build-round56-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'generated.js');
    const oldServer = GenericServer.instance;
    const oldFiles = FilesManager.instance;
    const oldSettings = SettingsManager.instance;
    t.after(() => {
        GenericServer.instance = oldServer;
        FilesManager.instance = oldFiles;
        SettingsManager.instance = oldSettings;
    });

    const handlers = {};
    let currentSettings = { logLevel: 4 };
    const connection = new Proxy({
        getSettings: async () => currentSettings,
        getSettingsHtml: async () => ({}),
        delayBetweenBuild: () => 0,
    }, {
        get(target, key) {
            if (key in target) return target[key];
            if (String(key).startsWith('on')) return callback => { handlers[key] = callback; };
        },
    });
    const server = new GenericServer(connection);
    const settings = Object.create(SettingsManager.prototype);
    settings.firstInit = true;
    settings.cbOnSettingsChange = [];
    settings.cbOnSettingsChangeHtml = [];
    SettingsManager.instance = settings;
    settings.initSettings({});
    settings.setSettingsHtml({});

    handlers.onInitialize({ workspaceFolders: [{ uri: 'file:///workspace' }],
        savePath: root, extensionPath: root, isIDE: false, noBuild: true });
    await server.loadSettings();
    server.isLoading = false;
    assert.equal(GenericServer.noBuild, true);

    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build._build = async () => writeFileSync(output, 'compiled');
    await build.build();
    assert.equal(existsSync(output), false);

    const document = TextDocument.create('file:///workspace/widget.wcl.avt', 'typescript', 1, 'class Widget {}');
    const position = { line: 0, character: 6 };
    FilesManager.instance = {
        onHover: async () => ({ contents: 'Widget' }),
        onDefinition: async () => ({ uri: document.uri, range: { start: position, end: position } }),
    };
    assert.deepEqual(await handlers.onHover(document, position), { contents: 'Widget' });
    assert.equal((await handlers.onDefinition(document, position)).uri, document.uri);

    currentSettings = { logLevel: 1, watchFiles: true };
    await handlers.onDidChangeConfiguration();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(GenericServer.noBuild, true);
    assert.equal(settings.settings.watchFiles, true);
    await build.build();
    assert.equal(existsSync(output), false);
});
