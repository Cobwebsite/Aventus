import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Storie }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'project/storybook/Stories.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);
const extension = fileURLToPath(new URL('../../../', import.meta.url));
const template = join(extension, 'templates', 'storybook', 'Default');

function filesUnder(root) {
    return readdirSync(root, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => join(entry.parentPath, entry.name))
        .sort();
}

test('real Storybook template assets survive removal of a generated story', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-real-template-'));
    const output = join(root, 'site');
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    GenericServer.instance = { _extensionPath: extension };
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const build = {
            project: { getConfigFile: () => ({ folderPath: root }) },
            externalPackageInformation: { filesUri: [], getByUri: () => undefined },
        };
        const config = {
            module: 'Demo', name: 'Main', fullname: 'Demo@Main', version: '1.2.3',
            stories: { output, prefix: 'Library' },
        };
        const stories = new Storie(build, config);
        await stories.check();

        const templateFiles = filesUnder(template);
        assert.ok(templateFiles.length > 0);
        for (const source of templateFiles) {
            const copied = join(output, relative(template, source));
            assert.equal(existsSync(copied), true, copied);
            if (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(source)) {
                assert.deepEqual(readFileSync(copied), readFileSync(source));
            }
        }
        const packageJson = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
        assert.equal(packageJson.name, '@demo/main_storybook');
        assert.equal(packageJson.version, '1.2.3');

        const info = name => ({
            name, fullName: `Demo.${name}`,
            build: { buildConfig: config },
            storieContent: { kind: 'class', namespace: 'Demo' },
            documentation: { definitions: [`${name} docs`] },
        });
        const card = info('Card');
        const panel = info('Panel');
        const file = parsed => ({ fileParsed: {
            classes: Object.fromEntries(parsed.map(value => [value.name, value])),
            aliases: {}, enums: {}, functions: {}, variables: {},
        } });
        await stories.write({ card: file([card, panel]) }, true);
        assert.equal(existsSync(join(output, 'auto', 'Demo', 'Card.stories.ts')), true);
        assert.equal(existsSync(join(output, 'auto', 'Demo', 'Panel.stories.ts')), true);

        await stories.write({ card: file([panel]) }, true);
        assert.equal(existsSync(join(output, 'auto', 'Demo', 'Card.stories.ts')), false);
        assert.equal(existsSync(join(output, 'auto', 'Demo', 'Card_.mdx')), false);
        assert.match(readFileSync(join(output, 'auto', 'Demo', 'Panel.stories.ts'), 'utf8'), /Panel docs/);
        for (const source of templateFiles) {
            const copied = join(output, relative(template, source));
            assert.equal(existsSync(copied), true, copied);
        }
        assert.equal(existsSync(join(output, '.storybook', 'main.ts')), true);
        assert.equal(existsSync(join(output, '.storybook', 'preview.ts')), true);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
