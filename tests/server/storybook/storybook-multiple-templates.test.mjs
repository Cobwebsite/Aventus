import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Storie }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'project/storybook/Stories.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('Storybook setup offers folder names and copies the selected template', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-two-templates-'));
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const previousSelect = GenericServer.Select;
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
        let calls = 0;
        GenericServer.Select = async (items, options) => {
            calls++;
            assert.deepEqual(items, [{ label: 'alternate' }, { label: 'basic' }]);
            assert.equal(options.title, 'Select a Storybook template');
            return calls === 1 ? null : { label: 'alternate' };
        };
        const build = {
            project: { getConfigFile: () => ({ folderPath: root }) },
            externalPackageInformation: { filesUri: [], getByUri: () => undefined },
        };
        const story = new Storie(build, {
            module: 'Demo', name: 'Main', fullname: 'Demo@Main', version: '1.0.0',
            stories: { output },
        });

        await story.readEnvStoryBook();
        assert.equal(existsSync(join(output, 'package.json')), false);
        await story.readEnvStoryBook();
        assert.equal(calls, 2);
        assert.equal(JSON.parse(readFileSync(join(output, 'package.json'), 'utf8')).name, 'alternate');
        assert.equal(existsSync(join(output, '.storybook', 'main.ts')), true);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        GenericServer.Select = previousSelect;
        rmSync(root, { recursive: true, force: true });
    }
});
