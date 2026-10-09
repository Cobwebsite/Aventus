import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [manifestModule, componentModule] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);
const { Manifest } = manifestModule;
const { AventusWebComponentLogicalFile } = componentModule;

function fixture() {
    const build = {
        buildConfig: { fullname: 'Demo@Main' },
        project: { getConfigFile: () => ({ uri: 'file:///aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    };
    const manifest = new Manifest({}, build);
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    const info = {
        fullName: 'Demo.Card',
        class: { name: 'Card', documentation: { definitions: ['A card component'] }, isAbstract: false, extends: [] },
        attributes: [{ name: 'size', local: true, type: { kind: 'literal', value: '"small"', isArray: false }, documentation: { definitions: ['Size of card'] } }],
        props: [], propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
    };
    return { manifest, file, info };
}

test('HTML custom data contains the tag, attribute values and documentation', () => {
    const { manifest, file, info } = fixture();
    manifest.htmlCustomData.register(file, info);
    const tag = manifest.htmlCustomData._package.tags[0];
    assert.equal(tag.name, 'demo-card');
    assert.match(tag.description, /A card component/);
    assert.deepEqual(tag.attributes[0].values, [{ name: 'small' }]);
    assert.match(tag.attributes[0].description, /Size of card/);
});

test('Emmet custom data creates a component snippet', () => {
    const { manifest, file, info } = fixture();
    manifest.emmetCustomData.register(file, info);
    assert.equal(manifest.emmetCustomData._package.html.snippets['demo-card'], '<demo-card>${1}</demo-card>');
});

test('Web Types include the component name and description', () => {
    const { manifest, file, info } = fixture();
    manifest.webTypes.register(file, info);
    const element = manifest.webTypes._package.contributions.html.elements[0];
    assert.equal(element.name, 'demo-card');
    assert.match(element.description, /A card component/);
});

test('Custom Elements manifest records a component declaration', () => {
    const { manifest, file, info } = fixture();
    manifest.customElements.register(file, info);
    const module = manifest.customElements._package.modules[0];
    assert.equal(module.kind, 'javascript-module');
    assert.equal(module.declarations[0].name, 'Card');
    assert.equal(module.declarations[0].tagName, 'demo-card');
});
