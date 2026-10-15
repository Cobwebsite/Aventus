import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('nested component loop in an else-if branch is replaced without stale slots or expressions', () => {
    const uri = `file:///D:/round209/nested-component-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = 'if (ready) { <demo-card title="Ready"><slot name="header">Now</slot></demo-card> } else if (pending) { for (const entry of entries) { <demo-card :title="entry.label" @bind:value="entry.value"><slot name="body">Pending</slot></demo-card> } } else { <p>None</p> }';
    const first = parse(firstSource);
    assert.deepEqual(first.errors, []);
    assert.deepEqual(first.ifs[0].conditions.map(condition => condition.txt), ['ready', 'pending']);
    assert.equal(first.loops.length, 1);
    assert.deepEqual(first.loops[0].simple, { item: 'entry', data: 'entries' });
    assert.equal(first.tags.filter(tag => tag.tagName === 'demo-card').length, 2);
    assert.deepEqual(first.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['header', 'body']);
    assert.deepEqual(first.injections.map(injection => injection.injectTsTxt), ['entry.label']);
    assert.deepEqual(first.bindings.map(binding => binding.injectTsTxt), ['entry.value']);
    for (const expression of [...first.injections, ...first.bindings]) {
        assert.equal(firstSource.slice(expression.start, expression.end), `"${expression.injectTsTxt}"`);
    }

    const secondSource = '\nif (ready) { <demo-card title="Ready"><slot name="footer">Later</slot></demo-card> } else { <p>None</p> }';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    assert.deepEqual(second.ifs[0].conditions.map(condition => condition.txt), ['ready']);
    assert.deepEqual(second.loops, []);
    assert.deepEqual(second.injections, []);
    assert.deepEqual(second.bindings, []);
    assert.deepEqual(second.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['footer']);
    assert.doesNotMatch(second.compiledTxt, /pending|entries|entry\.|header|body/);
});
