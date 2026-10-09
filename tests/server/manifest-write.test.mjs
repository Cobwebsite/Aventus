import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [manifestModule, settingsModule, componentModule] = await loadServerModules([
    'manifest/Manifest.ts', 'settings/Settings.ts', 'language-services/ts/component/File.ts',
]);
const { Manifest } = manifestModule;
const { SettingsManager } = settingsModule;
const { AventusWebComponentLogicalFile } = componentModule;

test('manifest write creates parseable Custom Elements, HTML and Emmet files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-write-'));
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const build = {
            buildConfig: { fullname: 'Demo@Main' },
            project: { getConfigFile: () => ({ uri: 'file:///aventus.conf.avt' }) },
        };
        const manifest = new Manifest({}, build);
        await manifest.write(root);
        const files = [
            'custom-elements.json', 'vscode.html-custom-data.json', join('emmet', 'snippets.json'),
        ];
        for (const name of files) {
            assert.equal(existsSync(join(root, name)), true, name);
            assert.equal(typeof JSON.parse(readFileSync(join(root, name), 'utf8')), 'object');
        }
    } finally {
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('registered component is written to Custom Elements, HTML and Emmet outputs', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-component-'));
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const build = {
            buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
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
            class: { name: 'Card', documentation: { definitions: ['Card component'] }, isAbstract: false, extends: [] },
            attributes: [], props: [], propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
        };
        manifest.customElements.register(file, info);
        manifest.htmlCustomData.register(file, info);
        manifest.emmetCustomData.register(file, info);
        await manifest.write(root);
        const custom = JSON.parse(readFileSync(join(root, 'custom-elements.json'), 'utf8'));
        const html = JSON.parse(readFileSync(join(root, 'vscode.html-custom-data.json'), 'utf8'));
        const emmet = JSON.parse(readFileSync(join(root, 'emmet', 'snippets.json'), 'utf8'));
        assert.equal(custom.modules[0].declarations[0].tagName, 'demo-card');
        assert.equal(html.tags[0].name, 'demo-card');
        assert.equal(emmet.html.snippets['demo-card'], '<demo-card>${1}</demo-card>');
    } finally {
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
