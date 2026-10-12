import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Storie }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'project/storybook/Stories.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('Storybook setup rejects two available environment templates before writing output', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-two-templates-'));
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const output = join(root, 'site');
    try {
        const templates = join(root, 'extension', 'templates', 'storybook');
        for (const name of ['basic', 'alternate']) {
            const folder = join(templates, name);
            mkdirSync(folder, { recursive: true });
            writeFileSync(join(folder, 'package.json'), JSON.stringify({ name }));
        }
        GenericServer.instance = { _extensionPath: join(root, 'extension') };
        SettingsManager.instance = { settings: { useStats: false } };
        const build = {
            project: { getConfigFile: () => ({ folderPath: root }) },
            externalPackageInformation: { filesUri: [], getByUri: () => undefined },
        };
        const story = new Storie(build, {
            module: 'Demo', name: 'Main', fullname: 'Demo@Main', version: '1.0.0',
            stories: { output },
        });

        await assert.rejects(story.readEnvStoryBook(), reason => reason === 'TODO code multiple template');
        assert.equal(existsSync(join(output, 'package.json')), false);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
