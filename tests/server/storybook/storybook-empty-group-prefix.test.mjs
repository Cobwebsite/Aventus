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

test('Storybook parser preserves empty group and prefix, then honors nonempty replacements across revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-empty-group-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => { SettingsManager.instance = previousSettings; GenericServer.instance = previousServer; });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/catalog.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public', prefix: 'Library' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '',
        getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const generate = async (version, decorator) => {
        const document = TextDocument.create(uri, 'typescript', version,
            `namespace Catalog { @Storybook(${decorator}) export class Widget {} }`);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const output = readFileSync(join(root, 'auto', 'Catalog', 'Widget.stories.ts'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Widget.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return output;
    };

    const empty = await generate(1, `{export:'public',group:'',prefix:''}`);
    assert.match(empty, /title: ['"]Widget['"]/);

    const local = await generate(2, `{export:'public',group:'Controls',prefix:'Local'}`);
    assert.match(local, /title: ['"]Local\/Controls\/Widget['"]/);
    assert.doesNotMatch(local, /Library\/Catalog\/Widget/);

    const inherited = await generate(3, `{export:'public'}`);
    assert.match(inherited, /title: ['"]Library\/Catalog\/Widget['"]/);
    assert.doesNotMatch(inherited, /title: ['"]Widget['"]/);
});
