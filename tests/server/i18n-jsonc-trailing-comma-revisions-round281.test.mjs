import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule(
    'language-services/i18n/LanguageService.ts');

test('i18n JSONC formatting accepts trailing commas and sorts commented CRLF revisions', async () => {
    const service = AventusI18nLanguageService.getInstance();
    const uri = 'file:///D:/round281/jsonc.i18n.avt';
    const format = async (version, source, expectedEdits = 1) => {
        const documentUser = TextDocument.create(uri, 'json', version, source);
        const edits = await service.format({ uri, documentUser, contentUser: source }, null, {});
        assert.equal(edits.length, expectedEdits);
        if (!expectedEdits) return { formatted: source };
        assert.deepEqual(edits[0].range, {
            start: { line: 0, character: 0 }, end: documentUser.positionAt(source.length),
        });
        const formatted = TextDocument.applyEdits(documentUser, edits);
        const parsed = service.languageService.parseJSONDocument(TextDocument.create(uri, 'json', version + 1, formatted));
        assert.equal(parsed.syntaxErrors?.length ?? 0, 0);
        return { formatted, parsed };
    };

    const withTrailingCommas = await format(1, [
        '// catalog', '{',
        '  // last key', '  "z": { "fr": "Dernier", "en": "Last", },',
        '  /* first key */ "a": { "fr": "Premier", "en": "First", },',
        '}', '',
    ].join('\r\n'));
    assert.deepEqual(withTrailingCommas.parsed.root.properties.map(item => item.keyNode.value), ['a', 'z']);
    assert.deepEqual(withTrailingCommas.parsed.root.properties[0].valueNode.properties.map(item => item.keyNode.value), ['en', 'fr']);
    assert.match(withTrailingCommas.formatted, /\/\* first key \*\/\s*"a"/);
    assert.match(withTrailingCommas.formatted, /\/\/ last key\s*"z"/);
    assert.doesNotMatch(withTrailingCommas.formatted, /(?<!\r)\n/);

    const first = await format(2, [
        '// catalog', '{',
        '  // last key', '  "z": { "fr": "Dernier", "en": "Last" },',
        '  /* first key */ "a": { "fr": "Premier", "en": "First" }',
        '}', '',
    ].join('\r\n'));
    assert.deepEqual(first.parsed.root.properties.map(item => item.keyNode.value), ['a', 'z']);
    assert.deepEqual(first.parsed.root.properties[0].valueNode.properties.map(item => item.keyNode.value), ['en', 'fr']);
    assert.match(first.formatted, /\/\* first key \*\/\s*"a"/);
    assert.match(first.formatted, /\/\/ last key\s*"z"/);

    const second = await format(4, [
        '// revised catalog', '{',
        '  // second key', '  "m": { "fr": "Milieu", "en": "Middle" },',
        '  /* first key revised */ "a": { "fr": "A", "en": "A" }',
        '}', '',
    ].join('\r\n'));
    assert.deepEqual(second.parsed.root.properties.map(item => item.keyNode.value), ['a', 'm']);
    assert.doesNotMatch(second.formatted, /last key|"z"|Dernier/);
    assert.match(second.formatted, /\/\* first key revised \*\/\s*"a"/);
    assert.match(second.formatted, /\/\/ second key\s*"m"/);
});
