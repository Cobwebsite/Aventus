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

test('l’action d’import des locales remplace aussi les commentaires du document', async () => {
    const source = '{\n  // Context for translators\n  "hello": {"en": "Hello"}\n}';
    const file = fixture(source);
    assert.deepEqual((await service.validate(file)).map(item => item.message), ['Missing locales fr']);

    const actions = await service.codeAction(file, {
        start: { line: 2, character: 2 }, end: { line: 2, character: 9 },
    });
    assert.equal(actions.length, 1);
    assert.equal(actions[0].title, 'Import missing locales');
    const edit = actions[0].edit.changes[uri][0];
    assert.deepEqual(edit.range, {
        start: { line: 0, character: 0 },
        end: file.file.documentUser.positionAt(source.length),
    });
    assert.deepEqual(JSON.parse(edit.newText), { hello: { en: 'Hello', fr: 'ⵌⵌ' } });
    assert.equal(edit.newText.includes('Context for translators'), false);
});
