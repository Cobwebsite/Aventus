import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('parsed Storybook function refreshes signature, documentation and TS/MDX across three revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-function-revisions-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/operations.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const generate = async (version, signature, documentation) => {
        const source = `namespace Operations {\n/** ${documentation} */\n@Storybook({group:'Actions'}) export function apply(${signature}): void {}\n}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.functions.apply?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const output = readFileSync(join(root, 'auto', 'Operations', 'apply.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Operations', 'apply_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('apply.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-function-render/);
        return { output, mdx };
    };

    const first = await generate(1, 'label: string', 'Initial operation.');
    assert.match(first.output, /Initial operation/);
    assert.match(first.output, /"name": "label"[\s\S]*"name": "string"/);

    const second = await generate(2, 'count: number, enabled: boolean', 'Revised operation.');
    assert.match(second.output, /Revised operation/);
    assert.match(second.output, /"name": "count"[\s\S]*"name": "number"/);
    assert.match(second.output, /"name": "enabled"[\s\S]*"name": "boolean"/);
    assert.doesNotMatch(second.output, /Initial operation|"name": "label"/);

    const third = await generate(3, 'token?: string', 'Final operation.');
    assert.match(third.output, /Final operation/);
    assert.match(third.output, /"name": "token"/);
    assert.doesNotMatch(third.output, /Revised operation|"name": "count"|"name": "enabled"/);
    assert.notEqual(third.output, second.output);
});
