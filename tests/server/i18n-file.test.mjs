import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusI18nFile }, { I18nParser }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'language-services/i18n/File.ts',
    'language-services/i18n/Parser.ts',
    'language-services/ts/component/File.ts',
]);

function fixture(content, isGlobal = true) {
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', 1, content);
    const file = Object.create(AventusI18nFile.prototype);
    file._file = { uri: documentUser.uri, documentUser };
    file.parsedSrc = JSON.parse(content);
    file.parsed = I18nParser.parse(documentUser);
    file._build = { buildConfig: { i18n: { locales: ['en', 'fr'] } }, module: 'Demo', tsFiles: {} };
    file.isGlobal = isGlobal;
    return file;
}

test('global i18n export groups translations by configured locale', () => {
    const file = fixture('{"hello":{"en":"Hello","fr":"Bonjour","de":"Hallo"},"bye":{"en":"Bye"}}');
    file.transformForExport();
    assert.deepEqual(file.exported, {
        en: { hello: 'Hello', bye: 'Bye' },
        fr: { hello: 'Bonjour' },
    });
    assert.deepEqual(file.keys, ['hello', 'bye']);
});

test('component i18n without a matching class reports an error and exports no keys', async () => {
    const file = fixture('{"hello":{"en":"Hello"}}', false);
    file.transformForExport();
    assert.deepEqual(file.exported, { en: {}, fr: {} });
    assert.deepEqual((await file.onValidate()).map(item => item.message), [
        'Missing locales fr', 'No matching component class found for this translation file',
    ]);
});

test('component i18n with a matching class retains its full export prefix', async () => {
    const file = fixture('{"hello":{"en":"Hello"}}', false);
    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    component._file = { isDeleted: false };
    component._componentClassName = 'Button';
    component.fileParsed = { classes: { Button: { fullName: 'Widgets.Button' } } };
    file.build.tsFiles[file.file.uri.replace('.i18n.avt', '.wcl.avt')] = component;

    file.transformForExport();

    assert.deepEqual(file.exported, { en: { 'Demo°Widgets°Button°hello': 'Hello' }, fr: {} });
    assert.equal((await file.onValidate()).some(item => item.message.includes('matching component')), false);

    component._file.isDeleted = true;
    file.transformForExport();
    assert.deepEqual(file.exported, { en: {}, fr: {} });
    assert.equal((await file.onValidate()).some(item => item.message.includes('matching component')), true);
});

test('component deletion invalidates its translation in the component lifecycle', async () => {
    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    const componentUri = 'file:///Button.wcl.avt';
    const i18nUri = 'file:///Button.i18n.avt';
    const events = [];
    component._file = { uri: componentUri, isDeleted: true };
    component._build = {
        i18nComponentsFiles: { [i18nUri]: {
            transformForExport: () => events.push('export'),
            validate: async () => events.push('validate'),
        } },
        npmBuilder: { unregister: () => events.push('npm') },
        scssLanguageService: { removeInternalDefinition: () => events.push('scss') },
        htmlLanguageService: {
            removeInternalDefinition: () => events.push('html'),
            removeInternalTagUri: () => events.push('tag'),
        },
    };
    component.mustBeAddedToLanguageService = () => false;

    await component.onDelete();

    assert.deepEqual(events, ['export', 'validate', 'npm', 'scss', 'html', 'tag']);
});

test('i18n key lookup resolves positions within a key and excludes values', () => {
    const file = fixture('{"hello":{"en":"Hello"}}');
    assert.equal(file.getKeyFromLocation([{ line: 0, character: 2 }, { line: 0, character: 6 }]), 'hello');
    assert.equal(file.getKeyFromLocation([{ line: 0, character: 16 }, { line: 0, character: 20 }]), null);
});
