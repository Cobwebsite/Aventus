import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('component branches update slots, injections and bindings across successive view edits', () => {
    const uri = `file:///D:/round175/component-branches-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = 'for (const item of items) { if (item.active) { <demo-card :title="item.title" @bind:value="item.value"><slot name="header">Active</slot></demo-card> } else { <demo-card :title="item.fallback"><slot name="body">Idle</slot></demo-card> } }';
    const first = parse(firstSource);
    assert.deepEqual(first.errors, []);
    assert.equal(first.loops.length, 1);
    assert.equal(first.ifs.length, 1);
    assert.deepEqual(first.tags.filter(tag => tag.tagName === 'demo-card').length, 2);
    assert.deepEqual(first.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['header', 'body']);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['item.title', 'item.fallback']);
    assert.deepEqual(first.bindings.map(item => item.injectTsTxt), ['item.value']);
    for (const expression of [...first.injections, ...first.bindings]) {
        assert.equal(firstSource.slice(expression.start, expression.end), `"${expression.injectTsTxt}"`);
    }

    const secondSource = '\nfor (const entry of entries) { if (entry.selected) { <demo-card :title="entry.name"><slot name="actions">Select</slot></demo-card> } else { <demo-card @bind:checked="entry.checked"><slot name="footer">Skip</slot></demo-card> } }';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    assert.deepEqual(second.loops[0].simple, { data: 'entries', item: 'entry' });
    assert.deepEqual(second.ifs[0].conditions.map(item => item.txt), ['entry.selected']);
    assert.deepEqual(second.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['actions', 'footer']);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['entry.name']);
    assert.deepEqual(second.bindings.map(item => item.injectTsTxt), ['entry.checked']);
    for (const expression of [...second.injections, ...second.bindings]) {
        assert.equal(secondSource.slice(expression.start, expression.end), `"${expression.injectTsTxt}"`);
    }
    assert.doesNotMatch(second.compiledTxt, /header|body|item\.|Active|Idle/);

    const final = parse('<demo-card title="Done"><slot name="body">Ready</slot></demo-card>');
    assert.deepEqual(final.errors, []);
    assert.deepEqual(final.loops, []);
    assert.deepEqual(final.ifs, []);
    assert.deepEqual(final.injections, []);
    assert.deepEqual(final.bindings, []);
    assert.deepEqual(final.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['body']);
    assert.doesNotMatch(final.compiledTxt, /entry\.|item\.|actions|footer/);
});
