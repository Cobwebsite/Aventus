import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }, { AddI18nValue }, { GetLocales }, { GetKeyFromPosition }, { ProjectManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts', 'cmds/i18n/AddI18nValue.ts',
    'communication/i18n/GetLocales.ts', 'communication/i18n/GetKeyFromPosition.ts',
    'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('i18n add edit applied to a real translation file is visible to locale and key commands', async () => {
    const uri = pathToUri('D:\\round51\\messages.i18n.avt');
    const viewUri = pathToUri('D:\\round51\\Button.wcv.avt');
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, '{"existing":{"en":"Existing","fr":"Existant"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        module: 'Round51', tsFiles: {}, htmlFiles: {}, i18nComponentsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), hideWarnings: false,
        build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    build.tsLanguageService = { i18nFiles: { [uri]: translation } };
    const previousProject = ProjectManager.instance;
    const previousServer = GenericServer.instance;
    const previousTimeout = globalThis.setTimeout;
    const edits = [];
    ProjectManager.instance = { getMatchingBuildsByUri: () => [build] };
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Select: async items => items.find(item => pathToUri(item.detail) === uri),
            sendNotification: (channel, body) => edits.push([channel, body]),
        },
    };
    globalThis.setTimeout = (callback, delay, ...args) => delay === 2000 ? 0 : previousTimeout(callback, delay, ...args);
    try {
        assert.deepEqual(await new GetLocales().run({ uri: viewUri }), { locales: ['en', 'fr'], fallback: 'en' });
        await AddI18nValue.run(viewUri, 'newKey', false);
        assert.equal(edits.length, 1);
        assert.equal(edits[0][0], 'aventus/editFile');
        assert.equal(edits[0][1][0].uri, uri);
        const updated = TextDocument.applyEdits(source.documentUser, edits[0][1][0].transformations[0]);
        await source.triggerContentChange(TextDocument.create(uri, 'json', 2, updated));
        assert.deepEqual(translation.parsedSrc.newKey, { en: 'newKey', fr: 'ⵌⵌ' });
        assert.equal(translation.exported.en.newKey, 'newKey');
        const start = source.documentUser.positionAt(updated.indexOf('newKey'));
        const end = source.documentUser.positionAt(updated.indexOf('newKey') + 'newKey'.length);
        assert.equal(await new GetKeyFromPosition().run({ uri, range: [start, end] }), 'newKey');
    } finally {
        globalThis.setTimeout = previousTimeout;
        ProjectManager.instance = previousProject;
        GenericServer.instance = previousServer;
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    }
});
