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

test('parsed variable toggles its default story while retaining updated metadata', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-variable-toggle-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/flags.lib.avt';
    const config = { module: 'Demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const stories = new Storie(build, config);
    const render = async (version, option, doc, value) => {
        const source = `namespace Flags {\n/** ${doc} */\n@Storybook({${option}}) export const enabled: boolean = ${value};\n}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.ok(parsed.variables.enabled?.storieContent);
        await stories.write({ [uri]: { fileParsed: parsed } }, true);
        const output = readFileSync(join(root, 'auto', 'Flags', 'enabled.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Flags', 'enabled_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('enabled.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-variable-render/);
        return output;
    };

    const first = await render(1, 'group:"Switches"', 'Initially enabled.', 'true');
    assert.match(first, /DefaultStory: Story/);
    assert.match(first, /Initially enabled\./);
    assert.match(first, /Switches\/enabled/);

    const second = await render(2, 'group:"Switches",noDefaultStory:true', 'Now disabled.', 'false');
    assert.doesNotMatch(second, /DefaultStory: Story/);
    assert.match(second, /Now disabled\./);
    assert.doesNotMatch(second, /Initially enabled\./);

    const third = await render(3, 'group:"Switches",noDefaultStory:false', 'Enabled again.', 'true');
    assert.match(third, /DefaultStory: Story/);
    assert.match(third, /Enabled again\./);
    assert.doesNotMatch(third, /Now disabled\.|Initially enabled\./);
});
