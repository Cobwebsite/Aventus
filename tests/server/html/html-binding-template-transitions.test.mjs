import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('HTML template bindings and injections follow repeated view edits without stale actions', () => {
    const uri = 'file:///D:/test/html-binding-template-transitions-round189.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: { componentClassName: 'Editor', viewMethodName: 'view' }, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };

    function parse(source) {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        const parsed = ParserHtml.parse(view, build);
        return { source, parsed, template: parsed.getParsedInfo('Editor') };
    }

    const first = parse('<input @bind:value="model.name" :disabled="saving"><select @bind_change:value="model.choice"></select>');
    assert.deepEqual(first.parsed.bindings.map(item => [item.tagName, item.event, item.injectTsTxt]), [
        ['input', undefined, 'model.name'], ['select', 'change', 'model.choice'],
    ]);
    assert.deepEqual(first.template.bindings.map(item => [item.tagName, item.eventNames, item.injectionName]), [
        ['input', ['change', 'input'], 'value'], ['select', ['change'], 'value'],
    ]);
    assert.deepEqual(first.template.injection.map(item => item.injectionName), ['disabled']);
    assert.deepEqual(first.parsed.bindings.map(item => first.source.slice(item.start, item.end)), ['"model.name"', '"model.choice"']);

    const second = parse('\n<textarea @bind_input:value="profile.title" :readonly="locked"></textarea>');
    assert.deepEqual(second.parsed.bindings.map(item => [item.tagName, item.event, item.injectTsTxt]), [['textarea', 'input', 'profile.title']]);
    assert.deepEqual(second.template.bindings.map(item => [item.tagName, item.eventNames, item.injectionName]), [['textarea', ['input'], 'value']]);
    assert.deepEqual(second.parsed.injections.map(item => [item.attr, item.injectTsTxt]), [['readonly', 'locked']]);
    assert.deepEqual(second.template.injection.map(item => item.injectionName), ['readonly']);
    assert.equal(second.source.slice(second.parsed.bindings[0].start, second.parsed.bindings[0].end), '"profile.title"');
    assert.equal(second.source.slice(second.parsed.injections[0].start, second.parsed.injections[0].end), '"locked"');

    const third = parse('<textarea>plain text</textarea>');
    assert.deepEqual(third.parsed.bindings, []);
    assert.deepEqual(third.parsed.injections, []);
    assert.deepEqual(third.template.bindings, []);
    assert.deepEqual(third.template.injection, []);
});
