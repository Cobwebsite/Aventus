import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Storie }, { SettingsManager }] = await loadServerModules([
    'project/storybook/Stories.ts', 'settings/Settings.ts',
]);

test('Storybook write(clear=true) currently leaves generated stories for removed exports', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-clear-'));
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const stories = new Storie({}, { stories: { output: root, prefix: 'Library' } });
        const info = {
            name: 'Card', fullName: 'Demo.Card',
            build: { buildConfig: { stories: { prefix: 'Library' } } },
            storieContent: { kind: 'class', namespace: 'Demo' },
            documentation: { definitions: ['Card docs'] },
        };
        await stories.writeStory(info);
        const storyPath = join(root, 'auto', 'Demo', 'Card.stories.ts');
        const mdxPath = join(root, 'auto', 'Demo', 'Card_.mdx');
        assert.match(readFileSync(storyPath, 'utf8'), /Card docs/);
        await stories.write({}, true);
        assert.equal(existsSync(storyPath), true);
        assert.equal(existsSync(mdxPath), true);
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
