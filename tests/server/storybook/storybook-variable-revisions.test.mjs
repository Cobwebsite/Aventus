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

test('parsed Storybook variable renews type and default story across revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-variable-revisions-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/constants.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const storyPath = join(root, 'auto', 'Constants', 'threshold.stories.ts');
    const mdxPath = join(root, 'auto', 'Constants', 'threshold_.mdx');
    const render = async (version, options, documentation, type, value) => {
        const source = `namespace Constants { /** ${documentation} */ @Storybook({${options}}) export const threshold: ${type} = ${value}; }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.variables.threshold?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const story = readFileSync(storyPath, 'utf8');
        const mdx = readFileSync(mdxPath, 'utf8');
        assert.deepEqual(ts.createSourceFile(storyPath, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-variable-render/);
        return { story, mdx };
    };

    const first = await render(1, 'group:"Limits"', 'Initial threshold.', 'number', '17');
    assert.match(first.story, /"name": "number"/);
    assert.match(first.story, /DefaultStory: Story/);
    assert.match(first.story, /Initial threshold\./);
    assert.match(first.story, /"value": "17"/);
    assert.match(first.mdx, /JSON\.stringify\(Meta\.aventus\)/);

    const second = await render(2, 'group:"Limits",noDefaultStory:true', 'Revised threshold.', 'string', '"high"');
    assert.match(second.story, /"name": "string"/);
    assert.doesNotMatch(second.story, /"name": "number"|DefaultStory: Story/);
    assert.match(second.story, /Revised threshold\./);
    assert.match(second.story, /"value": "\\"high\\""/);

    const third = await render(3, 'group:"Limits",noDefaultStory:false', 'Final threshold.', 'boolean', 'true');
    assert.match(third.story, /"name": "boolean"/);
    assert.match(third.story, /DefaultStory: Story/);
    assert.doesNotMatch(third.story, /"name": "number"|"name": "string"/);
    assert.match(third.story, /Final threshold\./);
    assert.match(third.story, /"value": "true"/);
});
