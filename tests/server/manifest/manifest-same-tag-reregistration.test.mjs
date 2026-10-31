import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

function fixture() {
    return new Manifest({}, {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    });
}

function registerAll(manifest, file, member) {
    const name = file.componentClassName;
    const info = {
        fullName: `Demo.${name}`,
        class: { name, documentation: { definitions: [`${member} docs`] }, extends: [], isAbstract: false },
        attributes: [],
        props: [{ name: member, local: true, type: { kind: 'type', value: 'string', genericValue: [], isArray: false } }],
        propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
    };
    manifest.customElements.register(file, info);
    manifest.htmlCustomData.register(file, info);
    manifest.emmetCustomData.register(file, info);
    manifest.webTypes.register(file, info);
}

test('re-registering the same tag after member change replaces old manifest entries', () => {
    const manifest = fixture();
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///project/Card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];

    registerAll(manifest, file, 'oldMember');
    registerAll(manifest, file, 'newMember');

    assert.deepEqual(manifest.customElements._package.modules.map(module =>
        module.declarations[0].members.map(member => member.name)), [['newMember']]);
    assert.deepEqual(manifest.htmlCustomData._package.tags.map(tag => tag.name), ['demo-card']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements.map(element =>
        element.js.properties.map(property => property.name)), [['newMember']]);
    assert.deepEqual(Object.keys(manifest.emmetCustomData._package.html.snippets), ['demo-card']);
});

test('a component with no matching compilation result is excluded from every manifest format', () => {
    const manifest = fixture();
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///project/Card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Other', tagName: 'demo-other' }];

    registerAll(manifest, file, 'member');

    assert.deepEqual(manifest.customElements._package.modules, []);
    assert.deepEqual(manifest.htmlCustomData._package.tags, []);
    assert.deepEqual(Object.keys(manifest.emmetCustomData._package.html.snippets), []);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements, []);
});
