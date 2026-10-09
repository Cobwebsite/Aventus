import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Storie }] = await loadServerModules(['project/storybook/Stories.ts']);

test('Storybook skips a declaration with no story content without creating folders', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-story-guard-'));
    try {
        const story = new Storie({}, { stories: { output: root } });
        let writes = 0;
        story.writeFile = async () => { writes++; };
        await story.writeStory({ name: 'Plain', fullName: 'Demo.Plain' });
        assert.equal(writes, 0);
        assert.equal((await import('node:fs')).readdirSync(root).length, 0);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook skips a declaration when story output is disabled', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-story-disabled-'));
    try {
        const story = new Storie({}, {});
        let writes = 0;
        story.writeFile = async () => { writes++; };
        await story.writeStory({ name: 'Card', fullName: 'Demo.Card', storieContent: { kind: 'component' } });
        assert.equal(writes, 0);
        assert.equal((await import('node:fs')).readdirSync(root).length, 0);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook emits MDX and a story for a documented non-component declaration', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-story-alias-'));
    try {
        const story = new Storie({}, { stories: { output: root } });
        const outputs = new Map();
        story.writeFile = async (path, content) => outputs.set(path, content);
        await story.writeStory({
            name: 'Choice', fullName: 'Demo.Choice',
            build: { buildConfig: { stories: { prefix: 'API' } } },
            storieContent: { kind: 'alias', namespace: 'Demo' },
            documentation: { definitions: ['One of the available choices.'] },
        });
        assert.equal(outputs.size, 2);
        const mdx = [...outputs.entries()].find(([path]) => path.endsWith('_.mdx'))?.[1];
        const source = [...outputs.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        assert.match(mdx, /<av-story-alias-render/);
        assert.match(source, /API\/Demo\/Choice/);
        assert.match(source, /One of the available choices/);
        assert.doesNotMatch(source, /argTypes:|args:/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
