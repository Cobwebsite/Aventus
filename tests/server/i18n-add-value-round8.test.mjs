import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');

test('adding an i18n value currently returns no edit and leaves the source untouched', () => {
    const content = '{"existing":{"en":"Hello","fr":"Bonjour"}}';
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', 3, content);
    const file = {
        file: { uri: documentUser.uri, documentUser, contentUser: content, versionUser: 3 },
        parsedSrc: JSON.parse(content),
        build: { buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } } },
    };
    const result = AventusI18nLanguageService.getInstance().addValueToFile(file, 'new-key');
    assert.equal(result, undefined);
    assert.equal(file.file.documentUser.version, 3);
    assert.equal(file.file.documentUser.getText(), content);
    assert.equal(file.file.contentUser, content);
    assert.deepEqual(file.parsedSrc, { existing: { en: 'Hello', fr: 'Bonjour' } });
});
