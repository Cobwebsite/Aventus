import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusI18nFile }, { I18nParser }, { GetLocales }, { GetKeyFromPosition }, { ProjectManager }] = await loadServerModules([
    'language-services/i18n/File.ts',
    'language-services/i18n/Parser.ts',
    'communication/i18n/GetLocales.ts',
    'communication/i18n/GetKeyFromPosition.ts',
    'project/ProjectManager.ts',
]);

function withBuilds(builds, callback) {
    const previous = ProjectManager.instance;
    ProjectManager.instance = { getMatchingBuildsByUri: () => builds };
    return Promise.resolve().then(callback).finally(() => { ProjectManager.instance = previous; });
}

test('i18n locale request skips matching builds without a complete locale configuration', async () => {
    const command = new GetLocales();
    await withBuilds([
        { buildConfig: { i18n: { locales: ['en'] } } },
        { buildConfig: { i18n: { fallback: 'fr' } } },
        { buildConfig: { i18n: { locales: ['fr', 'en'], fallback: 'fr' } } },
    ], async () => {
        assert.deepEqual(await command.run({ uri: 'file:///messages.i18n.avt' }), { locales: ['fr', 'en'], fallback: 'fr' });
    });
    await withBuilds([{ buildConfig: {} }], async () => {
        assert.equal(await command.run({ uri: 'file:///messages.i18n.avt' }), null);
    });
});

test('i18n key request prefers a component key and then searches later builds', async () => {
    const command = new GetKeyFromPosition();
    const uri = 'file:///messages.i18n.avt';
    const range = [{ line: 1, character: 2 }, { line: 1, character: 4 }];
    const calls = [];
    await withBuilds([
        {
            i18nComponentsFiles: { [uri]: { getKeyFromLocation: () => { calls.push('first-component'); return null; } } },
            tsLanguageService: { i18nFiles: {} },
        },
        {
            i18nComponentsFiles: { [uri]: { getKeyFromLocation: value => { calls.push('second-component'); assert.equal(value, range); return 'welcome'; } } },
            tsLanguageService: { i18nFiles: { [uri]: { getKeyFromLocation: () => { calls.push('second-ts'); return 'wrong'; } } } },
        },
    ], async () => {
        assert.equal(await command.run({ uri, range }), 'welcome');
        assert.deepEqual(calls, ['first-component', 'second-component']);
    });
});

test('i18n key lookup uses multiline document offsets and excludes adjacent keys', () => {
    const source = '{\n  "first": {"en":"One"},\n  "second": {"en":"Two"}\n}';
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', 1, source);
    const file = Object.create(AventusI18nFile.prototype);
    file._file = { uri: documentUser.uri, documentUser };
    file.parsed = I18nParser.parse(documentUser);
    assert.equal(file.getKeyFromLocation([{ line: 2, character: 4 }, { line: 2, character: 9 }]), 'second');
    assert.equal(file.getKeyFromLocation([{ line: 1, character: 4 }, { line: 2, character: 9 }]), null);
    assert.equal(file.getKeyFromLocation([{ line: 2, character: 19 }, { line: 2, character: 21 }]), null);
});
