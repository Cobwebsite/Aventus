import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

test('two component URIs with one tag keep both manifest entries until one is removed', () => {
    const manifest = new Manifest({}, {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    });
    const register = (name, member) => {
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._file = { uri: `file:///project/${name}.wcl.avt` };
        file.fileParsed = { classes: {} };
        file._componentClassName = name;
        file._compileResult = [{ classScript: `Demo.${name}`, tagName: 'demo-card' }];
        const info = {
            fullName: `Demo.${name}`,
            class: { name, documentation: { definitions: [`${name} documentation`] }, extends: [], isAbstract: false },
            attributes: [], props: [{ name: member, local: true,
                type: { kind: 'type', value: 'string', genericValue: [], isArray: false } }],
            propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
        };
        for (const output of [manifest.customElements, manifest.htmlCustomData, manifest.emmetCustomData, manifest.webTypes]) {
            output.register(file, info);
        }
        return file.file.uri;
    };
    const first = register('Card', 'cardOnly');
    register('Panel', 'panelOnly');
    assert.deepEqual(manifest.customElements._package.modules.map(module => module.declarations[0].tagName),
        ['demo-card', 'demo-card']);
    assert.deepEqual(manifest.htmlCustomData._package.tags.map(tag => tag.name), ['demo-card', 'demo-card']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements.map(element => element.name),
        ['demo-card', 'demo-card']);
    assert.deepEqual(Object.keys(manifest.emmetCustomData._package.html.snippets), ['demo-card']);

    manifest.unregister(first);
    assert.deepEqual(manifest.customElements._package.modules.map(module => module.declarations[0].name), ['Panel']);
    assert.deepEqual(manifest.htmlCustomData._package.tags.map(tag => tag.name), ['demo-card']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements.map(element => element.name), ['demo-card']);
    assert.deepEqual(Object.keys(manifest.emmetCustomData._package.html.snippets), ['demo-card']);
});
