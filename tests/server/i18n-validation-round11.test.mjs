import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(source, locales) {
    const documentUser = TextDocument.create('file:///round11.i18n.avt', 'json', 1, source);
    return {
        file: { uri: documentUser.uri, documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales } } },
        parsed: I18nParser.parse(documentUser),
        parsedSrc: JSON.parse(source),
    };
}

test('i18n diagnostics group multiple missing locales by key and retain warning severity', async () => {
    const source = '{"first":{"en":"First"},"second":{"fr":"Second","de":"Zweite"}}';
    const file = fixture(source, ['en', 'fr', 'it']);
    const diagnostics = await service.validate(file);
    const missing = diagnostics.filter(item => item.message.startsWith('Missing locales'));
    assert.deepEqual(missing.map(item => item.message), ['Missing locales fr, it', 'Missing locales en, it']);
    assert.deepEqual(missing.map(item => file.file.documentUser.getText(item.range)), ['"first"', '"second"']);
    assert.ok(missing.every(item => item.severity === 1));
    const extra = diagnostics.find(item => item.message === 'Locale not needed');
    assert.equal(file.file.documentUser.getText(extra.range), '"de"');
    assert.equal(extra.severity, 2);
});

test('i18n locale import returns no action when configured locales are already present', async () => {
    const file = fixture('{"second":{"en":"Second","fr":"Deuxième"},"first":{"en":"First","fr":"Premier"}}', ['en', 'fr']);
    assert.deepEqual(await service.codeAction(file, null), []);
    assert.deepEqual(file.parsedSrc.first, { en: 'First', fr: 'Premier' });
});

test('i18n formatter leaves the source untouched for JSON with comments', async () => {
    const source = '// translator note\n{"first":{"en":"First"}}';
    const documentUser = TextDocument.create('file:///round11.i18n.avt', 'json', 1, source);
    const file = { uri: documentUser.uri, documentUser, contentUser: source };
    assert.deepEqual(await service.format(file, null, {}), []);
    assert.equal(file.contentUser, source);
});
