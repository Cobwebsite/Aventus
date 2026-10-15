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

test('Storybook moves a parsed namespaced declaration and removes its old generated pair', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-namespace-'));
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
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const write = async (version, namespace) => {
        const source = `namespace ${namespace} { @Storybook({export:'public'}) export class Widget {} }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        return parsed;
    };
    const pair = namespace => [
        join(root, 'auto', namespace, 'Widget.stories.ts'),
        join(root, 'auto', namespace, 'Widget_.mdx'),
    ];

    const first = await write(1, 'Original');
    assert.equal(first.classes.Widget.fullName, 'Original.Widget');
    for (const path of pair('Original')) assert.equal(existsSync(path), true);
    assert.deepEqual(ts.createSourceFile('Widget.stories.ts', readFileSync(pair('Original')[0], 'utf8'), ts.ScriptTarget.Latest, true).parseDiagnostics, []);

    const second = await write(2, 'Replacement');
    assert.equal(second.classes.Widget.fullName, 'Replacement.Widget');
    for (const path of pair('Replacement')) assert.equal(existsSync(path), true);
    for (const path of pair('Original')) assert.equal(existsSync(path), false);
});
