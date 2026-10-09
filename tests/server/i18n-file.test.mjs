import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusI18nFile }, { I18nParser }] = await loadServerModules([
    'language-services/i18n/File.ts',
    'language-services/i18n/Parser.ts',
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

test('component i18n export prefixes the module and key', () => {
    const file = fixture('{"hello":{"en":"Hello"}}', false);
    file.transformForExport();
    assert.deepEqual(file.exported, { en: { 'Demo°°hello': 'Hello' }, fr: {} });
});

test('i18n key lookup resolves positions within a key and excludes values', () => {
    const file = fixture('{"hello":{"en":"Hello"}}');
    assert.equal(file.getKeyFromLocation([{ line: 0, character: 2 }, { line: 0, character: 6 }]), 'hello');
    assert.equal(file.getKeyFromLocation([{ line: 0, character: 16 }, { line: 0, character: 20 }]), null);
});
