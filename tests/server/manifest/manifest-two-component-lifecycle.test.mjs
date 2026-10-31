import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Manifest }, { SettingsManager }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'settings/Settings.ts', 'language-services/ts/component/File.ts',
]);

function manifest() {
    return new Manifest({}, {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    });
}

function register(target, name, tag, property) {
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: `file:///project/${name}.wcl.avt` };
    file.fileParsed = { classes: {} };
    file._componentClassName = name;
    file._compileResult = [{ classScript: `Demo.${name}`, tagName: tag }];
    const info = {
        fullName: `Demo.${name}`,
        class: { name, documentation: { definitions: [`${name} documentation`] }, extends: [], isAbstract: false },
        attributes: [], props: [{ name: property, local: true, type: { kind: 'type', value: 'string', genericValue: [], isArray: false } }],
        propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
    };
    target.customElements.register(file, info);
    target.htmlCustomData.register(file, info);
    target.emmetCustomData.register(file, info);
    target.webTypes.register(file, info);
}

function read(root) {
    const json = name => JSON.parse(readFileSync(join(root, name), 'utf8'));
    return {
        custom: json('custom-elements.json'),
        html: json('vscode.html-custom-data.json'),
        emmet: json(join('emmet', 'snippets.json')),
        web: json('web-types.json'),
    };
}

test('rebuilding two-component manifests after rename and removal writes one coherent component with current members', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-two-lifecycle-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const first = manifest();
        register(first, 'Card', 'demo-card', 'oldMember');
        register(first, 'Panel', 'demo-panel', 'panelMember');
        await first.write(root);
        let files = read(root);
        assert.deepEqual(files.custom.modules.map(module => module.declarations[0].tagName), ['demo-card', 'demo-panel']);
        assert.deepEqual(files.html.tags.map(tag => tag.name), ['demo-card', 'demo-panel']);
        assert.deepEqual(Object.keys(files.emmet.html.snippets), ['demo-card', 'demo-panel']);
        assert.deepEqual(files.web.contributions.html.elements.map(element => element.name), ['demo-card', 'demo-panel']);

        const rebuilt = manifest();
        register(rebuilt, 'RenamedCard', 'demo-renamed-card', 'currentMember');
        await rebuilt.write(root);
        files = read(root);
        assert.deepEqual(files.custom.modules.map(module => [module.path, module.declarations[0].tagName]), [
            ['__src/RenamedCard.wcl.js', 'demo-renamed-card'],
        ]);
        assert.deepEqual(files.custom.modules[0].declarations[0].members.map(member => member.name), ['currentMember']);
        assert.deepEqual(files.html.tags.map(tag => [tag.name, tag.description.includes('currentMember')]), [
            ['demo-renamed-card', true],
        ]);
        assert.deepEqual(Object.keys(files.emmet.html.snippets), ['demo-renamed-card']);
        assert.deepEqual(files.web.contributions.html.elements.map(element => [
            element.name, element.js.properties.map(property => property.name),
        ]), [['demo-renamed-card', ['currentMember']]]);
        for (const name of ['custom-elements.json', 'vscode.html-custom-data.json', join('emmet', 'snippets.json'), 'web-types.json']) {
            assert.doesNotMatch(readFileSync(join(root, name), 'utf8'), /demo-card|demo-panel|oldMember|panelMember/);
        }
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
