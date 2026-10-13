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

test('parsed Storybook export modes select generated declarations after source edits', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-exports-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    try {
        const uri = `file:///${root.replaceAll('\\', '/')}/source.lib.avt`;
        const config = { module: 'Demo', stories: { output: root, format: 'public' } };
        const build = {
            module: 'Demo', buildConfig: config, noNamespaceUri: {}, hasNpmOutput: false,
            npmBuilder: { unregister() {} }, getNamespaceForUri: () => '',
            getNpmReplacementName: () => '',
        };
        const stories = new Storie(build, config);
        const generate = async (version, mode) => {
            const source = `
                @Storybook({export:${JSON.stringify(mode)}})
                class Internal {}
                export class Public {}
                @Storybook({export:"none"})
                export class Hidden {}
            `;
            const document = TextDocument.create(uri, 'typescript', version, source);
            const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
            const parsed = ParserTs.parse(file, false, build);
            await stories.write({ [uri]: { fileParsed: parsed } }, true);
            return parsed;
        };
        const pathFor = (name) => join(root, 'auto', `${name}.stories.ts`);

        const first = await generate(1, 'all');
        assert.ok(first.classes.Internal.storieContent);
        assert.ok(existsSync(pathFor('Internal')));
        assert.ok(existsSync(pathFor('Public')));
        assert.equal(existsSync(pathFor('Hidden')), false);
        assert.deepEqual(ts.createSourceFile('Internal.stories.ts', readFileSync(pathFor('Internal'), 'utf8'), ts.ScriptTarget.Latest, true).parseDiagnostics, []);

        const second = await generate(2, 'none');
        assert.equal(second.classes.Internal.storieContent, undefined);
        assert.equal(existsSync(pathFor('Internal')), false);
        assert.ok(existsSync(pathFor('Public')));
        assert.equal(existsSync(pathFor('Hidden')), false);

        const third = await generate(3, 'protected');
        assert.ok(third.classes.Internal.storieContent);
        assert.ok(existsSync(pathFor('Internal')));
        assert.ok(existsSync(pathFor('Public')));
    } finally {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
