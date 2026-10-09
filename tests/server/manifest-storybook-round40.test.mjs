import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { Storie }, { SettingsManager }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'project/storybook/Stories.ts', 'settings/Settings.ts',
    'language-services/ts/component/File.ts',
]);

test('four serialized manifest formats refer to the same component after a direct Web Types write', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-four-formats-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const build = {
            buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
            project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
            externalPackageInformation: { getByUri: () => undefined },
        };
        const manifest = new Manifest({}, build);
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._file = { uri: 'file:///project/Card.wcl.avt' };
        file.fileParsed = { classes: {} };
        file._componentClassName = 'Card';
        file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
        const info = {
            fullName: 'Demo.Card',
            class: { name: 'Card', documentation: { definitions: ['A documented card'] }, isAbstract: false, extends: [] },
            attributes: [], props: [], propsStatic: [], methods: [], methodsStatic: [], cssProperties: [], slots: {},
        };
        manifest.customElements.register(file, info);
        manifest.htmlCustomData.register(file, info);
        manifest.emmetCustomData.register(file, info);
        manifest.webTypes.register(file, info);
        await manifest.write(root);
        await manifest.webTypes.write(root);

        const read = (name) => JSON.parse(readFileSync(join(root, name), 'utf8'));
        const custom = read('custom-elements.json');
        const html = read('vscode.html-custom-data.json');
        const emmet = read(join('emmet', 'snippets.json'));
        const web = read('web-types.json');
        assert.equal(custom.schemaVersion, '1.0.0');
        assert.equal(html.version, 1.1);
        assert.match(web.$schema, /web-types\.json$/);
        assert.equal(custom.modules[0].declarations[0].tagName, 'demo-card');
        assert.equal(custom.modules[0].exports[0].declaration.name, 'Card');
        assert.equal(html.tags[0].name, 'demo-card');
        assert.equal(web.contributions.html.elements[0].name, 'demo-card');
        assert.equal(emmet.html.snippets['demo-card'], '<demo-card>${1}</demo-card>');
        assert.match(web.contributions.html.elements[0].description, /A documented card/);
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook rewrites story and MDX for updated documentation on the same symbol', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-doc-update-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const story = new Storie({}, { stories: { output: root, prefix: 'Library' } });
        const base = {
            name: 'Card', fullName: 'Demo.Card',
            build: { buildConfig: { stories: { prefix: 'Library' } } },
            storieContent: { kind: 'class', namespace: 'Demo' },
        };
        await story.writeStory({ ...base, documentation: { definitions: ['First description'] } });
        const storyPath = join(root, 'auto', 'Demo', 'Card.stories.ts');
        const mdxPath = join(root, 'auto', 'Demo', 'Card_.mdx');
        const firstMdx = readFileSync(mdxPath, 'utf8');
        assert.match(readFileSync(storyPath, 'utf8'), /First description/);

        await story.writeStory({ ...base, documentation: { definitions: ['Updated description'] } });
        const rewritten = readFileSync(storyPath, 'utf8');
        assert.match(rewritten, /Updated description/);
        assert.doesNotMatch(rewritten, /First description/);
        assert.equal(readFileSync(mdxPath, 'utf8'), firstMdx);
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
