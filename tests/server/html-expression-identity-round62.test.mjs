import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');
let id = 0;

function fixture(source) {
    const uri = `file:///D:/test/expression-identity-${++id}.html.avt`;
    const file = { uri, versionUser: 1, documentUser: TextDocument.create(uri, 'aventus-html', 1, source) };
    const view = { file, tsFile: { componentClassName: 'Card', viewMethodName: 'view' }, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    return {
        parse: () => ParserHtml.parse(view, build),
        edit(text) {
            file.versionUser++;
            file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, text);
        },
    };
}

test.skip('identical HTML expressions on distinct attributes retain their own typed actions and ranges after edit', () => {
    const original = '<demo-card title="{{value}}" count="{{value}}"></demo-card>';
    const updated = '<demo-card\n  title="{{value}}"\n  count="{{value}}"\n></demo-card>';
    const view = fixture(original);
    for (const source of [original, updated]) {
        if (source !== original) view.edit(source);
        const parsed = view.parse();
        const actions = Object.values(parsed.fcts);
        assert.equal(actions.length, 2);
        assert.deepEqual(actions.map(action => action.attributeName).sort(), ['count', 'title']);
        assert.equal(new Set(actions.map(action => action.name)).size, 2);
        for (const action of actions) {
            assert.equal(action.txt, 'value');
            assert.equal(action.tagName, 'demo-card');
            assert.equal(action.positions.length, 1);
            assert.equal(source.slice(action.positions[0].start, action.positions[0].end), '{{value}}');
        }
    }
});

test.skip('repeated expression on the same HTML attribute shares one action with two exact ranges', () => {
    const source = '<demo-card title="{{value}} / {{value}}"></demo-card>';
    const actions = Object.values(fixture(source).parse().fcts);
    assert.equal(actions.length, 1);
    assert.equal(actions[0].attributeName, 'title');
    assert.deepEqual(actions[0].positions.map(position => source.slice(position.start, position.end)), ['{{value}}', '{{value}}']);
    assert.notEqual(actions[0].positions[0].start, actions[0].positions[1].start);
});
