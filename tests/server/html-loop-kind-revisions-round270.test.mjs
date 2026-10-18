import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('une même vue remplace une boucle for-in par for-of puis retire la boucle', () => {
    const uri = `file:///D:/test/html-loop-kind-round270-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: { componentClassName: 'List', viewMethodName: 'view' }, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const first = parse('for (const index in items) { <li>{{index}}</li> }');
    assert.deepEqual(first.errors, []);
    assert.equal(first.loops.length, 1);
    assert.equal(first.loops[0].isSimple, true);
    assert.equal(first.loops[0].simple.index, 'index');
    assert.equal(first.loops[0].simple.data, 'items');
    assert.equal(first.loops[0].simple.item, undefined);
    assert.equal(first.tags.filter(tag => tag.tagName === 'li').length, 1);

    const second = parse('\r\nfor (const value of values) { <p>{{value}}</p> }');
    assert.deepEqual(second.errors, []);
    assert.equal(second.loops.length, 1);
    assert.equal(second.loops[0].isSimple, true);
    assert.equal(second.loops[0].simple.item, 'value');
    assert.equal(second.loops[0].simple.data, 'values');
    assert.equal(second.loops[0].simple.index, undefined);
    assert.equal(second.tags.filter(tag => tag.tagName === 'p').length, 1);
    assert.equal(second.tags.filter(tag => tag.tagName === 'li').length, 0);

    const final = parse('<span>Done</span>');
    assert.deepEqual(final.errors, []);
    assert.deepEqual(final.loops, []);
    assert.equal(final.tags.filter(tag => tag.tagName === 'span').length, 1);
    assert.equal(final.tags.filter(tag => tag.tagName === 'p' || tag.tagName === 'li').length, 0);
});
