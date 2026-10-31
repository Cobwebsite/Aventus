import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');
let id = 0;

function fixture(source) {
    const uri = `file:///D:/test/html-bindings-round94-${++id}.html.avt`;
    const file = { uri, versionUser: 1, documentUser: TextDocument.create(uri, 'aventus-html', 1, source) };
    const view = { file, tsFile: { componentClassName: 'Editor', viewMethodName: 'view' }, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    return {
        parse: () => ParserHtml.parse(view, build),
        edit(text) {
            file.versionUser++;
            file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, text);
        },
    };
}

test('HTML binding keeps event and value names separate from expression across conditional offset', () => {
    const source = 'if (ready) { <input @bind_input:value="model.name" :disabled="saving"> }';
    const parsed = fixture(source).parse();
    assert.equal(parsed.bindings.length, 1);
    assert.equal(parsed.injections.length, 1);
    const binding = parsed.bindings[0];
    assert.equal(binding.tagName, 'input');
    assert.equal(binding.event, 'input');
    assert.equal(binding.valueName, 'value');
    assert.equal(binding.injectTsTxt, 'model.name');
    assert.equal(binding.extractTsCond, 'model');
    assert.equal(binding.extractTsTxt, 'model.name');
    assert.equal(source.slice(binding.start, binding.end), '"model.name"');
    const injection = parsed.injections[0];
    assert.equal(injection.attr, 'disabled');
    assert.equal(injection.injectTsTxt, 'saving');
    assert.equal(source.slice(injection.start, injection.end), '"saving"');
});

test('HTML binding and injection ranges refresh after edit without keeping old expressions', () => {
    const original = '<input @bind:value="model.name" :disabled="saving">';
    const updated = '\n<section>\n  <input @bind:value="profile.title" :disabled="busy">\n</section>';
    const document = fixture(original);
    document.parse();
    document.edit(updated);
    const parsed = document.parse();
    assert.equal(parsed.bindings.length, 1);
    assert.equal(parsed.injections.length, 1);
    assert.equal(parsed.bindings[0].injectTsTxt, 'profile.title');
    assert.equal(parsed.injections[0].injectTsTxt, 'busy');
    assert.equal(updated.slice(parsed.bindings[0].start, parsed.bindings[0].end), '"profile.title"');
    assert.equal(updated.slice(parsed.injections[0].start, parsed.injections[0].end), '"busy"');
});
