import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Manifest }, { SettingsManager }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'settings/Settings.ts', 'language-services/ts/component/File.ts',
]);

function createManifest() {
    return new Manifest({}, {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    });
}

function register(manifest, name, member) {
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: `file:///project/${name}.wcl.avt` };
    file.fileParsed = { classes: {} };
    file._componentClassName = name;
    file._compileResult = [{ classScript: `Demo.${name}`, tagName: `demo-${name.toLowerCase()}` }];
    const info = {
        fullName: `Demo.${name}`,
        class: { name, documentation: { definitions: [`${name} documentation`] }, extends: [], isAbstract: false },
        attributes: [], props: [{ name: member, local: true, type: { kind: 'type', value: 'string', genericValue: [], isArray: false } }],
        propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
    };
    manifest.customElements.register(file, info);
    manifest.htmlCustomData.register(file, info);
    manifest.emmetCustomData.register(file, info);
    manifest.webTypes.register(file, info);
}

test('rebuilding after removing one component preserves the survivor in all four serialized manifests', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-removal-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const first = createManifest();
        register(first, 'Card', 'cardMember');
        register(first, 'Panel', 'panelMember');
        await first.write(root);

        const rebuilt = createManifest();
        register(rebuilt, 'Panel', 'panelMember');
        await rebuilt.write(root);

        const custom = JSON.parse(readFileSync(join(root, 'custom-elements.json'), 'utf8'));
        const html = JSON.parse(readFileSync(join(root, 'vscode.html-custom-data.json'), 'utf8'));
        const emmet = JSON.parse(readFileSync(join(root, 'emmet', 'snippets.json'), 'utf8'));
        const web = JSON.parse(readFileSync(join(root, 'web-types.json'), 'utf8'));
        assert.deepEqual(custom.modules.map(module => module.declarations[0].tagName), ['demo-panel']);
        assert.deepEqual(custom.modules[0].declarations[0].members.map(member => member.name), ['panelMember']);
        assert.deepEqual(html.tags.map(tag => tag.name), ['demo-panel']);
        assert.deepEqual(Object.keys(emmet.html.snippets), ['demo-panel']);
        assert.deepEqual(web.contributions.html.elements.map(element => element.name), ['demo-panel']);
        for (const name of ['custom-elements.json', 'vscode.html-custom-data.json', join('emmet', 'snippets.json'), 'web-types.json']) {
            assert.doesNotMatch(readFileSync(join(root, name), 'utf8'), /demo-card|cardMember/);
        }
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
