import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Storie } = await loadServerModule('project/storybook/Stories.ts');

function info(decorator, stories = { prefix: 'Library' }) {
    return { fullName: 'Demo.Card', name: 'Card', storieDecorator: decorator, build: { buildConfig: { stories } } };
}

test('Storybook title uses class namespace and configured prefix', () => {
    assert.equal(Storie.getFullname(info(undefined)), 'Library/Demo/Card');
    assert.equal(Storie.getFullname(info(undefined, { prefix: 'Library/' })), 'Library/Demo/Card');
    assert.equal(Storie.getFullname(info(undefined, { prefix: '' })), 'Demo/Card');
});

test('Storybook decorator can set group and override configured prefix', () => {
    assert.equal(Storie.getFullname(info({ group: 'Inputs', prefix: 'UI' })), 'UI/Inputs/Card');
    assert.equal(Storie.getFullname(info({ group: '', prefix: '' })), 'Card');
});

test('Storybook placeholder replacement updates all occurrences', () => {
    const story = Object.create(Storie.prototype);
    assert.equal(story.replaceVariable('$name$ / $name$', 'name', 'Card'), 'Card / Card');
});

test('Storybook emits MDX and story content, honoring noDefaultStory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'aventus-storybook-test-'));
    try {
        const story = new Storie({}, { stories: { output: root, prefix: 'Library' } });
        const written = new Map();
        story.writeFile = async (path, content) => { written.set(path, content); };
        await story.writeStory({
            name: 'Card', fullName: 'Demo.Card',
            build: { buildConfig: { stories: { prefix: 'Library' } } },
            storieContent: { kind: 'class', namespace: 'Demo' },
            storieDecorator: { noDefaultStory: true },
            documentation: { definitions: ['A reusable card.'] },
        });
        assert.equal(written.size, 2);
        const mdx = [...written.entries()].find(([path]) => path.endsWith('_.mdx'))?.[1];
        const source = [...written.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        assert.match(mdx, /Card/);
        assert.match(source, /Library\/Demo\/Card/);
        assert.match(source, /A reusable card/);
        assert.doesNotMatch(source, /export const DefaultStory/);
    } finally {
        const absolute = resolve(root);
        assert.ok(absolute.startsWith(resolve(tmpdir()) + sep));
        await rm(absolute, { recursive: true, force: true });
    }
});
