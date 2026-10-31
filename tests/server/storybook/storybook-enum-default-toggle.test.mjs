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

test('parsed enum toggles its default story while refreshing members and documentation', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-enum-toggle-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/tones.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const render = async (version, option, documentation, members) => {
        const source = `namespace Palette {\n/** ${documentation} */\n@Storybook({${option}}) export enum Tone { ${members} }\n}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.enums.Tone?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const output = readFileSync(join(root, 'auto', 'Palette', 'Tone.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Palette', 'Tone_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Tone.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-enum-render/);
        return { output, mdx };
    };

    const first = await render(1, 'group:"Colors"', 'Original tones.', 'Red = "red", Blue = "blue"');
    assert.match(first.output, /DefaultStory: Story/);
    assert.match(first.output, /Original tones/);
    assert.match(first.output, /Red/);

    const second = await render(2, 'group:"Colors",noDefaultStory:true', 'Revised tones.', 'Green = "green"');
    assert.doesNotMatch(second.output, /DefaultStory: Story|Original tones|Red|Blue/);
    assert.match(second.output, /Revised tones/);
    assert.match(second.output, /Green/);

    const third = await render(3, 'group:"Colors",noDefaultStory:false', 'Final tones.', 'Gold = "gold"');
    assert.match(third.output, /DefaultStory: Story/);
    assert.match(third.output, /Final tones/);
    assert.match(third.output, /Gold/);
    assert.doesNotMatch(third.output, /Revised tones|Original tones|Green|Red|Blue/);
});
