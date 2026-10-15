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

test('Storybook removes a parsed variable pair while rewriting a surviving class after an edit', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-variable-removal-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => { SettingsManager.instance = previousSettings; GenericServer.instance = previousServer; });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/catalog.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const write = async (version, declarations) => {
        const document = TextDocument.create(uri, 'typescript', version, `namespace Catalog { ${declarations} }`);
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
        /** Initial item. */ @Storybook({group:'Models'}) export class Item { public name: string = ''; }
        /** Initial count. */ @Storybook({group:'Models'}) export const count: number = 1;
    `);
    assert.ok(first.classes.Item.storieContent);
    assert.ok(first.variables.count.storieContent);
    for (const name of ['Item', 'count']) for (const path of pair(name)) assert.equal(existsSync(path), true);
    assert.match(readFileSync(pair('count')[0], 'utf8'), /Initial count/);

    const second = await write(2, `
        /** Revised item. */ @Storybook({group:'Models'}) export class Item { public id: number = 2; }
    `);
    assert.ok(second.classes.Item.storieContent);
    for (const path of pair('count')) assert.equal(existsSync(path), false);
    for (const path of pair('Item')) assert.equal(existsSync(path), true);
    const source = readFileSync(pair('Item')[0], 'utf8');
    assert.deepEqual(ts.createSourceFile('Item.stories.ts', source, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
    assert.match(source, /Revised item/);
    assert.doesNotMatch(source, /Initial item/);
});
