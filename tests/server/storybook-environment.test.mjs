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

test('Storybook environment copies a template, replaces variables and adds external packages', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-env-'));
    const extension = join(root, 'extension');
    const template = join(extension, 'templates', 'storybook', 'basic');
    const output = join(root, 'site');
    mkdirSync(template, { recursive: true });
    mkdirSync(join(template, '.git'));
    writeFileSync(join(template, 'package.json'), JSON.stringify({
        name: '${{name}}', displayName: '${{displayName}}', version: '${{version}}',
        devDependencies: { zed: '^1.0.0' },
    }));
    writeFileSync(join(template, 'README.md'), '${{description}}');
    writeFileSync(join(template, '.git', 'config'), 'internal');
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    GenericServer.instance = { _extensionPath: extension };
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const build = {
            project: { getConfigFile: () => ({ folderPath: root }) },
            externalPackageInformation: {
                filesUri: ['dep', 'self'],
                getByUri: uri => uri === 'dep'
                    ? { name: 'Other', npmUri: '@other/pkg', versionTxt: '2.1.0' }
                    : { name: 'Demo@Main', npmUri: '@demo/main', versionTxt: '1.0.0' },
            },
        };
        const config = {
            module: 'Demo', name: 'Main', fullname: 'Demo@Main', version: '1.2.3',
            stories: { output },
        };
        const story = new Storie(build, config);
        await story.readEnvStoryBook();
        const pkg = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
        assert.equal(pkg.name, '@demo/main_storybook');
        assert.equal(pkg.displayName, 'Demo Main_storybook');
        assert.equal(pkg.version, '1.2.3');
        assert.equal(pkg.devDependencies['@other/pkg'], '^2.1.0');
        assert.equal(pkg.devDependencies['@demo/main'], undefined);
        assert.equal(readFileSync(join(output, 'README.md'), 'utf8'), 'Aventus storybook for @Demo/Main');
        assert.equal(existsSync(join(output, '.git')), false);
        assert.equal(existsSync(join(output, '.storybook', 'main.ts')), true);
        assert.equal(existsSync(join(output, '.storybook', 'preview.ts')), true);
        await story.readEnvStoryBook();
        assert.equal(readFileSync(join(output, 'README.md'), 'utf8'), 'Aventus storybook for @Demo/Main');
    } finally {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook writes and updates story and MDX files for an exported class', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-output-'));
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const story = new Storie({}, { stories: { output: root, prefix: 'Library' } });
        const info = {
            name: 'Card', fullName: 'Demo.Card',
            build: { buildConfig: { stories: { prefix: 'Library' } } },
            storieContent: { kind: 'class', namespace: 'Demo' },
            storieDecorator: { noDefaultStory: true },
            documentation: { definitions: ['First description'] },
        };
        await story.writeStory(info);
        const storyPath = join(root, 'auto', 'Demo', 'Card.stories.ts');
        const mdxPath = join(root, 'auto', 'Demo', 'Card_.mdx');
        assert.equal(existsSync(storyPath), true);
        assert.equal(existsSync(mdxPath), true);
        assert.match(readFileSync(storyPath, 'utf8'), /First description/);
        assert.doesNotMatch(readFileSync(storyPath, 'utf8'), /export const DefaultStory/);
        info.documentation.definitions = ['Updated description'];
        await story.writeStory(info);
        assert.match(readFileSync(storyPath, 'utf8'), /Updated description/);
        assert.doesNotMatch(readFileSync(storyPath, 'utf8'), /First description/);
    } finally {
        SettingsManager.instance = oldSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
