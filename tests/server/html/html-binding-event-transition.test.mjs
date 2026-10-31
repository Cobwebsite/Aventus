import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('le changement de syntaxe, événement et cible d’un binding HTML renouvelle ses actions', () => {
    const uri = `file:///D:/test/html-binding-event-round153-${process.pid}.wcv.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = '<input $change:value="model?.name" :disabled="busy">';
    const first = parse(firstSource);
    assert.deepEqual(first.errors, []);
    assert.equal(first.bindings.length, 1);
    assert.equal(first.bindings[0].event, 'change');
    assert.equal(first.bindings[0].valueName, 'value');
    assert.equal(first.bindings[0].injectTsTxt, 'model?.name');
    assert.equal(first.bindings[0].extractTsCond, 'model');
    assert.equal(first.bindings[0].extractTsTxt, 'model.name');
    assert.equal(firstSource.slice(first.bindings[0].start, first.bindings[0].end), '"model?.name"');

    const secondSource = '\n<section><input @bind_blur:checked="settings.enabled" :title="label"></section>';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    assert.equal(second.bindings.length, 1);
    assert.equal(second.bindings[0].event, 'blur');
    assert.equal(second.bindings[0].valueName, 'checked');
    assert.equal(second.bindings[0].injectTsTxt, 'settings.enabled');
    assert.equal(second.bindings[0].extractTsCond, 'settings');
    assert.equal(second.injections.length, 1);
    assert.equal(second.injections[0].attr, 'title');
    assert.equal(second.injections[0].injectTsTxt, 'label');
    assert.equal(secondSource.slice(second.bindings[0].start, second.bindings[0].end), '"settings.enabled"');
    assert.equal(secondSource.slice(second.injections[0].start, second.injections[0].end), '"label"');

    const removed = parse('<input :title="label">');
    assert.deepEqual(removed.errors, []);
    assert.deepEqual(removed.bindings, []);
    assert.equal(removed.injections.length, 1);
    assert.equal(removed.injections[0].injectTsTxt, 'label');
});
