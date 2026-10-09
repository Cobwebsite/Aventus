import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Storie }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'project/storybook/Stories.ts', 'language-services/ts/component/File.ts',
]);

function componentFixture(root, decorator) {
    const info = {
        name: 'Card', fullName: 'Demo.Card', isAbstract: false,
        build: { buildConfig: { stories: { prefix: 'Library' } } },
        storieContent: { kind: 'component', namespace: 'Demo' },
        storieDecorator: decorator,
        storieInject: { './helpers': ['helper'] },
        documentation: { definitions: ['Card docs'] },
    };
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._componentClassName = 'Card';
    file.fileParsed = { classes: { Card: info } };
    file.storyBookInfo = { argsTypes: { active: { control: 'boolean' } }, args: { active: 'true' } };
    const story = new Storie({}, { stories: { output: root, prefix: 'Library' } });
    const output = new Map();
    story.writeFile = async (path, content) => output.set(path, content);
    return { info, file, story, output };
}

test('Storybook component story includes live controls, args and injected imports', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-component-'));
    try {
        const { info, file, story, output } = componentFixture(root);
        await story.writeStory(info, file);
        const source = [...output.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        const mdx = [...output.entries()].find(([path]) => path.endsWith('_.mdx'))?.[1];
        assert.match(source, /render: \(args\) => render\(args, Card\)/);
        assert.match(source, /argTypes:/);
        assert.match(source, /"active":true/);
        assert.match(source, /import \{ helper \} from '\.\/helpers'/);
        assert.match(source, /export const DefaultStory/);
        assert.match(mdx, /<Canvas \/>/);
        assert.match(mdx, /<Controls \/>/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook noLive suppresses component controls but retains metadata', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-no-live-'));
    try {
        const { info, file, story, output } = componentFixture(root, { noLive: true });
        await story.writeStory(info, file);
        const source = [...output.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        const mdx = [...output.entries()].find(([path]) => path.endsWith('_.mdx'))?.[1];
        assert.doesNotMatch(source, /render: \(args\) => render\(args, Card\)/);
        assert.match(source, /argTypes:/);
        assert.doesNotMatch(mdx, /<Canvas \/>/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
