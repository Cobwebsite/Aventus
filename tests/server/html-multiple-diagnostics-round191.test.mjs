import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('plusieurs erreurs HTML suivent leurs propres lignes pendant deux réparations', () => {
    const uri = 'file:///D:/round191/multiple-diagnostics.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const first = parse('<section>\n  <div id="a" id="b"><span>text</div>\n</section>');
    const duplicate = first.errors.find(error => error.message === 'Duplicate attribute id');
    const mismatched = first.errors.find(error => error.message.includes("span isn't correctly closed"));
    assert.ok(duplicate);
    assert.deepEqual(duplicate.range, {
        start: { line: 1, character: 14 },
        end: { line: 1, character: 16 },
    });
    assert.ok(mismatched);
    assert.equal(mismatched.range.start.line, 1);
    assert.equal(file.documentUser.getText(mismatched.range), 'span');

    const second = parse('\n<section>\n  <div id="a"><span>text</div>\n</section>');
    assert.ok(!second.errors.some(error => error.message === 'Duplicate attribute id'));
    const remaining = second.errors.find(error => error.message.includes("span isn't correctly closed"));
    assert.ok(remaining);
    assert.equal(remaining.range.start.line, 2);
    assert.equal(file.documentUser.getText(remaining.range), 'span');

    const third = parse('\n<section>\n  <div id="a"><span>text</span></div>\n</section>');
    assert.deepEqual(third.errors, []);
    assert.deepEqual(third.tags.map(tag => tag.tagName), ['section', 'div', 'span']);
});
