import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('les actions d’expression distinguent attribut et balise puis suivent les révisions de la vue', () => {
    const uri = `file:///D:/test/html-expression-actions-round242-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: { componentClassName: 'Card', viewMethodName: 'view' }, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const first = parse('<demo-card title="{{value}} / {{value}}" count="{{value}}"></demo-card><other-card title="{{value}}"></other-card>');
    assert.deepEqual(first.errors, []);
    const initial = Object.values(first.fcts);
    assert.equal(initial.length, 3);
    assert.deepEqual(initial.map(action => `${action.tagName}:${action.attributeName}:${action.positions.length}`).sort(), [
        'demo-card:count:1', 'demo-card:title:2', 'other-card:title:1',
    ]);
    assert.equal(new Set(initial.map(action => action.name)).size, 3);
    assert.ok(initial.every(action => action.txt === 'value'));

    const secondSource = '\n<other-card title="{{next}}"></other-card>\n<demo-card count="{{next}}" title="{{next}}"></demo-card>';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    const updated = Object.values(second.fcts);
    assert.equal(updated.length, 3);
    assert.deepEqual(updated.map(action => `${action.tagName}:${action.attributeName}:${action.txt}`).sort(), [
        'demo-card:count:next', 'demo-card:title:next', 'other-card:title:next',
    ]);
    assert.ok(updated.every(action => action.positions.length === 1));
    assert.ok(updated.every(action => action.positions[0].start > 0));
    assert.ok(updated.every(action => action.positions[0].start < secondSource.length));
    assert.equal(new Set(updated.map(action => action.name)).size, 3);

    const final = parse('<div>plain</div>');
    assert.deepEqual(final.errors, []);
    assert.deepEqual(Object.values(final.fcts), []);
});
