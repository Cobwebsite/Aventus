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

test('parsed Storybook enum regenerates member values and documentation after an edit', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-enum-values-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/values.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const generate = async (version, members, documentation) => {
        const source = `/** ${documentation} */ @Storybook({export:'public'}) export enum Tone { ${members} }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.enums.Tone?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const output = readFileSync(join(root, 'auto', 'Tone.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Tone_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Tone.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-enum-render/);
        return { output, mdx };
    };

    const first = await generate(1, 'Light = "light", Dark = "dark"', 'Original tone documentation.');
    assert.match(first.output, /Original tone documentation/);
    assert.match(first.output, /Light/);
    assert.match(first.output, /dark/);

    const second = await generate(2, 'Light = "bright", Dusk = "dusk"', 'Updated tone documentation.');
    assert.match(second.output, /Updated tone documentation/);
    assert.match(second.output, /bright/);
    assert.match(second.output, /Dusk/);
    assert.doesNotMatch(second.output, /Original tone documentation|"dark"|Dark/);
});
