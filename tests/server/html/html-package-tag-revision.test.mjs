import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }, { AventusPackageFile }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/LanguageService.ts',
    'language-services/ts/package/File.ts',
]);

function packageSource(tag, className) {
    const html = { [tag]: { name: tag, class: className, description: className, attributes: {} } };
    return `// Demo@web:1.0.0\n//#region js def //\nexport class ${className} {}\n//#endregion js def //\n` +
        `//#region js src //\n{}\n//#endregion js src //\n` +
        `//#region css def //\n{}\n//#endregion css def //\n` +
        `//#region css //\n{}\n//#endregion css //\n` +
        `//#region html //\n${JSON.stringify(html)}\n//#endregion html //\n` +
        `//#region dependencies //\n{}\n//#endregion dependencies //\n`;
}

test('package file tag revisions remove old HTML definitions while preserving a local tag', async () => {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDefinitionFiles = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();

    let builds = 0;
    const file = Object.create(AventusPackageFile.prototype);
    file._file = { uri: 'file:///round214/Demo.package.avt', contentUser: packageSource('old-card', 'OldCard') };
    file._build = {
        htmlLanguageService: html,
        scssLanguageService: { addExternalDefinition() {}, removeExternalDefinition() {} },
        externalPackageInformation: { rebuild() {} },
        build() { builds++; },
    };
    file.version = { major: 0, minor: 0, patch: 0 };
    file.tsFile = { triggerContentChange() {}, triggerDelete() {} };
    file.prepareFile();
    assert.equal(html.getClassByTag('old-card'), 'OldCard');

    const localUri = 'file:///round214/local.wcl.avt';
    html.addInternalDefinition(localUri, {
        'old-card': { name: 'old-card', class: 'LocalCard', description: 'local', attributes: {} },
    }, { uri: localUri });
    assert.equal(html.getClassByTag('old-card'), 'LocalCard');

    file.file.contentUser = packageSource('new-card', 'NewCard');
    await file.onContentChange();
    assert.equal(builds, 1);
    assert.equal(html.getClassByTag('old-card'), 'LocalCard');
    assert.equal(html.getClassByTag('new-card'), 'NewCard');

    html.removeInternalDefinition(localUri);
    assert.equal(html.getClassByTag('old-card'), null);
    assert.equal(html.getClassByTag('new-card'), 'NewCard');

    await file.onDelete();
    assert.equal(html.getClassByTag('new-card'), null);
});
