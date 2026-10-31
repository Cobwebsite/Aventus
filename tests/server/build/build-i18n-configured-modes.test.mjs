import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'project/Build.ts', 'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);

test('unsupported i18n modes are rejected while singleFile still writes translations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-i18n-modes-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.buildConfig = { i18n: { locales: ['en', 'fr'] } };
    build.tsLanguageService = { i18nFiles: {
        'file:///messages.i18n.avt': { exported: { en: { title: 'Hello' }, fr: { title: 'Bonjour' } } },
    } };
    build.i18nComponentsFiles = {};
    build.writeFile = async (path, content) => writeFileSync(path, content);

    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    t.after(() => { SettingsManager.instance = previousSettings; });
    const configUri = 'file:///D:/round234/aventus.conf.avt';
    const configText = JSON.stringify({ module: 'Demo', build: [{ src: [], compile: [
        { i18n: [{ output: './attribute', mode: 'basedOnAttribute' }] },
        { i18n: [{ output: './include', mode: 'include' }] },
    ] }] });
    const config = TextDocument.create(configUri, 'json', 1, configText);
    const service = AventusJSONLanguageService.getInstance();
    const diagnostics = await service.validate({ documentUser: config });
    assert.deepEqual(diagnostics.map(item => config.getText(item.range)), ['"basedOnAttribute"', '"include"']);
    assert.ok(diagnostics.every(item => item.message.includes('Value is not accepted')));
    assert.equal(await service.getConfig(config), null);

    const working = join(root, 'singleFile');
    await build.writeBuildI18n([{ mode: 'singleFile', output: [working] }]);
    assert.deepEqual(JSON.parse(readFileSync(join(working, 'en.json'), 'utf8')), { title: 'Hello' });
    assert.deepEqual(JSON.parse(readFileSync(join(working, 'fr.json'), 'utf8')), { title: 'Bonjour' });
});
