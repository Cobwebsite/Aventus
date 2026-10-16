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

test('Storybook export none removes and restores a parsed function pair without removing declaration', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-decorator-removal-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/actions.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const pair = name => [
        join(root, 'auto', 'Actions', `${name}.stories.ts`),
        join(root, 'auto', 'Actions', `${name}_.mdx`),
    ];
    const render = async (version, decorator, doc) => {
        const source = `namespace Actions {\n/** ${doc} */\n${decorator} export function run(value: string): void {}\n/** Kept. */\n@Storybook() export function keep(): void {}\n}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.functions.run);
        assert.ok(parsed.functions.keep?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        for (const path of pair('keep')) assert.equal(existsSync(path), true);
        return parsed;
    };

    const first = await render(1, '@Storybook({group:"First"})', 'Initial action.');
    assert.ok(first.functions.run.storieContent);
    for (const path of pair('run')) assert.equal(existsSync(path), true);
    assert.match(readFileSync(pair('run')[0], 'utf8'), /Initial action\./);

    const second = await render(2, '@Storybook({export:"none"})', 'Hidden action.');
    assert.equal(second.functions.run.storieContent, undefined);
    for (const path of pair('run')) assert.equal(existsSync(path), false);

    const third = await render(3, '@Storybook({group:"Again"})', 'Restored action.');
    assert.ok(third.functions.run.storieContent);
    for (const path of pair('run')) assert.equal(existsSync(path), true);
    const output = readFileSync(pair('run')[0], 'utf8');
    assert.match(output, /Again\/run|Restored action\./);
    assert.doesNotMatch(output, /Initial action\.|First\/run/);
    assert.deepEqual(ts.createSourceFile('run.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
});
