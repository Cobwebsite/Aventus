import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, , { AventusHTMLFile }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/File.ts',
]);

test('HTML file recompiles changed versions, validates linked logic, and replaces diagnostics', async () => {
    const uri = `file:///round287-${Date.now()}-${Math.random()}.wcv.avt`;
    const file = {
        uri,
        versionUser: 1,
        versionInternal: 1,
        contentUser: '<div><span></div>',
        validateCalls: 0,
        validate() { this.validateCalls++; },
    };
    file.documentUser = TextDocument.create(uri, 'Aventus HTML', 1, file.contentUser);
    const build = {
        getAvoidParsingTags: () => [],
        htmlLanguageService: {
            getClassByTag: () => null,
            doValidation: async () => [{ message: 'service', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }],
        },
        tsFiles: {}, scssFiles: {},
    };
    const view = Object.create(AventusHTMLFile.prototype);
    view._file = file;
    view._build = build;
    view.version = -1;
    view.tsErrors = [{ message: 'typescript', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }];
    view.codeactions = [];
    let linkedValidations = 0;
    const logic = { htmlDiagnostics: [{ message: 'linked', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }], validate: async () => { linkedValidations++; } };
    Object.defineProperty(view, 'tsFile', { value: logic });

    await view.init();
    assert.equal(view.compiledVersion, 1);
    assert.equal(file.validateCalls, 1);
    assert.ok(view.fileParsed.errors.length > 0);
    assert.deepEqual((await view.onValidate()).map(item => item.message), ['service', ...view.fileParsed.errors.map(item => item.message), 'typescript', 'linked']);

    await view.onContentChange();
    assert.equal(file.validateCalls, 1);
    assert.equal(linkedValidations, 0);

    file.versionUser = 2;
    file.versionInternal = 2;
    file.contentUser = '<div><span></span></div>';
    file.documentUser = TextDocument.create(uri, 'Aventus HTML', 2, file.contentUser);
    view.tsErrors = [];
    logic.htmlDiagnostics = [];
    await view.onContentChange();
    assert.equal(view.compiledVersion, 2);
    assert.equal(file.validateCalls, 2);
    assert.equal(linkedValidations, 1);
    assert.deepEqual(view.fileParsed.errors, []);
    assert.deepEqual((await view.onValidate()).map(item => item.message), ['service']);
});
