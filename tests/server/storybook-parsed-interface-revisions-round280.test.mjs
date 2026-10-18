import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed Storybook interface replaces inherited type and members over three revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-interface-revisions-'));
    const priorSettings = SettingsManager.instance;
    const priorServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = priorSettings;
        GenericServer.instance = priorServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };

    const config = { module: 'Demo', stories: { output: root, prefix: 'API', format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, namespaces: [], npmBuilder: { unregister() {} }, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const uri = `file:///${root.replaceAll('\\', '/')}/types.lib.avt`;
    const stories = new Storie(build, config);
    const render = async (version, declaration) => {
        const source = `namespace Catalog { export interface BaseA {} export interface BaseB {} ${declaration} }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.classes.Record?.isInterface);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const path = join(root, 'auto', 'Catalog', 'Record.stories.ts');
        const story = readFileSync(path, 'utf8');
        assert.deepEqual(ts.createSourceFile(path, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return { content: parsed.classes.Record.storieContent, story, mdx: readFileSync(join(root, 'auto', 'Catalog', 'Record_.mdx'), 'utf8') };
    };

    const first = await render(1, '/** First interface. */ export interface Record extends BaseA { oldName: string; oldMethod(value: number): string; }');
    assert.equal(first.content.kind, 'interface');
    assert.match(first.story, /First interface|oldName|oldMethod|BaseA/);
    assert.match(first.mdx, /av-story-interface-render/);

    const second = await render(2, '/** Second interface. */ export interface Record extends BaseB { nextName?: boolean; nextMethod(value: string): boolean; }');
    assert.match(second.story, /Second interface|nextName|nextMethod|BaseB/);
    assert.doesNotMatch(second.story, /First interface|oldName|oldMethod|BaseA/);

    const third = await render(3, '/** Final interface. */ export interface Record { finalName: Date; }');
    assert.match(third.story, /Final interface|finalName/);
    assert.doesNotMatch(third.story, /Second interface|nextName|nextMethod|BaseB/);
    assert.match(third.mdx, /av-story-interface-render/);
});
