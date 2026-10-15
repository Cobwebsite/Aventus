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

test('Storybook falls back to build prefix after removing a parsed declaration prefix', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-prefix-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => { SettingsManager.instance = previousSettings; GenericServer.instance = previousServer; });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/library.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public', prefix: 'Project' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '',
        getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const generate = async (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const output = readFileSync(join(root, 'auto', 'Widget.stories.ts'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Widget.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return output;
    };

    const local = await generate(1, `@Storybook({export:'public',prefix:'Local',group:'Controls'}) export class Widget {}`);
    assert.match(local, /Local\/Controls\/Widget/);
    assert.doesNotMatch(local, /Project\/Controls/);

    const fallback = await generate(2, `@Storybook({export:'public',group:'Controls'}) export class Widget {}`);
    assert.match(fallback, /Project\/Controls\/Widget/);
    assert.doesNotMatch(fallback, /Local\/Controls/);

    const defaultGroup = await generate(3, `@Storybook({export:'public'}) export class Widget {}`);
    assert.match(defaultGroup, /Project\/Widget/);
    assert.doesNotMatch(defaultGroup, /Controls\/Widget/);
});
