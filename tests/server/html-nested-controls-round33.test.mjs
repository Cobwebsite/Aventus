import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import ts from 'typescript';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/ts/component/File.ts',
]);
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

test('a conditional containing a loop keeps the outer condition', () => {
    const parsed = parse('if (ready) { for (const item of items) { <li>{{item}}</li> } }');
    assert.equal(parsed.ifs.length, 1);
    assert.deepEqual(parsed.ifs[0].conditions.map(condition => condition.txt), ['ready']);
    assert.equal(parsed.loops.length, 1);
    assert.match(parsed.compiledTxt, /^<if id="0">.*<l id="1">.*<li>.*<\/l>.*<\/if>$/);
});

test('nested conditional, loop, and conditional keep both conditions', () => {
    const parsed = parse('if (ready) { for (const item of items) { if (item.active) { <li>{{item.name}}</li> } } }');
    assert.deepEqual(parsed.ifs.map(item => item.conditions.map(condition => condition.txt)), [
        ['ready'], ['item.active'],
    ]);
    assert.equal(parsed.loops.length, 1);
    assert.match(parsed.compiledTxt, /^<if id="0">.*<l id="1">.*<if id="2">.*<li>.*<\/if>.*<\/l>.*<\/if>$/);
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

test('TypeScript syntax errors in an HTML injection map back to the expression', () => {
    const source = '<div :value="{{bad(}}"></div>';
    const parsed = parse(source);
    assert.deepEqual(parsed.errors, []);
    const injection = parsed.injections[0];
    assert.ok(injection);

    const generated = `class Card { private value() { return ${injection.injectTsTxt}\n} }`;
    const tsSource = ts.createSourceFile('card.ts', generated, ts.ScriptTarget.Latest, true);
    const syntaxError = tsSource.parseDiagnostics.find(item => item.start >= generated.indexOf(injection.injectTsTxt));
    assert.ok(syntaxError);

    const generatedDoc = TextDocument.create('file:///D:/test/card.ts', 'typescript', 1, generated);
    const htmlDoc = TextDocument.create('file:///D:/test/card.html.avt', 'Aventus HTML', 1, source);
    const helperStart = generated.indexOf(injection.injectTsTxt);
    const logic = Object.create(AventusWebComponentLogicalFile.prototype);
    Object.defineProperty(logic, 'file', { value: { documentInternal: generatedDoc, contentUser: 'class Card {}' } });
    Object.defineProperty(logic, 'HTMLFile', { value: { file: { documentInternal: htmlDoc } } });
    logic.viewValidationStart = -1;
    logic.viewValidationEnd = -1;
    logic.viewMethodsInfo = [{
        fullStart: 0,
        start: helperStart,
        end: generated.indexOf('\n}', helperStart) + 1,
        offsetBefore: 1,
        offsetAfter: 1,
        fct: { txt: injection.injectTsTxt, positions: [{ start: injection.start, end: injection.end }] },
        kind: 'fct',
        transform: () => 0,
    }];
    logic.diagnostics = [{
        message: ts.flattenDiagnosticMessageText(syntaxError.messageText, '\n'),
        range: {
            start: generatedDoc.positionAt(syntaxError.start),
            end: generatedDoc.positionAt(syntaxError.start + syntaxError.length),
        },
    }];
    logic.transformDiagnosticForView();
    assert.equal(logic.htmlDiagnostics.length, 1);
    const range = logic.htmlDiagnostics[0].range;
    assert.ok(htmlDoc.offsetAt(range.start) >= source.indexOf('"{{bad(') + 1);
    assert.ok(htmlDoc.offsetAt(range.end) <= source.indexOf('}}"') + 2);
});
