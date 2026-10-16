import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(text, locales = ['en', 'fr', 'de']) {
    const documentUser = TextDocument.create('file:///round80.i18n.avt', 'json', 1, text);
    return {
        file: { uri: documentUser.uri, documentUser, contentUser: text },
        build: { buildConfig: { i18n: { locales } } },
        parsed: I18nParser.parse(documentUser),
        parsedSrc: JSON.parse(text),
    };
}

test('plusieurs clés et locales absentes sont signalées par clé avec leurs plages propres', async () => {
    const input = fixture('{"first":{"en":"One"},"second":{"fr":"Deux","de":"Zwei"},"complete":{"en":"Three","fr":"Trois","de":"Drei"}}');
    const diagnostics = await service.validate(input);
    assert.deepEqual(diagnostics.map(item => [item.message, input.file.documentUser.getText(item.range), item.severity]), [
        ['Missing locales fr, de', '"first"', 1],
        ['Missing locales en', '"second"', 1],
    ]);
});

test('les doublons de clés et de locales sont localisés puis disparaissent après correction', async () => {
    const duplicate = fixture('{"first":{"en":"One","en":"Two","fr":"Un","de":"Ein"},"first":{"en":"Three","fr":"Trois","de":"Drei"}}');
    const diagnostics = await service.validate(duplicate);
    const repeated = diagnostics.filter(item => /duplicate/i.test(item.message));
    assert.deepEqual(repeated.map(item => duplicate.file.documentUser.getText(item.range)), ['"en"', '"en"', '"first"', '"first"']);
    assert.ok(repeated.every(item => item.severity === 1));

    const fixed = fixture('{"first":{"en":"One","fr":"Un","de":"Ein"},"second":{"en":"Two","fr":"Deux","de":"Zwei"}}');
    assert.deepEqual(await service.validate(fixed), []);
});
