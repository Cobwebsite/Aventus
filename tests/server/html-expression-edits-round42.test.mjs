import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');
let nextId = 0;

function fixture(source) {
    const uri = `file:///D:/test/html-expression-round42-${++nextId}.html.avt`;
    const file = { uri, versionUser: 1, documentUser: TextDocument.create(uri, 'aventus-html', 1, source) };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    return {
        parse: () => ParserHtml.parse(view, build),
        edit(text) {
            file.versionUser++;
            file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, text);
        },
    };
}

test('invalid injection, binding and event expressions retain distinct source ranges through an edit', () => {
    const initial = '<demo-card :title="foo(" @bind-value="bar[" @click="run("></demo-card>';
    const corrected = '<demo-card :title="foo()" @bind-value="bar[0]" @click="run()"></demo-card>';
    const view = fixture(initial);
    const first = view.parse();
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['foo(']);
    assert.deepEqual(first.bindings.map(item => item.injectTsTxt), ['bar[']);
    assert.ok(first.interestPoints.some(item => item.type === 'method' && item.name === 'run('));
    assert.equal(initial.slice(first.injections[0].start, first.injections[0].end), '"foo("');
    assert.equal(initial.slice(first.bindings[0].start, first.bindings[0].end), '"bar["');

    view.edit(corrected);
    const second = view.parse();
    assert.notEqual(second, first);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['foo()']);
    assert.deepEqual(second.bindings.map(item => item.injectTsTxt), ['bar[0]']);
    assert.ok(second.interestPoints.some(item => item.type === 'method' && item.name === 'run()'));
    assert.ok(!second.interestPoints.some(item => item.name === 'run('));
    assert.equal(corrected.slice(second.injections[0].start, second.injections[0].end), '"foo()"');
    assert.equal(corrected.slice(second.bindings[0].start, second.bindings[0].end), '"bar[0]"');
});

test('duplicate attribute diagnostic moves with the source and disappears after correction', () => {
    const initial = '<demo-card\n  :title="a"\n  :title="b"\n></demo-card>';
    const view = fixture(initial);
    const first = view.parse();
    const diagnostic = first.errors.find(item => item.message === 'Duplicate attribute :title');
    assert.ok(diagnostic);
    assert.deepEqual(diagnostic.range, {
        start: { line: 2, character: 2 },
        end: { line: 2, character: 8 },
    });
    view.edit('<demo-card\n  :title="a"\n  :label="b"\n></demo-card>');
    const second = view.parse();
    assert.ok(!second.errors.some(item => item.message === 'Duplicate attribute :title'));
    assert.deepEqual(second.injections.map(item => item.attr), ['title', 'label']);
});
