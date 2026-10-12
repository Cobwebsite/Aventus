import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Storie }, { AventusWebComponentLogicalFile }, { SettingsManager }] = await loadServerModules([
    'project/storybook/Stories.ts', 'language-services/ts/component/File.ts', 'settings/Settings.ts',
]);

test('Storybook rewrites component controls and removes stories for a removed component on a cleared build', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-controls-cycle-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const config = { stories: { output: root, prefix: 'Library' } };
        const stories = new Storie({}, config);
        const info = {
            name: 'Card', fullName: 'Demo.Card', isAbstract: false,
            build: { buildConfig: config },
            storieContent: { kind: 'component', namespace: 'Demo' },
            documentation: { definitions: ['Initial card'] },
            storieInject: {},
        };
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._componentClassName = 'Card';
        file.fileParsed = { classes: { Card: info }, aliases: {}, enums: {}, functions: {}, variables: {} };
        file.storyBookInfo = { argsTypes: { active: { control: 'boolean' } }, args: { active: 'true' } };
        await stories.write({ component: file }, true);

        const storyPath = join(root, 'auto', 'Demo', 'Card.stories.ts');
        const mdxPath = join(root, 'auto', 'Demo', 'Card_.mdx');
        const first = readFileSync(storyPath, 'utf8');
        assert.match(first, /Initial card/);
        assert.match(first, /"active":true/);
        assert.match(first, /"control": "boolean"/);
        assert.match(readFileSync(mdxPath, 'utf8'), /<Controls \/>/);

        info.documentation = { definitions: ['Updated card'] };
        info.storieDecorator = { noLive: true, noDefaultStory: true };
        file.storyBookInfo = { argsTypes: { size: { control: 'number' } }, args: { size: '3' } };
        await stories.write({ component: file }, true);
        const updated = readFileSync(storyPath, 'utf8');
        assert.match(updated, /Updated card/);
        assert.match(updated, /"size":3/);
        assert.match(updated, /"control": "number"/);
        assert.doesNotMatch(updated, /Initial card|"active"|DefaultStory|render: \(args\) => render\(args, Card\)/);
        assert.doesNotMatch(readFileSync(mdxPath, 'utf8'), /<Controls \/>/);

        writeFileSync(join(root, 'manual.stories.ts'), 'manual');
        file.fileParsed.classes = {};
        await stories.write({ component: file }, true);
        assert.equal(existsSync(storyPath), false);
        assert.equal(existsSync(mdxPath), false);
        assert.equal(readFileSync(join(root, 'manual.stories.ts'), 'utf8'), 'manual');
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
