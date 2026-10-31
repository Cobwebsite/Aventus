import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('HTML nested control flow keeps expression and attribute ranges in the original CRLF document after edits', () => {
    const uri = 'file:///D:/test/html-control-offsets-round107.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: { componentClassName: 'Card', viewMethodName: 'view' }, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    function parse(source) {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    }

    const firstSource = 'if (ready) {\r\n  for (const item of items) {\r\n    <button :title="item.title" @click="select(item)">{{item.name}}</button>\r\n  }\r\n}';
    const first = parse(firstSource);
    assert.equal(first.ifs.length, 1);
    assert.equal(first.loops.length, 1);
    assert.equal(first.injections.length, 1);
    assert.equal(firstSource.slice(first.injections[0].start, first.injections[0].end), '"item.title"');
    assert.ok(first.interestPoints.some(point => point.type === 'method' && point.name === 'select(item)' && firstSource.slice(point.start, point.end).includes('select')));
    assert.equal(first.errors.length, 0);

    const secondSource = '\r\nif (enabled) {\r\n  for (const entry of entries) {\r\n    <button :title="entry.label" @click="open(entry)">{{entry.name}}</button>\r\n  }\r\n}';
    const second = parse(secondSource);
    assert.notEqual(second, first);
    assert.deepEqual(second.ifs[0].conditions.map(condition => condition.txt), ['enabled']);
    assert.deepEqual(second.loops[0].simple, { data: 'entries', item: 'entry' });
    assert.equal(secondSource.slice(second.injections[0].start, second.injections[0].end), '"entry.label"');
    assert.ok(second.interestPoints.some(point => point.type === 'method' && point.name === 'open(entry)' && secondSource.slice(point.start, point.end).includes('open')));
    assert.ok(!second.interestPoints.some(point => point.name === 'select(item)'));
    assert.equal(second.errors.length, 0);
});

test('HTML avoids parsing configured raw-content tags while continuing with the next sibling', () => {
    const uri = 'file:///D:/test/html-raw-content-round107.html.avt';
    const source = '<section><pre><fake-item :value="broken"><span>literal</span></fake-item></pre><button :title="name">Go</button></section>';
    const file = { uri, versionUser: 1, documentUser: TextDocument.create(uri, 'aventus-html', 1, source) };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => ['pre'], htmlLanguageService: { getClassByTag: () => null } };
    const parsed = ParserHtml.parse(view, build);
    assert.deepEqual(parsed.tags.map(tag => tag.tagName), ['section', 'pre', 'button']);
    assert.deepEqual(parsed.injections.map(item => item.injectTsTxt), ['name']);
    assert.equal(parsed.errors.length, 0);
});
