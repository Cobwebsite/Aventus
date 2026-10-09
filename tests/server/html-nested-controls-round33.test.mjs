import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');
let nextId = 0;

function parse(source) {
    const uri = `file:///D:/test/html-nested-round33-${++nextId}.html.avt`;
    const documentUser = TextDocument.create(uri, 'aventus-html', 1, source);
    const file = { file: { uri, versionUser: 1, documentUser }, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    return ParserHtml.parse(file, build);
}

test('a loop containing a conditional keeps the loop variable and nested condition', () => {
    const parsed = parse('for (const item of items) { if (item.active) { <li>{{item.name}}</li> } }');
    assert.equal(parsed.loops.length, 1);
    assert.deepEqual(parsed.loops[0].simple, { data: 'items', item: 'item' });
    assert.deepEqual(parsed.ifs[0].conditions.map(condition => condition.txt), ['item.active']);
    assert.equal(parsed.tags.find(tag => tag.tagName === 'if').parentTemplateId, parsed.loops[0].idTemplate);
    assert.match(parsed.compiledTxt, /^<l id="0">.*<if id="1">.*<li>.*<\/if>.*<\/l>$/);
});

test('a destructured for-of binding and its collection survive parsing', () => {
    const parsed = parse('for (const {name, id} of items) { <li>{{name}}: {{id}}</li> }');
    assert.equal(parsed.loops.length, 1);
    assert.deepEqual(parsed.loops[0].simple, { data: 'items', item: '{name, id}' });
    assert.deepEqual(parsed.loops[0].variableNames, ['{name, id}']);
    assert.ok(parsed.tags.some(tag => tag.tagName === 'li'));
});

test('an unclosed nested tag reports the exact opening tag name range', () => {
    const source = '<div><span></div>';
    const parsed = parse(source);
    const error = parsed.errors.find(item => item.message === "The tag span isn't correctly closed");
    assert.ok(error);
    assert.deepEqual(error.range, {
        start: { line: 0, character: source.indexOf('span') },
        end: { line: 0, character: source.indexOf('span') + 'span'.length },
    });
});

test('a corrected closing tag clears the parser diagnostic on a new document', () => {
    const invalid = parse('<div><span></div>');
    const corrected = parse('<div><span></span></div>');
    assert.ok(invalid.errors.length > 0);
    assert.deepEqual(corrected.errors, []);
});
