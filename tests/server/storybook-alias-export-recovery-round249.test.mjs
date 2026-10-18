import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed alias Storybook export removal and restoration refreshes TS and MDX pair', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-alias-export-'));
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
    const render = async (version, decorator, definition) => {
        const source = `namespace Choices { ${decorator} export type Choice = ${definition}; }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.aliases.Choice);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        return parsed.aliases.Choice;
    };

    const first = await render(1, '@Storybook({group:"Initial"})', '"small" | "large"');
    assert.ok(first.storieContent);
    assert.equal(existsSync(storyPath), true);
    assert.equal(existsSync(mdxPath), true);
    assert.match(readFileSync(storyPath, 'utf8'), /Initial\/Choice|small|large/);

    const second = await render(2, '@Storybook({export:"none"})', '"medium"');
    assert.equal(second.storieContent, undefined);
    assert.equal(existsSync(storyPath), false);
    assert.equal(existsSync(mdxPath), false);

    const third = await render(3, '@Storybook({group:"Restored"})', '"tiny" | "huge"');
    assert.ok(third.storieContent);
    assert.equal(existsSync(storyPath), true);
    assert.equal(existsSync(mdxPath), true);
    const story = readFileSync(storyPath, 'utf8');
    const mdx = readFileSync(mdxPath, 'utf8');
    assert.deepEqual(ts.createSourceFile(storyPath, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
    assert.match(story, /Restored\/Choice/);
    assert.match(story, /tiny|huge/);
    assert.match(mdx, /av-story-type-render/);
    assert.doesNotMatch(story + mdx, /Initial\/Choice|small|large|medium/);
});
