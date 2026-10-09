import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';

function parse(source) {
    return I18nParser.parse(TextDocument.create('file:///messages.i18n.avt', 'json', 1, source));
}

test('i18n parser retains exact source spans for escaped strings and Unicode', () => {
    const source = '{\n  "écran\\\"titre": {\n    "fr-CH": "Ligne\\n\u00e9t\u00e9",\n    "en": "Ready"\n  }\n}';
    const item = parse(source)['écran"titre'];
    assert.ok(item);
    assert.equal(source.slice(item.keyStart, item.keyEnd), '"écran\\\"titre"');
    assert.equal(item.locales['fr-CH'].value, 'Ligne\nété');
    assert.equal(source.slice(item.locales['fr-CH'].localeStart, item.locales['fr-CH'].localeEnd), '"fr-CH"');
    assert.equal(source.slice(item.locales['fr-CH'].valueStart, item.locales['fr-CH'].valueEnd), '"Ligne\\nété"');
});

test('i18n parser skips non-object entries while preserving adjacent valid entries', () => {
    const result = parse('{"missing":null,"number":2,"array":[],"valid":{"en":"Ok"},"invalid":false}');
    assert.deepEqual(Object.keys(result), ['valid']);
    assert.equal(result.valid.locales.en.value, 'Ok');
});

test('i18n parser tolerates comments and trailing commas in an edited JSON document', () => {
    const source = '{ // comment\n "first": {"en":"One",},\n "second": {"fr":"Deux"},\n}';
    const result = parse(source);
    assert.deepEqual(Object.keys(result), ['first', 'second']);
    assert.equal(result.first.locales.en.value, 'One');
    assert.equal(result.second.locales.fr.value, 'Deux');
});
