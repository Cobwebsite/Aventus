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

test('Storybook removes parser-derived enum and alias files while retaining surviving declarations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-kind-removal-'));
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
    const write = async (version, declarations) => {
        const source = `namespace Catalog { ${declarations} }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        return parsed;
    };
    const pair = name => [
        join(root, 'auto', 'Catalog', `${name}.stories.ts`),
        join(root, 'auto', 'Catalog', `${name}_.mdx`),
    ];

    const first = await write(1, `
        @Storybook({group:'Models'}) export enum Tone { Light, Dark }
        @Storybook({group:'Models'}) export type Name = string;
        @Storybook({group:'Models'}) export function format(value: string): string { return value; }
    `);
    assert.ok(first.enums.Tone.storieContent);
    assert.ok(first.aliases.Name.storieContent);
    assert.ok(first.functions.format.storieContent);
    for (const name of ['Tone', 'Name', 'format']) for (const path of pair(name)) assert.equal(existsSync(path), true);

    const second = await write(2, `
        @Storybook({group:'Models'}) export function format(value: number): number { return value; }
    `);
    assert.ok(second.functions.format.storieContent);
    for (const name of ['Tone', 'Name']) for (const path of pair(name)) assert.equal(existsSync(path), false);
    for (const path of pair('format')) assert.equal(existsSync(path), true);
    const source = readFileSync(pair('format')[0], 'utf8');
    assert.deepEqual(ts.createSourceFile('format.stories.ts', source, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
    assert.match(source, /"name": "value"[\s\S]*"name": "number"/);
    assert.doesNotMatch(source, /"name": "string"/);
});
