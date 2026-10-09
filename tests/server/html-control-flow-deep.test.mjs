import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');
let fixtureId = 0;
function parse(source) {
    const uri = `file:///D:/test/flow-${++fixtureId}.html.avt`;
    const documentUser = TextDocument.create(uri, 'aventus-html', 1, source);
    const file = { file: { uri, versionUser: 1, documentUser }, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    return ParserHtml.parse(file, build);
}

test('HTML for-of loop records the iterated item and source collection', () => {
    const parsed = parse('for (const item of items) { <li>{{item.name}}</li> }');
    assert.equal(parsed.loops.length, 1);
    assert.equal(parsed.loops[0].isSimple, true);
    assert.equal(parsed.loops[0].simple.item, 'item');
    assert.equal(parsed.loops[0].simple.data, 'items');
    assert.match(parsed.compiledTxt, /<l id="\d+">/);
    assert.ok(parsed.tags.some(tag => tag.tagName === 'li'));
});

test('HTML if and else-if chain preserves distinct conditions', () => {
    const parsed = parse('if (state === 1) { <p>Ready</p> } else if (state === 2) { <p>Wait</p> } else { <p>Done</p> }');
    assert.equal(parsed.ifs.length, 1);
    assert.deepEqual(parsed.ifs[0].conditions.map(item => item.txt), ['state === 1', 'state === 2']);
    assert.match(parsed.compiledTxt, /<if id="\d+">/);
    assert.equal(parsed.tags.filter(tag => tag.tagName === 'p').length, 3);
});

test('HTML if and else-if chain preserves identifier conditions', () => {
    const parsed = parse('if (ready) { <p>Ready</p> } else if (pending) { <p>Wait</p> }');
    assert.deepEqual(parsed.ifs[0].conditions.map(item => item.txt), ['ready', 'pending']);
    assert.deepEqual(parsed.ifs[0].conditions.map(item => item.type), ['if', 'elif']);
});

test('HTML comment and escaped directives are not transformed into control flow', () => {
    const parsed = parse('<!-- if (hidden) { <b>Never</b> } -->\\if (literal) { <p>Text</p> }');
    assert.equal(parsed.ifs.length, 0);
    assert.equal(parsed.loops.length, 0);
});
