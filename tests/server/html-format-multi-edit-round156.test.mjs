import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

test('le formatage HTML suit les remplacements successifs du même document', async () => {
    const uri = 'file:///D:/test/html-format-round156.wcv.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file, tsFile: null, scssFile: null, build, fileParsed: null };
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.languageService = getLanguageService();

    async function format(source) {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'Aventus HTML', file.versionUser, source);
        view.fileParsed = ParserHtml.parse(view, build);
        const document = file.documentUser;
        const edits = await service.format(document, {
            start: document.positionAt(0), end: document.positionAt(source.length),
        }, { tabSize: 2, insertSpaces: true });
        return { output: TextDocument.applyEdits(document, edits), errors: view.fileParsed.errors };
    }

    const first = await format('<div><span>first</div>');
    assert.ok(first.errors.length > 0);
    assert.match(first.output, /first/);

    const repaired = await format('<section><p>second</p></section>');
    assert.deepEqual(repaired.errors, []);
    assert.match(repaired.output, /<section>/);
    assert.match(repaired.output, /<p>second<\/p>/);
    assert.doesNotMatch(repaired.output, /first|<span>/);

    const changed = await format('<article><h2>third</h2></article>');
    assert.deepEqual(changed.errors, []);
    assert.match(changed.output, /<h2>third<\/h2>/);
    assert.doesNotMatch(changed.output, /second|<section>/);
});
