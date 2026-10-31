import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

test('a component removed by parsing invalidation clears all four manifest contributions', () => {
    const uri = 'file:///project/Card.wcl.avt';
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    const componentClass = {
        name: 'Card', fullName: 'Card', fileUri: uri, parentClass: null,
        properties: {}, propertiesStatic: {}, methods: {}, methodsStatic: {},
        decorators: [], extends: [], isAbstract: false,
    };
    file.fileParsed = { classes: { Card: componentClass } };
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        tsFiles: { [uri]: file }, htmlFiles: {}, scssFiles: {}, noNamespaceUri: {},
        externalPackageInformation: { getByUri: () => undefined },
    };
    file._build = build;
    const manifest = new Manifest({}, build);

    manifest.register(file);
    assert.equal(manifest.customElements._package.modules.length, 1);
    assert.equal(manifest.htmlCustomData._package.tags.length, 1);
    assert.equal(manifest.webTypes._package.contributions.html.elements.length, 1);
    assert.equal(Object.keys(manifest.emmetCustomData._package.html.snippets).length, 1);

    file.fileParsed = { classes: {} };
    manifest.register(file);
    assert.deepEqual(manifest.customElements._package.modules, []);
    assert.deepEqual(manifest.htmlCustomData._package.tags, []);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements, []);
    assert.deepEqual(manifest.emmetCustomData._package.html.snippets, {});

    file.fileParsed = { classes: { Card: componentClass } };
    manifest.register(file);
    assert.equal(manifest.customElements._package.modules.length, 1);
    file.fileParsed = null;
    manifest.register(file);
    assert.deepEqual(manifest.customElements._package.modules, []);
    assert.deepEqual(manifest.htmlCustomData._package.tags, []);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements, []);
    assert.deepEqual(manifest.emmetCustomData._package.html.snippets, {});
});
