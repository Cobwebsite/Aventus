import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/html/LanguageService.ts',
]);

function service() {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDefinitionFiles = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();
    html.languageService = getLanguageService({ customDataProviders: [html.defaultProvider()] });
    return html;
}

function definition(className, attribute, value) {
    return { 'shared-card': {
        name: 'shared-card', class: className, description: `${className} component`,
        attributes: { [attribute]: {
            name: attribute, description: `${className} attribute`, values: [{ name: value }],
        } },
    } };
}

async function attributes(html) {
    const source = '<shared-card ';
    const document = TextDocument.create('file:///batched-precedence.html.avt', 'Aventus HTML', 1, source);
    const result = await html.doComplete({ file: { documentUser: document }, fileParsed: null }, document.positionAt(source.length));
    return new Set(result.items.map(item => item.label));
}

test('batched HTML project reload updates mixed internal/external precedence and completion metadata', async () => {
    const html = service();
    const localUri = 'file:///local/shared.wcl.avt';
    const localFile = { uri: localUri };
    html.addExternalDefinition('file:///package-a', definition('PackageA', 'first-option', 'first'));
    html.addExternalDefinition('file:///package-b', definition('PackageB', 'second-option', 'second'));
    html.addInternalDefinition(localUri, definition('LocalCard', 'local-option', 'local'), localFile);
    assert.equal(html.getClassByTag('shared-card'), 'LocalCard');
    assert.equal(html.getInternalDefinition('shared-card'), localFile);
    assert.ok((await attributes(html)).has('local-option'));

    html.allowRebuildDefinition(false);
    html.removeInternalDefinition(localUri);
    html.removeExternalDefinition('file:///package-b');
    html.addExternalDefinition('file:///package-a', definition('UpdatedPackageA', 'updated-option', 'updated'));
    assert.equal(html.getClassByTag('shared-card'), 'LocalCard');
    html.allowRebuildDefinition(true);

    assert.equal(html.getClassByTag('shared-card'), 'UpdatedPackageA');
    assert.equal(html.getInternalDefinition('shared-card'), undefined);
    assert.deepEqual(html.provideValues('shared-card', 'updated-option'), [{ name: 'updated' }]);
    assert.deepEqual(html.provideValues('shared-card', 'local-option'), []);
    assert.deepEqual(html.provideValues('shared-card', 'second-option'), []);
    const updated = await attributes(html);
    assert.ok(updated.has('updated-option'));
    assert.ok(!updated.has('local-option'));
    assert.ok(!updated.has('second-option'));
    assert.ok(!updated.has('first-option'));

    html.removeExternalDefinition('file:///package-a');
    assert.equal(html.getClassByTag('shared-card'), null);
    const removed = await attributes(html);
    assert.ok(!removed.has('updated-option'));
});
