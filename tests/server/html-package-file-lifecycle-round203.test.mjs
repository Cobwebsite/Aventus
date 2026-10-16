import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }, { AventusPackageFile }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/LanguageService.ts',
    'language-services/ts/package/File.ts',
]);

function definition(className, attribute) {
    return { 'shared-card': { name: 'shared-card', class: className, description: className,
        attributes: { [attribute]: { name: attribute, description: attribute, values: [] } } } };
}

function packageSource(html) {
    return `// Demo@web:1.0.0\n//#region js def //\nexport class SharedCard {}\n//#endregion js def //\n` +
        `//#region js src //\n{}\n//#endregion js src //\n` +
        `//#region css def //\n{}\n//#endregion css def //\n` +
        `//#region css //\n{}\n//#endregion css //\n` +
        `//#region html //\n${JSON.stringify(html)}\n//#endregion html //\n` +
        `//#region dependencies //\n{}\n//#endregion dependencies //\n`;
}

test('package file revisions and deletion restore a local HTML component without stale package attributes', async () => {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDefinitionFiles = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();
    html.languageService = getLanguageService({ customDataProviders: [html.defaultProvider()] });

    const uri = 'file:///round203/Demo.package.avt';
    let rebuilds = 0;
    let builds = 0;
    let deletions = 0;
    const build = { htmlLanguageService: html,
        scssLanguageService: { addExternalDefinition() {}, removeExternalDefinition() {} },
        externalPackageInformation: { rebuild() { rebuilds++; } },
        build() { builds++; } };
    const file = Object.create(AventusPackageFile.prototype);
    file._file = { uri, contentUser: packageSource(definition('PackageOne', 'package-one')) };
    file._build = build;
    file.version = { major: 0, minor: 0, patch: 0 };
    file.tsFile = { triggerContentChange() {}, triggerDelete() { deletions++; } };
    file.prepareFile();
    assert.equal(html.getClassByTag('shared-card'), 'PackageOne');
    assert.equal(rebuilds, 1);

    const localUri = 'file:///round203/shared.wcl.avt';
    const localFile = { uri: localUri };
    html.addInternalDefinition(localUri, definition('LocalCard', 'local-option'), localFile);
    assert.equal(html.getClassByTag('shared-card'), 'LocalCard');

    file.file.contentUser = packageSource(definition('PackageTwo', 'package-two'));
    await file.onContentChange();
    assert.equal(rebuilds, 2);
    assert.equal(builds, 1);
    assert.equal(html.getClassByTag('shared-card'), 'LocalCard');
    html.removeInternalDefinition(localUri);
    assert.equal(html.getClassByTag('shared-card'), 'PackageTwo');
    assert.deepEqual(html.provideAttributes('shared-card').map(a => a.name).filter(a => a.startsWith('package-')), ['package-two']);
    const source = '<shared-card ';
    const document = TextDocument.create('file:///round203/consumer.wcv.avt', 'Aventus HTML', 1, source);
    const labels = (await html.doComplete({ file: { documentUser: document }, fileParsed: null }, document.positionAt(source.length)))
        .items.map(item => item.label);
    assert.ok(labels.includes('package-two'));
    assert.ok(!labels.includes('package-one'));
    assert.ok(!labels.includes('local-option'));

    await file.onDelete();
    assert.equal(deletions, 1);
    assert.equal(html.getClassByTag('shared-card'), null);
    assert.deepEqual(html.provideValues('shared-card', 'package-two'), []);
});
