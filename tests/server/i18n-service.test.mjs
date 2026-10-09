import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(content, locales = ['en', 'fr']) {
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', 1, content);
    return {
        file: { documentUser, contentUser: content },
        build: { buildConfig: { i18n: { locales } } },
        parsed: I18nParser.parse(documentUser),
    };
}

test('i18n validation accepts complete translations', async () => {
    const errors = await service.validate(fixture('{"hello":{"en":"Hello","fr":"Bonjour"}}'));
    assert.deepEqual(errors, []);
});

test('i18n validation reports missing and unneeded locales and empty translations', async () => {
    const errors = await service.validate(fixture('{"hello":{"en":"ⵌⵌ","de":"Hallo"}}'));
    assert.deepEqual(errors.map(error => error.message).sort(), [
        'Locale not needed',
        'Missing locales fr',
        'Translation not set',
    ].sort());
    assert.equal(errors.find(error => error.message === 'Missing locales fr').severity, 1);
    assert.equal(errors.find(error => error.message === 'Translation not set').severity, 2);
});

test('i18n validation reports malformed JSON', async () => {
    const errors = await service.validate(fixture('{"hello": }'));
    assert.ok(errors.length > 0);
    assert.ok(errors.every(error => error.severity === 1));
});

test('i18n formatter sorts keys and returns no edits for malformed JSON', async () => {
    const file = fixture('{"z":{"fr":"Z","en":"Z"},"a":{"fr":"A","en":"A"}}').file;
    const edits = await service.format(file, null, {});
    assert.equal(edits.length, 1);
    assert.deepEqual(Object.keys(JSON.parse(edits[0].newText)), ['a', 'z']);
    assert.deepEqual(await service.format(fixture('{').file, null, {}), []);
});
