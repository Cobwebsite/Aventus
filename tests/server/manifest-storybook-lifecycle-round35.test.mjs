import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { Storie }, { SettingsManager }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'project/storybook/Stories.ts', 'settings/Settings.ts',
    'language-services/ts/component/File.ts',
]);

function component(name, tag) {
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: `file:///project/${name}.wcl.avt` };
    file.fileParsed = { classes: {} };
    file._componentClassName = name;
    file._compileResult = [{ classScript: `Demo.${name}`, tagName: tag }];
    return {
        file,
        info: {
            fullName: `Demo.${name}`,
            class: { name, documentation: { definitions: [`${name} docs`] }, extends: [], isAbstract: false },
            attributes: [], props: [], propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
        },
    };
}

function register(manifest, { file, info }) {
    manifest.customElements.register(file, info);
    manifest.htmlCustomData.register(file, info);
    manifest.emmetCustomData.register(file, info);
    manifest.webTypes.register(file, info);
}

test('renaming one component retains its previous tag in the three written manifest files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-lifecycle-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const build = {
            buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
            project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
            externalPackageInformation: { getByUri: () => undefined },
        };
        const manifest = new Manifest({}, build);
        const card = component('Card', 'demo-card');
        const panel = component('Panel', 'demo-panel');
        register(manifest, card);
        register(manifest, panel);
        await manifest.write(root);

        card.file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card-new' }];
        register(manifest, card);
        await manifest.write(root);

        const custom = JSON.parse(readFileSync(join(root, 'custom-elements.json'), 'utf8'));
        const html = JSON.parse(readFileSync(join(root, 'vscode.html-custom-data.json'), 'utf8'));
        const emmet = JSON.parse(readFileSync(join(root, 'emmet', 'snippets.json'), 'utf8'));
        assert.deepEqual(custom.modules.map(module => module.declarations[0].tagName),
            ['demo-card', 'demo-panel', 'demo-card-new']);
        assert.deepEqual(html.tags.map(tag => tag.name),
            ['demo-card', 'demo-panel', 'demo-card-new']);
        assert.deepEqual(Object.keys(emmet.html.snippets),
            ['demo-card', 'demo-panel', 'demo-card-new']);
        assert.equal(existsSync(join(root, 'web-types.json')), false);
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook rename writes new story and MDX files while old ones remain after clear', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-rename-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const stories = new Storie({}, { stories: { output: root, prefix: 'Library' } });
        const oldInfo = {
            name: 'Card', fullName: 'Demo.Card',
            build: { buildConfig: { stories: { prefix: 'Library' } } },
            storieContent: { kind: 'class', namespace: 'Demo' },
            documentation: { definitions: ['Old card docs'] },
        };
        await stories.writeStory(oldInfo);
        await stories.write({}, true);
        await stories.writeStory({ ...oldInfo,
            name: 'RenamedCard', fullName: 'Demo.RenamedCard',
            documentation: { definitions: ['New card docs'] },
        });

        const oldStory = join(root, 'auto', 'Demo', 'Card.stories.ts');
        const oldMdx = join(root, 'auto', 'Demo', 'Card_.mdx');
        const newStory = join(root, 'auto', 'Demo', 'RenamedCard.stories.ts');
        const newMdx = join(root, 'auto', 'Demo', 'RenamedCard_.mdx');
        for (const path of [oldStory, oldMdx, newStory, newMdx]) {
            assert.equal(existsSync(path), true, path);
        }
        assert.match(readFileSync(oldStory, 'utf8'), /Old card docs/);
        assert.match(readFileSync(newStory, 'utf8'), /New card docs/);
        assert.match(readFileSync(newStory, 'utf8'), /Library\/Demo\/RenamedCard/);
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
