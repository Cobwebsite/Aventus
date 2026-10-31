import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(content) {
    const documentUser = TextDocument.create('file:///D:/app/round23.i18n.avt', 'json', 1, content);
    return {
        file: { uri: documentUser.uri, documentUser, contentUser: content },
        parsed: I18nParser.parse(documentUser),
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
    };
}

test('i18n schema reports a numeric translation at its value', async () => {
    const file = fixture('{"message":{"en":23,"fr":"Bonjour"}}');
    const diagnostics = await service.validate(file);
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0].message, /string/i);
    assert.equal(file.file.documentUser.getText(diagnostics[0].range), '23');
});

test('i18n schema reports a boolean translation at its value', async () => {
    const file = fixture('{"message":{"en":false}}');
    const diagnostics = await service.validate(file);
    assert.equal(diagnostics.length, 2);
    const typeError = diagnostics.find(item => /string/i.test(item.message));
    const missingLocale = diagnostics.find(item => item.message === 'Missing locales fr');
    assert.equal(file.file.documentUser.getText(typeError.range), 'false');
    assert.equal(file.file.documentUser.getText(missingLocale.range), '"message"');
});
