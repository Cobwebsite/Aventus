import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();
const uri = 'file:///D:/round102/messages.i18n.avt';

function fixture(version, source) {
    const documentUser = TextDocument.create(uri, 'json', version, source);
    return {
        file: { uri, documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
        parsed: I18nParser.parse(documentUser),
    };
}

test('i18n comments stay with their keys while formatting sorts translations', async () => {
    const commented = fixture(1, '// translation file\n{\n // translator note for z\n "z": {"fr":"Z", "en":"Z"},\n /* translator note for a */\n "a": {"fr":"A", "en":"A"}\n}\n// end of file');
    assert.deepEqual(await service.validate(commented), []);
    const commentedEdits = await service.format(commented.file, null, {});
    assert.equal(commentedEdits.length, 1);
    const formatted = commentedEdits[0].newText;
    const parsed = service.languageService.parseJSONDocument(TextDocument.create(uri, 'json', 2, formatted));
    assert.deepEqual(parsed.root.properties.map(property => property.keyNode.value), ['a', 'z']);
    assert.deepEqual(parsed.root.properties[0].valueNode.properties.map(property => property.keyNode.value), ['en', 'fr']);
    assert.match(formatted, /\/\* translator note for a \*\/\s*"a"/);
    assert.match(formatted, /\/\/ translator note for z\s*"z"/);
    assert.match(formatted, /^\/\/ translation file/);
    assert.match(formatted, /\/\/ end of file\s*$/);
    assert.deepEqual(commentedEdits[0].range, {
        start: { line: 0, character: 0 },
        end: commented.file.documentUser.positionAt(commented.file.contentUser.length),
    });

    const cleaned = fixture(2, '{"z":{"en":"Z","fr":"Z"},"a":{"en":"A","fr":"A"}}');
    assert.deepEqual(await service.validate(cleaned), []);
    const edits = await service.format(cleaned.file, null, {});
    assert.equal(edits.length, 1);
    assert.deepEqual(Object.keys(JSON.parse(edits[0].newText)), ['a', 'z']);
    assert.deepEqual(edits[0].range, {
        start: { line: 0, character: 0 },
        end: cleaned.file.documentUser.positionAt(cleaned.file.contentUser.length),
    });

    const invalid = fixture(3, '{ "a": {"en": "A", } broken }');
    assert.deepEqual(await service.format(invalid.file, null, {}), []);
});
