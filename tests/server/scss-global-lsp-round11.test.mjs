import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusGlobalSCSSLanguageService } = await loadServerModule('language-services/scss/GlobalLanguageService.ts');

function file(source) {
    const uri = 'file:///D:/app/global-round11.scss.avt';
    return { uri, documentUser: TextDocument.create(uri, 'scss', 1, source) };
}

test('global SCSS resolves a local custom property reference to its declaration', async () => {
    const source = file(':root { --accent: #123456; } .card { color: var(--accent); }');
    const service = new AventusGlobalSCSSLanguageService();
    const offset = source.documentUser.getText().lastIndexOf('--accent') + 3;
    const definitions = await service.findDefinition(source, source.documentUser.positionAt(offset));
    assert.equal(definitions?.length, 1);
    assert.equal(definitions[0].uri, source.uri);
    assert.equal(source.documentUser.getText(definitions[0].range), '--accent');
});

test('global SCSS references include both custom property declaration and use', async () => {
    const source = file(':root { --accent: #123456; } .card { color: var(--accent); }');
    const service = new AventusGlobalSCSSLanguageService();
    const offset = source.documentUser.getText().indexOf('--accent') + 3;
    const references = await service.onReferences(source, source.documentUser.positionAt(offset));
    assert.deepEqual(references.map(item => source.documentUser.getText(item.range)), ['--accent', '--accent']);
    assert.ok(references.every(item => item.uri === source.uri));
});
