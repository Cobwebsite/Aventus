import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';

function document(text) {
    return TextDocument.create('file:///messages.i18n.avt', 'json', 1, text);
}

test('i18n parser extracts keys, locales, values and source ranges', () => {
    const source = '{"hello":{"en":"Hello","fr":"Bonjour"},"bye":{"en":"Bye"}}';
    const result = I18nParser.parse(document(source));
    assert.deepEqual(Object.keys(result), ['hello', 'bye']);
    assert.deepEqual(Object.keys(result.hello.locales), ['en', 'fr']);
    assert.equal(result.hello.locales.fr.value, 'Bonjour');
    assert.equal(source.slice(result.hello.keyStart, result.hello.keyEnd), '"hello"');
    assert.equal(source.slice(result.hello.locales.fr.localeStart, result.hello.locales.fr.localeEnd), '"fr"');
    assert.equal(source.slice(result.hello.locales.fr.valueStart, result.hello.locales.fr.valueEnd), '"Bonjour"');
});

test('i18n parser handles an empty document and ignores non-property roots', () => {
    assert.deepEqual(I18nParser.parse(document('{}')), {});
    assert.deepEqual(I18nParser.parse(document('[]')), {});
    assert.deepEqual(I18nParser.parse(document('')), {});
});

test('i18n parser skips incomplete properties and retains complete translations', () => {
    assert.deepEqual(I18nParser.parse(document('{"hello": }')), {});
    const parsed = I18nParser.parse(document('{"hello":{"en":"Hello","fr":},"bye":{"en":"Bye"}}'));
    assert.equal(parsed.hello.locales.en.value, 'Hello');
    assert.equal(parsed.hello.locales.fr, undefined);
    assert.equal(parsed.bye.locales.en.value, 'Bye');
});

test('i18n parser does not throw while a JSON document is being edited', () => {
    for (const source of [
        '{',
        '{"hello":',
        '{"hello": null}',
        '{"hello": []}',
        '{"hello": {',
        '{"hello":{"en":',
        '{"hello":{"en":"Hello",',
    ]) {
        assert.doesNotThrow(() => I18nParser.parse(document(source)), source);
    }
});
