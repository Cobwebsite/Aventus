import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(version, source) {
    const documentUser = TextDocument.create('file:///D:/round104/links.i18n.avt', 'json', version, source);
    return {
        file: { documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
        parsed: I18nParser.parse(documentUser),
    };
}

test('i18n parser distinguishes URL text and escaped quotes from line comments across edits', async () => {
    const simple = fixture(1, '{"link":{"en":"https://example.org/a","fr":"Lien"}}');
    assert.deepEqual(await service.validate(simple), []);
    assert.equal(simple.parsed.link.locales.en.value, 'https://example.org/a');

    const escaped = fixture(2, '{\n // translator: keep the quoted URL intact\n "link":{"en":"Say \\"go\\" at https://example.org/a","fr":"Lien"}\n}');
    assert.equal(escaped.parsed.link.locales.en.value, 'Say "go" at https://example.org/a');
    const diagnostics = await service.validate(escaped);
    assert.deepEqual(diagnostics, []);
});
