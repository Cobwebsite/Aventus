import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed alias toggles its default Storybook story while renewing type and documentation', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-alias-default-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/choice.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const storyPath = join(root, 'auto', 'Choices', 'Choice.stories.ts');
    const mdxPath = join(root, 'auto', 'Choices', 'Choice_.mdx');
    const render = async (version, options, documentation, type) => {
        const source = `namespace Choices { /** ${documentation} */ @Storybook({${options}}) export type Choice = ${type}; }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.aliases.Choice?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const story = readFileSync(storyPath, 'utf8');
        const mdx = readFileSync(mdxPath, 'utf8');
        assert.deepEqual(ts.createSourceFile(storyPath, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-type-render/);
        return { story, mdx };
    };

    const first = await render(1, 'group:"Options"', 'First choice.', '"small" | "large"');
    assert.match(first.story, /DefaultStory: Story/);
    assert.match(first.story, /First choice/);
    assert.match(first.story, /small|large/);

    const second = await render(2, 'group:"Options",noDefaultStory:true', 'Second choice.', '"medium"');
    assert.doesNotMatch(second.story, /DefaultStory: Story/);
    assert.match(second.story, /Second choice/);
    assert.doesNotMatch(second.story + second.mdx, /First choice|small|large/);

    const third = await render(3, 'group:"Options",noDefaultStory:false', 'Final choice.', '"tiny" | "huge"');
    assert.match(third.story, /DefaultStory: Story/);
    assert.match(third.story, /Final choice/);
    assert.match(third.story, /tiny|huge/);
    assert.doesNotMatch(third.story + third.mdx, /First choice|Second choice|small|large|medium/);
});
