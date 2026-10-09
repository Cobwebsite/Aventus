import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Storie }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'project/storybook/Stories.ts', 'language-services/ts/component/File.ts',
]);

test('Storybook combines custom group and prefix with noDefaultStory for a component', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-combined-'));
    try {
        const info = {
            name: 'Card', fullName: 'Demo.Card', isAbstract: false,
            build: { buildConfig: { stories: { prefix: 'Library' } } },
            storieContent: { kind: 'component', namespace: 'Demo', tagName: 'demo-card' },
            storieDecorator: { group: 'Inputs', prefix: 'Components/', noDefaultStory: true },
            storieInject: { './helpers': ['helper'] },
            documentation: { definitions: ['Documented card'] },
        };
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._componentClassName = 'Card';
        file.fileParsed = { classes: { Card: info } };
        file.storyBookInfo = {
            argsTypes: { active: { control: 'boolean' } },
            args: { active: 'true' },
        };
        const story = new Storie({}, { stories: { output: root, prefix: 'Library' } });
        const written = new Map();
        story.writeFile = async (path, content) => written.set(path, content);

        await story.writeStory(info, file);

        const source = [...written.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        const mdx = [...written.entries()].find(([path]) => path.endsWith('_.mdx'))?.[1];
        assert.equal(written.size, 2);
        assert.match(source, /Components\/Inputs\/Card/);
        assert.doesNotMatch(source, /Library\/Demo\/Card/);
        assert.doesNotMatch(source, /export const DefaultStory/);
        assert.doesNotMatch(source, /render: \(args\) => render\(args, Card\)/);
        assert.match(source, /"active":true/);
        assert.doesNotMatch(source, /import \{ helper \} from '\.\/helpers'/);
        assert.match(source, /Documented card/);
        assert.doesNotMatch(mdx, /<Canvas \/>/);
        assert.match(mdx, /av-story-component-render/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
