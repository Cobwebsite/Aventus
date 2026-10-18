import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/html/LanguageService.ts',
]);

function definition(tag, className, attribute) {
    return { [tag]: { name: tag, class: className, description: className,
        attributes: { [attribute]: { name: attribute, description: attribute, values: [] } } } };
}

test('moving a local tag away and back reveals and masks the package definition without stale completions', async () => {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDefinitionFiles = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();
    html.languageService = getLanguageService({ customDataProviders: [html.defaultProvider()] });

    const localUri = 'file:///round248/local.wcl.avt';
    const localFile = { uri: localUri };
    const packageUri = 'file:///round248/package.avt';
    async function attributes(tag) {
        const source = `<${tag} `;
        const document = TextDocument.create('file:///round248/view.html.avt', 'Aventus HTML', 1, source);
        const result = await html.doComplete({ file: { documentUser: document }, fileParsed: null }, document.positionAt(source.length));
        return new Set(result.items.map(item => item.label));
    }

    html.addExternalDefinition(packageUri, definition('shared-card', 'PackageCard', 'package-option'));
    html.addInternalDefinition(localUri, definition('shared-card', 'LocalCard', 'local-option'), localFile);
    assert.equal(html.getClassByTag('shared-card'), 'LocalCard');
    assert.ok((await attributes('shared-card')).has('local-option'));

    html.addInternalDefinition(localUri, definition('moved-card', 'MovedCard', 'moved-option'), localFile);
    assert.equal(html.getClassByTag('shared-card'), 'PackageCard');
    assert.equal(html.getClassByTag('moved-card'), 'MovedCard');
    assert.ok((await attributes('shared-card')).has('package-option'));
    assert.ok(!(await attributes('shared-card')).has('local-option'));
    assert.ok((await attributes('moved-card')).has('moved-option'));

    html.addInternalDefinition(localUri, definition('shared-card', 'ReturnedCard', 'returned-option'), localFile);
    assert.equal(html.getClassByTag('shared-card'), 'ReturnedCard');
    assert.equal(html.getClassByTag('moved-card'), null);
    assert.ok((await attributes('shared-card')).has('returned-option'));
    assert.ok(!(await attributes('shared-card')).has('package-option'));
    assert.ok(!(await attributes('shared-card')).has('local-option'));
    assert.ok(!(await attributes('moved-card')).has('moved-option'));
});
