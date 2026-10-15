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

test('parsed Storybook prefix and group update generated title and MDX after source edit', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-group-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => { SettingsManager.instance = previousSettings; GenericServer.instance = previousServer; });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/library.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '',
        getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const generate = async (version, prefix, group) => {
        const source = `@Storybook({export:'public',prefix:${JSON.stringify(prefix)},group:${JSON.stringify(group)}}) export class Widget {}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const story = readFileSync(join(root, 'auto', 'Widget.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Widget_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Widget.stories.ts', story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return { parsed, story, mdx };
    };

    const first = await generate(1, 'Library/', 'Public');
    assert.equal(first.parsed.classes.Widget.storieDecorator.prefix, 'Library/');
    assert.equal(first.parsed.classes.Widget.storieDecorator.group, 'Public');
    assert.match(first.story, /Library\/Public\/Widget/);
    assert.match(first.mdx, /import Meta from '.\/Widget\.stories'/);

    const second = await generate(2, 'Components/', 'Beta');
    assert.match(second.story, /Components\/Beta\/Widget/);
    assert.match(second.mdx, /import Meta from '.\/Widget\.stories'/);
    assert.doesNotMatch(second.story, /Library\/Public/);
});
