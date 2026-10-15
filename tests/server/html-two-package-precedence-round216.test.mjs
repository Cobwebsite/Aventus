import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }, { AventusPackageFile }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/LanguageService.ts',
    'language-services/ts/package/File.ts',
]);

function packageSource(tag, className, attribute) {
    const html = { [tag]: { name: tag, class: className, description: className,
        attributes: { [attribute]: { name: attribute, description: attribute, values: [] } } } };
    return `// Demo@web:1.0.0\n//#region js def //\nexport class ${className} {}\n//#endregion js def //\n` +
        `//#region js src //\n{}\n//#endregion js src //\n` +
        `//#region css def //\n{}\n//#endregion css def //\n` +
        `//#region css //\n{}\n//#endregion css //\n` +
        `//#region html //\n${JSON.stringify(html)}\n//#endregion html //\n` +
        `//#region dependencies //\n{}\n//#endregion dependencies //\n`;
}

test('two package files with the same HTML tag reveal the surviving definition after revision and deletion', async () => {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();

    const build = {
        htmlLanguageService: html,
        scssLanguageService: { addExternalDefinition() {}, removeExternalDefinition() {} },
        externalPackageInformation: { rebuild() {} },
        build() {},
    };
    const makeFile = (name, className, attribute) => {
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { uri: `file:///round216/${name}.package.avt`,
            contentUser: packageSource('shared-card', className, attribute) };
        file._build = build;
        file.version = { major: 0, minor: 0, patch: 0 };
        file.tsFile = { triggerContentChange() {}, triggerDelete() {} };
        file.prepareFile();
        return file;
    };
    const first = makeFile('First', 'FirstCard', 'first-option');
    const second = makeFile('Second', 'SecondCard', 'second-option');
    assert.equal(html.getClassByTag('shared-card'), 'SecondCard');
    assert.deepEqual(html.provideAttributes('shared-card').map(item => item.name).filter(name => name.endsWith('-option')), ['second-option']);

    second.file.contentUser = packageSource('new-card', 'NewCard', 'new-option');
    await second.onContentChange();
    assert.equal(html.getClassByTag('shared-card'), 'FirstCard');
    assert.deepEqual(html.provideAttributes('shared-card').map(item => item.name).filter(name => name.endsWith('-option')), ['first-option']);
    assert.equal(html.getClassByTag('new-card'), 'NewCard');

    await first.onDelete();
    assert.equal(html.getClassByTag('shared-card'), null);
    assert.equal(html.getClassByTag('new-card'), 'NewCard');
    await second.onDelete();
    assert.equal(html.getClassByTag('new-card'), null);
});
