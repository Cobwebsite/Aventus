import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [packageModule, serverModule, settingsModule] = await loadServerModules([
    'manifest/ManifestPackage.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);
const { ManifestPackage } = packageModule;
const { GenericServer } = serverModule;
const { SettingsManager } = settingsModule;

test('package manifest writes component snippets when forced and updates an existing file', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-manifest-'));
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const oldFiles = ManifestPackage.files;
    const oldDone = ManifestPackage.done;
    const uri = pathToFileURL(join(root, 'component.package.avt')).href;
    const output = join(root, '.aventus', 'emmet', 'snippets.json');
    GenericServer.instance = { workspaces: [pathToFileURL(root).href] };
    SettingsManager.instance = { settings: { useStats: false } };
    ManifestPackage.files = { [uri]: { file: { uri }, srcInfo: { available: [{ tagName: 'demo-card' }] } } };
    ManifestPackage.done = false;
    try {
        await ManifestPackage.write(false);
        assert.equal(existsSync(output), false);
        assert.equal(ManifestPackage.done, true);
        await ManifestPackage.write(true);
        const first = JSON.parse(readFileSync(output, 'utf8'));
        assert.equal(first.html.snippets['demo-card'], '<demo-card>${1}</demo-card>');
        ManifestPackage.files[uri].srcInfo.available = [{ tagName: 'demo-panel' }];
        await ManifestPackage.write(false);
        const second = JSON.parse(readFileSync(output, 'utf8'));
        assert.equal(second.html.snippets['demo-card'], undefined);
        assert.equal(second.html.snippets['demo-panel'], '<demo-panel>${1}</demo-panel>');
    } finally {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
        ManifestPackage.files = oldFiles;
        ManifestPackage.done = oldDone;
        rmSync(root, { recursive: true, force: true });
    }
});

test('package manifest registers each file once and refreshes after initialization', async () => {
    const oldFiles = ManifestPackage.files;
    const oldDone = ManifestPackage.done;
    const oldWrite = ManifestPackage.write;
    const calls = [];
    ManifestPackage.files = {};
    ManifestPackage.done = true;
    ManifestPackage.write = async () => calls.push('write');
    try {
        const first = { file: { uri: 'file:///first.package.avt' } };
        await ManifestPackage.register(first);
        await ManifestPackage.register({ file: { uri: first.file.uri } });
        assert.equal(ManifestPackage.files[first.file.uri], first);
        assert.deepEqual(calls, ['write']);
    } finally {
        ManifestPackage.files = oldFiles;
        ManifestPackage.done = oldDone;
        ManifestPackage.write = oldWrite;
    }
});
