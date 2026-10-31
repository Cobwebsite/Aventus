import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed enum Storybook export removal and restoration refreshes the generated pair', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-enum-export-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/state.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const storyPath = join(root, 'auto', 'State', 'Status.stories.ts');
    const mdxPath = join(root, 'auto', 'State', 'Status_.mdx');
    const neighborPath = join(root, 'auto', 'State', 'Neighbor.stories.ts');
    const render = async (version, decorator, description, member) => {
        const source = `namespace State {\n/** ${description} */\n${decorator} export enum Status { ${member} }\n@Storybook({group:"Neighbor"}) export enum Neighbor { Ready = "ready" }\n}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.enums.Status);
        assert.ok(parsed.enums.Neighbor?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        return parsed.enums.Status;
    };

    const initial = await render(1, '@Storybook({group:"Initial"})', 'Original status.', 'Open = "open"');
    assert.ok(initial.storieContent);
    assert.equal(existsSync(storyPath), true);
    assert.equal(existsSync(mdxPath), true);
    assert.equal(existsSync(neighborPath), true);

    const hidden = await render(2, '@Storybook({export:"none"})', 'Hidden status.', 'Closed = "closed"');
    assert.equal(hidden.storieContent, undefined);
    assert.equal(existsSync(storyPath), false);
    assert.equal(existsSync(mdxPath), false);
    assert.equal(existsSync(neighborPath), true);

    const restored = await render(3, '@Storybook({group:"Restored"})', 'Final status.', 'Pending = "pending"');
    assert.ok(restored.storieContent);
    const story = readFileSync(storyPath, 'utf8');
    const mdx = readFileSync(mdxPath, 'utf8');
    assert.deepEqual(ts.createSourceFile(storyPath, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
    assert.match(story, /Restored\/Status/);
    assert.match(story, /Final status/);
    assert.match(story, /Pending/);
    assert.match(mdx, /av-story-enum-render/);
    assert.doesNotMatch(story + mdx, /Initial\/Status|Original status|Open|Closed|Hidden status/);
    assert.equal(existsSync(neighborPath), true);
});
