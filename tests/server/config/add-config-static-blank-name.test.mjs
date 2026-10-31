import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }, { AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts', 'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);

test('un nom statique vide ou composé d espaces crée une section sans name', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-blank-name-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [{ name: 'Web', src: [], compile: [{ output: './dist/web.js' }] }], static: [] }));
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    t.after(() => {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
    });
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    const names = ['', '   '];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Static' }),
        Input: async () => names.shift(),
        sendNotification: (...args) => notifications.push(args),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await add();
    await add();

    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).static, [
        { input: '', output: '' },
        { input: '', output: '' },
    ]);
    const documentUser = TextDocument.create(uri, 'json', 1, readFileSync(path, 'utf8'));
    assert.deepEqual(await AventusJSONLanguageService.getInstance().validate({ documentUser }), []);
    assert.deepEqual(notifications, [
        ['aventus/openfile', [uri]], ['aventus/openfile', [uri]],
    ]);
});
