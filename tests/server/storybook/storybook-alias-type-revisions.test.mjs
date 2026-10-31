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

test('Storybook rewrites a parsed alias union, object and simple type across revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-alias-revisions-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/alias.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const path = join(root, 'auto', 'Catalog', 'Choice.stories.ts');
    const mdxPath = join(root, 'auto', 'Catalog', 'Choice_.mdx');
    const write = async (version, declaration) => {
        const source = `namespace Catalog { ${declaration} }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.aliases.Choice.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const story = readFileSync(path, 'utf8');
        const mdx = readFileSync(mdxPath, 'utf8');
        assert.deepEqual(ts.createSourceFile(path, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return { story, mdx };
    };

    const first = await write(1, '@Storybook({group:"Models"}) export type Choice = "small" | "large";');
    assert.match(first.story, /small/);
    assert.match(first.story, /large/);
    assert.match(first.story, /"kind": "union"/);

    const second = await write(2, '@Storybook({group:"Models"}) export type Choice = { count: number; active: boolean };');
    assert.match(second.story, /count/);
    assert.match(second.story, /active/);
    assert.match(second.story, /"kind": "object"/);
    assert.doesNotMatch(second.story + second.mdx, /small|large/);

    const third = await write(3, '@Storybook({group:"Models"}) export type Choice = string;');
    assert.match(third.story, /string/);
    assert.doesNotMatch(third.story + third.mdx, /count|active/);
});
