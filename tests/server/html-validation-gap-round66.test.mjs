import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

test('HTML parser errors are currently absent from language service validation and recover after repair', async () => {
    const uri = 'file:///round66-malformed.html.avt';
    const file = {
        uri,
        versionUser: 1,
        documentUser: TextDocument.create(uri, 'aventus-html', 1, '<div><span></div>'),
    };
    const view = { file, tsFile: null, scssFile: null };
    const build = {
        getAvoidParsingTags: () => [],
        htmlLanguageService: { getClassByTag: () => null },
    };
    const service = Object.create(AventusHTMLLanguageService.prototype);

    const malformed = ParserHtml.parse(view, build);
    assert.ok(malformed.errors.some(error => /span/.test(error.message)));
    assert.deepEqual(await service.doValidation(file), []);

    file.versionUser = 2;
    file.documentUser = TextDocument.create(uri, 'aventus-html', 2, '<div><span></span></div>');
    const repaired = ParserHtml.parse(view, build);
    assert.deepEqual(repaired.errors, []);
    assert.deepEqual(await service.doValidation(file), []);
});
