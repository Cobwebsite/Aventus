import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed class export none removes its Storybook pair and later restores current members', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-class-export-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };

    const uri = 'file:///project/models.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, namespaces: [], hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const pair = name => [
        join(root, 'auto', 'Catalog', `${name}.stories.ts`),
        join(root, 'auto', 'Catalog', `${name}_.mdx`),
    ];
    const render = async (version, decorator, member, documentation) => {
        const source = `namespace Catalog {
/** ${documentation} */
${decorator} export class Record { public ${member}: string = ''; }
/** Stable neighbor. */
@Storybook() export class Neighbor { public stable = 1; }
}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.classes.Record);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        for (const path of pair('Neighbor')) assert.equal(existsSync(path), true);
        return parsed;
    };

    const first = await render(1, '@Storybook({group:"First"})', 'oldMember', 'Initial record.');
    assert.ok(first.classes.Record.storieContent);
    for (const path of pair('Record')) assert.equal(existsSync(path), true);
    assert.match(readFileSync(pair('Record')[0], 'utf8'), /oldMember|Initial record\./);

    const second = await render(2, '@Storybook({export:"none"})', 'hiddenMember', 'Hidden record.');
    assert.equal(second.classes.Record.storieContent, undefined);
    for (const path of pair('Record')) assert.equal(existsSync(path), false);

    const third = await render(3, '@Storybook({group:"Again"})', 'newMember', 'Restored record.');
    assert.ok(third.classes.Record.storieContent);
    for (const path of pair('Record')) assert.equal(existsSync(path), true);
    const output = readFileSync(pair('Record')[0], 'utf8');
    const mdx = readFileSync(pair('Record')[1], 'utf8');
    assert.match(output, /newMember/);
    assert.match(output + mdx, /Restored record\./);
    assert.doesNotMatch(output + mdx, /oldMember|hiddenMember|Initial record\.|Hidden record\./);
    assert.deepEqual(ts.createSourceFile('Record.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
});
