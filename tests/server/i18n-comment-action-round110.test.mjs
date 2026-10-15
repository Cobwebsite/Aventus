import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();
const uri = 'file:///D:/round110/comments.i18n.avt';

function fixture(source) {
    const documentUser = TextDocument.create(uri, 'json', 1, source);
    return {
        file: { uri, documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
        parsed: I18nParser.parse(documentUser),
        parsedSrc: { hello: { en: 'Hello' } },
    };
}

test('l’action d’import des locales conserve les commentaires du document', async () => {
    const source = '{\n  // Context for translators\n  "hello": {"en": "Hello"}\n}';
    const file = fixture(source);
    assert.deepEqual((await service.validate(file)).map(item => item.message), ['Missing locales fr']);

    const actions = await service.codeAction(file, {
        start: { line: 2, character: 2 }, end: { line: 2, character: 9 },
    });
    assert.equal(actions.length, 1);
    assert.equal(actions[0].title, 'Import missing locales');
    const edits = actions[0].edit.changes[uri];
    assert.equal(edits.length, 1);
    assert.deepEqual(edits[0].range.start, edits[0].range.end);
    const updated = TextDocument.applyEdits(file.file.documentUser, edits);
    assert.match(updated, /\/\/ Context for translators/);
    assert.deepEqual(I18nParser.parse(TextDocument.create(uri, 'json', 2, updated)).hello.locales.fr.value, 'ⵌⵌ');
});

test('l’action complète plusieurs clés, dont un objet vide, sans toucher aux commentaires internes', async () => {
    const source = '{\n  "first": {\n    // Existing translation\n    "en": "Hello"\n  },\n  "second": { /* empty */ }\n}';
    const file = fixture(source);
    const actions = await service.codeAction(file, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } });
    const edits = actions[0].edit.changes[uri];
    assert.equal(edits.length, 2);
    const updated = TextDocument.applyEdits(file.file.documentUser, edits);
    assert.match(updated, /\/\/ Existing translation/);
    assert.match(updated, /\/\* empty \*\//);
    const parsed = I18nParser.parse(TextDocument.create(uri, 'json', 2, updated));
    assert.equal(parsed.first.locales.fr.value, 'ⵌⵌ');
    assert.equal(parsed.second.locales.en.value, 'ⵌⵌ');
    assert.equal(parsed.second.locales.fr.value, 'ⵌⵌ');
});
