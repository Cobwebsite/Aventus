import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('nested control flow keeps injection and binding values and positions after an attribute repair', () => {
    const uri = `file:///D:/test/html-binding-control-${Date.now()}-${Math.random().toString(36).slice(2)}.wcv.avt`;
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file: { uri }, tsFile: null, scssFile: null };
    const parse = (source, version) => {
        view.file.versionUser = version;
        view.file.documentUser = TextDocument.create(uri, 'aventus-html', version, source);
        return ParserHtml.parse(view, build);
    };

    const invalid = 'for (const item of items) { if (item.active) {\n<input :value="item.name" @bind="item.name" _id="forbidden"/>\n} }';
    const first = parse(invalid, 1);
    assert.equal(first.loops.length, 1);
    assert.equal(first.ifs.length, 1);
    assert.equal(first.injections.length, 1);
    assert.equal(first.bindings.length, 1);
    assert.equal(first.injections[0].injectTsTxt, 'item.name');
    assert.equal(first.bindings[0].injectTsTxt, 'item.name');
    const reserved = first.errors.find(error => error.message.includes('used by Aventus internally'));
    assert.ok(reserved);
    assert.equal(view.file.documentUser.getText(reserved.range), '_id');

    const repaired = invalid.replace('item.name" _id="forbidden"', 'item.title"');
    const second = parse(repaired, 2);
    assert.deepEqual(second.errors, []);
    assert.equal(second.loops.length, 1);
    assert.equal(second.ifs.length, 1);
    assert.equal(second.injections.length, 1);
    assert.equal(second.bindings.length, 1);
    assert.equal(second.injections[0].injectTsTxt, 'item.name');
    assert.equal(second.bindings[0].injectTsTxt, 'item.title');
    for (const expression of [...second.injections, ...second.bindings]) {
        assert.equal(repaired.slice(expression.start, expression.end), `"${expression.injectTsTxt}"`);
    }
});
