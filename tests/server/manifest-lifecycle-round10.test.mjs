import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

function fixture() {
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    };
    return new Manifest({}, build);
}

function component(name, tagName) {
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: `file:///project/${name}.wcl.avt` };
    file.fileParsed = { classes: {} };
    file._componentClassName = name;
    file._compileResult = [{ classScript: `Demo.${name}`, tagName }];
    const info = {
        fullName: `Demo.${name}`,
        class: { name, documentation: { definitions: [`${name} documentation`] }, extends: [], isAbstract: false },
        attributes: [], props: [], propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
    };
    return { file, info };
}

function registerAll(manifest, { file, info }) {
    manifest.customElements.register(file, info);
    manifest.htmlCustomData.register(file, info);
    manifest.emmetCustomData.register(file, info);
    manifest.webTypes.register(file, info);
}

test('multiple components retain their own paths and tags in every manifest format', () => {
    const manifest = fixture();
    registerAll(manifest, component('Card', 'demo-card'));
    registerAll(manifest, component('Panel', 'demo-panel'));
    const modules = manifest.customElements._package.modules;
    assert.deepEqual(modules.map(item => [item.path, item.declarations[0].tagName]), [
        ['__src/Card.wcl.js', 'demo-card'], ['__src/Panel.wcl.js', 'demo-panel'],
    ]);
    assert.deepEqual(manifest.htmlCustomData._package.tags.map(item => item.name), ['demo-card', 'demo-panel']);
    assert.deepEqual(Object.keys(manifest.emmetCustomData._package.html.snippets), ['demo-card', 'demo-panel']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements.map(item => item.name), ['demo-card', 'demo-panel']);
});

test('re-registering a changed component retains stale entries in list-based manifests', () => {
    const manifest = fixture();
    const card = component('Card', 'demo-card');
    registerAll(manifest, card);
    card.file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card-new' }];
    registerAll(manifest, card);
    assert.deepEqual(manifest.customElements._package.modules.map(item => item.declarations[0].tagName), [
        'demo-card', 'demo-card-new',
    ]);
    assert.deepEqual(manifest.htmlCustomData._package.tags.map(item => item.name), ['demo-card', 'demo-card-new']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements.map(item => item.name), [
        'demo-card', 'demo-card-new',
    ]);
    assert.deepEqual(Object.keys(manifest.emmetCustomData._package.html.snippets), ['demo-card', 'demo-card-new']);
});
