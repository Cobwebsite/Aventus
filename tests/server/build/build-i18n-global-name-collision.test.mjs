import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { InternalAventusFile }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'files/AventusFile.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('global i18n filename collision diagnoses both files and clears when one is removed', async t => {
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    SettingsManager.instance = { settings: { errorByBuild: false } };
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics() {} } };
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
    });
    const build = Object.create(Build.prototype);
    build.buildConfig = { i18n: { locales: ['en'], fallback: 'en' } };
    build.tsLanguageService = { i18nFiles: {} };
    build.i18nComponentsFiles = {};
    build.tsFiles = {};
    build.onFileDeleteUUIDs = {};
    build.diagnostics = new Map();
    build.build = () => {};
    build.rebuildAll = async () => {};
    const source = folder => new InternalAventusFile(TextDocument.create(
        'file:///D:/' + folder + '/@common.i18n.avt', 'json', 1,
        JSON.stringify({ [folder]: { en: 'Hello' } }),
    ));
    const first = source('one');
    const second = source('two');
    t.after(async () => {
        for (const file of [first, second]) {
            clearTimeout(file.delayValidate);
            if (!file.isDeleted) await file.triggerDelete();
        }
    });

    await build.registerFile(first, false);
    assert.deepEqual(await first.validate(false), []);
    await build.registerFile(second, false);
    for (const file of [first, second]) {
        const diagnostics = await file.validate(false);
        assert.equal(diagnostics.length, 1);
        assert.match(diagnostics[0].message, /Global i18n files need distinct names/);
        assert.deepEqual(diagnostics[0].range, {
            start: { line: 0, character: 0 },
            end: file.documentUser.positionAt(file.contentUser.length),
        });
    }

    await second.triggerDelete();
    assert.equal(build.tsLanguageService.i18nFiles[second.uri], undefined);
    assert.deepEqual(await first.validate(false), []);
});
