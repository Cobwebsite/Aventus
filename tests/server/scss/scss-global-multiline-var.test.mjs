import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
]);

function file(uri, version, text) {
    return { documentUser: TextDocument.create(uri, 'scss', version, text) };
}

function at(document, name) {
    return document.positionAt(document.getText().indexOf(name) + 3);
}

test('multiline var references and rename follow a global declaration through consumer revisions', () => {
    const project = { scssFiles: {}, getBuilds: () => [build] };
    const global = new AventusGlobalSCSSLanguageService(project);
    const build = { scssFiles: {} };
    const sourceUri = 'file:///D:/round249/multiline.scss.avt';
    const consumerUri = 'file:///D:/round249/card.wcs.avt';
    const source = file(sourceUri, 1, ':root { --accent: red; }');
    const first = file(consumerUri, 1, '.card { color: var(\n  --accent\n); background: var( --accent, blue ); }');
    global.loadVariables({ file: source }, sourceUri);
    project.scssFiles[sourceUri] = { file: source };
    build.scssFiles[consumerUri] = { file: first };

    const refs = global.getGlobalReferences(first.documentUser, at(first.documentUser, '--accent'));
    assert.deepEqual(refs?.map(location => location.uri), [sourceUri, consumerUri, consumerUri]);
    assert.deepEqual(refs.map(location => (location.uri === sourceUri ? source : first).documentUser.getText(location.range)),
        ['--accent', '--accent', '--accent']);
    assert.deepEqual(global.onRename(first.documentUser, at(first.documentUser, '--accent'), 'tone')?.changes[consumerUri]
        .map(edit => edit.newText), ['--tone', '--tone']);

    const revised = file(consumerUri, 2, '.card { color: var(--accent); background: blue; }');
    build.scssFiles[consumerUri] = { file: revised };
    assert.deepEqual(global.getGlobalReferences(source.documentUser, at(source.documentUser, '--accent'))
        ?.map(location => location.uri), [sourceUri, consumerUri]);

    const removed = file(consumerUri, 3, '.card { color: blue; }');
    build.scssFiles[consumerUri] = { file: removed };
    assert.deepEqual(global.getGlobalReferences(source.documentUser, at(source.documentUser, '--accent'))
        ?.map(location => location.uri), [sourceUri]);
    assert.equal(global.getGlobalReferences(removed.documentUser, removed.documentUser.positionAt(0)), null);
});
