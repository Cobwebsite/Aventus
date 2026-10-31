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

test('parsed Storybook class follows member visibility transitions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-visibility-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };

    const uri = 'file:///project/visibility.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, namespaces: [], hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const path = join(root, 'auto', 'Catalog', 'Record.stories.ts');
    const render = async (version, body) => {
        const source = `namespace Catalog { export class Record { ${body} } }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const story = readFileSync(path, 'utf8');
        assert.deepEqual(ts.createSourceFile(path, story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return story;
    };

    const first = await render(1, 'public shown = 1; private hidden = 2; protected inherited = 3;');
    assert.match(first, /shown/);
    assert.doesNotMatch(first, /hidden|inherited/);

    const second = await render(2, 'private shown = 1; public hidden = 2; protected inherited = 3;');
    assert.match(second, /hidden/);
    assert.doesNotMatch(second, /shown|inherited/);

    const third = await render(3, 'protected hidden = 2; public inherited = 3;');
    assert.match(third, /inherited/);
    assert.doesNotMatch(third, /shown|hidden/);
});
