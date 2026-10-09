import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [storiesModule, serverModule, settingsModule] = await loadServerModules([
    'project/storybook/Stories.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);
const { Storie } = storiesModule;
const { GenericServer } = serverModule;
const { SettingsManager } = settingsModule;

test('Storybook copies nested text and binary assets while preserving an existing main.ts', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-nested-'));
    const extension = join(root, 'extension');
    const template = join(extension, 'templates', 'storybook', 'basic');
    const output = join(root, 'site');
    const workspace = join(root, 'workspace');
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    try {
        mkdirSync(join(template, 'assets'), { recursive: true });
        mkdirSync(join(workspace, '.storybook'), { recursive: true });
        writeFileSync(join(template, 'package.json'), JSON.stringify({ name: '${{name}}' }));
        writeFileSync(join(template, 'assets', 'about.txt'), '${{displayName}} | ${{version}}');
        const png = Buffer.from([0, 255, 16, 32, 64]);
        writeFileSync(join(template, 'assets', 'logo.png'), png);
        writeFileSync(join(workspace, '.storybook', 'main.ts'), 'custom main');

        GenericServer.instance = { _extensionPath: extension };
        SettingsManager.instance = { settings: { useStats: false } };
        const build = {
            project: { getConfigFile: () => ({ folderPath: root }) },
            externalPackageInformation: { filesUri: [], getByUri: () => undefined },
        };
        const story = new Storie(build, {
            module: 'Demo', name: 'Main', fullname: 'Demo@Main', version: '3.2.1',
            stories: { output, workspace: 'workspace' },
        });
        await story.readEnvStoryBook();

        assert.equal(readFileSync(join(output, 'assets', 'about.txt'), 'utf8'), 'Demo Main_storybook | 3.2.1');
        assert.deepEqual(readFileSync(join(output, 'assets', 'logo.png')), png);
        assert.equal(readFileSync(join(workspace, '.storybook', 'main.ts'), 'utf8'), 'custom main');
        assert.equal(existsSync(join(workspace, '.storybook', 'preview.ts')), true);
        assert.equal(existsSync(join(output, '.storybook')), false);
    } finally {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
