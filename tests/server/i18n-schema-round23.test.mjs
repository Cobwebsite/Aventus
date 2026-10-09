import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

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

test('i18n schema currently accepts a numeric translation without a diagnostic', async () => {
    const file = fixture('{"message":{"en":23,"fr":"Bonjour"}}');
    const diagnostics = await service.validate(file);
    assert.deepEqual(diagnostics, []);
});

test('i18n schema currently reports only a missing locale beside a boolean translation', async () => {
    const file = fixture('{"message":{"en":false}}');
    const diagnostics = await service.validate(file);
    assert.deepEqual(diagnostics.map(item => item.message), ['Missing locales fr']);
    assert.equal(file.file.documentUser.getText(diagnostics[0].range), '"message"');
});
