import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed function toggles its default Storybook story across three source revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-function-default-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/actions.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const render = async (version, options, documentation) => {
        const source = `namespace Actions {\n/** ${documentation} */\n@Storybook(${options}) export function run(value: string): void {}\n}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.functions.run?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const output = readFileSync(join(root, 'auto', 'Actions', 'run.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Actions', 'run_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('run.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-function-render/);
        return { output, mdx };
    };

    const first = await render(1, '{group:"Commands"}', 'First run.');
    assert.match(first.output, /export const DefaultStory: Story = \{\}/);
    assert.match(first.output, /First run\./);

    const second = await render(2, '{group:"Commands",noDefaultStory:true}', 'Hidden default.');
    assert.doesNotMatch(second.output, /export const DefaultStory/);
    assert.match(second.output, /Hidden default\./);
    assert.doesNotMatch(second.output, /First run\./);
    assert.doesNotMatch(second.mdx, /<Canvas \/>/);

    const third = await render(3, '{group:"Commands",noDefaultStory:false}', 'Restored default.');
    assert.match(third.output, /export const DefaultStory: Story = \{\}/);
    assert.match(third.output, /Restored default\./);
    assert.doesNotMatch(third.output, /Hidden default\.|First run\./);
});
