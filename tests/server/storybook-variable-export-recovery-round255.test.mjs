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

test('parsed variable removes and restores its Storybook pair while a neighbor remains', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-variable-export-'));
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
    const pair = name => [
        join(root, 'auto', 'Constants', `${name}.stories.ts`),
        join(root, 'auto', 'Constants', `${name}_.mdx`),
    ];
    const render = async (version, decorator, type, value) => {
        const source = `namespace Constants {
${decorator} export const threshold: ${type} = ${value};
@Storybook() export const retained: boolean = true;
}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.variables.threshold);
        assert.ok(parsed.variables.retained?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        for (const path of pair('retained')) assert.equal(existsSync(path), true);
        return parsed.variables.threshold;
    };

    const first = await render(1, '@Storybook({group:"First"})', 'number', '17');
    assert.ok(first.storieContent);
    for (const path of pair('threshold')) assert.equal(existsSync(path), true);
    assert.match(readFileSync(pair('threshold')[0], 'utf8'), /First\/threshold|"name": "number"/);

    const hidden = await render(2, '@Storybook({export:"none"})', 'string', '"hidden"');
    assert.equal(hidden.storieContent, undefined);
    for (const path of pair('threshold')) assert.equal(existsSync(path), false);

    const restored = await render(3, '@Storybook({group:"Restored"})', 'boolean', 'false');
    assert.ok(restored.storieContent);
    for (const path of pair('threshold')) assert.equal(existsSync(path), true);
    const story = readFileSync(pair('threshold')[0], 'utf8');
    const mdx = readFileSync(pair('threshold')[1], 'utf8');
    assert.deepEqual(ts.createSourceFile(pair('threshold')[0], story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
    assert.match(story, /Restored\/threshold/);
    assert.match(story, /"name": "boolean"/);
    assert.match(mdx, /av-story-variable-render/);
    assert.doesNotMatch(story + mdx, /First\/threshold|"name": "number"|"name": "string"/);
});
