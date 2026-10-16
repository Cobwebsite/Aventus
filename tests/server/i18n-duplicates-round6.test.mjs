import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(source) {
    const documentUser = TextDocument.create('file:///duplicates.i18n.avt', 'json', 1, source);
    return {
        file: { uri: documentUser.uri, documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
        parsed: I18nParser.parse(documentUser),
        parsedSrc: JSON.parse(source),
    };
}

test('i18n validation reports repeated message keys', async () => {
    const source = '{"welcome":{"en":"One","fr":"Un"},"welcome":{"en":"Two","fr":"Deux"}}';
    const file = fixture(source);
    const errors = await service.validate(file);
    const duplicate = errors.find(error => /duplicate/i.test(error.message));
    assert.ok(duplicate, errors.map(error => error.message).join(', '));
    assert.equal(duplicate.severity, 1);
    assert.equal(source.slice(file.file.documentUser.offsetAt(duplicate.range.start), file.file.documentUser.offsetAt(duplicate.range.end)), '"welcome"');
});

test('i18n validation reports repeated locale keys within one message', async () => {
    const source = '{"welcome":{"en":"One","en":"Two","fr":"Un"}}';
    const file = fixture(source);
    const errors = await service.validate(file);
    const duplicate = errors.find(error => /duplicate/i.test(error.message));
    assert.ok(duplicate, errors.map(error => error.message).join(', '));
    assert.equal(duplicate.severity, 1);
    assert.equal(source.slice(file.file.documentUser.offsetAt(duplicate.range.start), file.file.documentUser.offsetAt(duplicate.range.end)), '"en"');
});
