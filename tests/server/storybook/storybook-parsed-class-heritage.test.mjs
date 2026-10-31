import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed Storybook class renews heritage and public members after source revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-class-heritage-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };

    const uri = 'file:///project/class-heritage.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, namespaces: [], hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const storyPath = join(root, 'auto', 'Catalog', 'Record.stories.ts');
    const mdxPath = join(root, 'auto', 'Catalog', 'Record_.mdx');
    const render = async (version, declaration) => {
        const source = `namespace Catalog { export class BaseA {} export class BaseB {} ${declaration} }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.classes.Record?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const story = readFileSync(storyPath, 'utf8');
        assert.deepEqual(ts.createSourceFile(storyPath, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return { story, mdx: readFileSync(mdxPath, 'utf8') };
    };

    const first = await render(1, '/** Initial record. */ export class Record extends BaseA { oldName = "first"; oldMethod(value: number): string { return String(value); } }');
    assert.match(first.story, /Initial record|oldName|oldMethod|BaseA/);

    const second = await render(2, '/** Updated record. */ export class Record extends BaseB { nextName = true; nextMethod(value: string): boolean { return !!value; } }');
    assert.match(second.story, /Updated record|nextName|nextMethod|BaseB/);
    assert.doesNotMatch(second.story + second.mdx, /Initial record|oldName|oldMethod|BaseA/);

    const third = await render(3, '/** Final record. */ export class Record { finalName = 3; }');
    assert.match(third.story, /Final record|finalName/);
    assert.doesNotMatch(third.story + third.mdx, /Updated record|nextName|nextMethod|BaseB/);
});
