import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }, { AventusHTMLFile }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
    'language-services/html/File.ts',
]);

test('HTML parser errors reach file validation and disappear after repair', async () => {
    const uri = 'file:///round66-malformed.html.avt';
    const file = {
        uri,
        versionUser: 1,
        documentUser: TextDocument.create(uri, 'aventus-html', 1, '<div><span></div>'),
    };
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = file;
    view.tsErrors = [];
    const build = {
        getAvoidParsingTags: () => [],
        htmlLanguageService: { getClassByTag: () => null },
        tsFiles: {},
        scssFiles: {},
    };
    const service = Object.create(AventusHTMLLanguageService.prototype);
    build.htmlLanguageService.doValidation = service.doValidation.bind(service);
    view._build = build;

    const malformed = ParserHtml.parse(view, build);
    view.fileParsed = malformed;
    assert.ok(malformed.errors.some(error => /span/.test(error.message)));
    assert.deepEqual(await service.doValidation(file), []);
    assert.ok((await view.onValidate()).some(error => /span/.test(error.message)));

    file.versionUser = 2;
    file.documentUser = TextDocument.create(uri, 'aventus-html', 2, '<div><span></span></div>');
    const repaired = ParserHtml.parse(view, build);
    view.fileParsed = repaired;
    assert.deepEqual(repaired.errors, []);
    assert.deepEqual(await service.doValidation(file), []);
    assert.deepEqual(await view.onValidate(), []);
});
