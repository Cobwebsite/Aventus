import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(source, locales = ['en', 'fr']) {
    const uri = 'file:///round5.i18n.avt';
    const documentUser = TextDocument.create(uri, 'json', 1, source);
    return {
        file: { uri, documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales } } },
        parsed: I18nParser.parse(documentUser),
        parsedSrc: JSON.parse(source),
    };
}

test('i18n diagnostics point at the exact missing, unneeded and empty translations', async () => {
    const source = '{\n  "welcome": {"en":"ⵌⵌ", "de":"Hallo"}\n}';
    const errors = await service.validate(fixture(source));
    assert.equal(errors.length, 3);
    const byMessage = Object.fromEntries(errors.map(error => [error.message, error]));
    const document = fixture(source).file.documentUser;
    function marked(error) {
        return source.slice(document.offsetAt(error.range.start), document.offsetAt(error.range.end));
    }
    assert.equal(marked(byMessage['Missing locales fr']), '"welcome"');
    assert.equal(marked(byMessage['Locale not needed']), '"de"');
    assert.equal(marked(byMessage['Translation not set']), '"ⵌⵌ"');
});

test('i18n formatter sorts both message keys and locale keys', async () => {
    const file = fixture('{"z":{"fr":"Zf","en":"Ze"},"a":{"fr":"Af","en":"Ae"}}').file;
    const edits = await service.format(file, null, {});
    assert.equal(edits.length, 1);
    assert.deepEqual(Object.keys(JSON.parse(edits[0].newText)), ['a', 'z']);
    assert.deepEqual(Object.keys(JSON.parse(edits[0].newText).a), ['en', 'fr']);
    assert.equal(file.documentUser.offsetAt(edits[0].range.start), 0);
    assert.equal(file.documentUser.offsetAt(edits[0].range.end), file.contentUser.length);
});

test('i18n locale import action fills each missing locale once in sorted output', async () => {
    const file = fixture('{"z":{"en":"Z"},"a":{"fr":"A"}}');
    const actions = await service.codeAction(file, null);
    assert.equal(actions.length, 1);
    assert.equal(actions[0].title, 'Import missing locales');
    const edits = actions[0].edit.changes[file.file.uri];
    assert.equal(edits.length, 2);
    const content = parseI18nAction(file.file.documentUser, actions[0]);
    assert.deepEqual(Object.keys(content), ['z', 'a']);
    assert.deepEqual(content.a, { en: 'ⵌⵌ', fr: 'A' });
    assert.deepEqual(content.z, { en: 'Z', fr: 'ⵌⵌ' });
    assert.ok(edits.every(edit => file.file.documentUser.offsetAt(edit.range.end) === file.file.documentUser.offsetAt(edit.range.start)));
});
