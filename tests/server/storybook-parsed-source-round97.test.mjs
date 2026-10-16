import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'project/storybook/Stories.ts',
    'settings/Settings.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('Storybook writes parser-derived decorators and declarations, then replaces them after source edits', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-parser-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const config = { module: 'Demo', stories: { output: root, prefix: 'Library', format: 'public' } };
        const build = {
            module: 'Demo', buildConfig: config, noNamespaceUri: {}, npmBuilder: { unregister() {} }, hasNpmOutput: false,
            getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        };
        const uri = `file:///${root.replaceAll('\\', '/')}/source.lib.avt`;
        const source = (version, content) => {
            const document = TextDocument.create(uri, 'typescript', version, content);
            const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
            return ParserTs.parse(file, false, build);
        };
        const first = source(1, `
            namespace Catalog {
                /** Initial documentation. */
                @Storybook({export:"public",prefix:"API/",group:"Models",noDefaultStory:true})
                export class Item {
                    /** Current title. */
                    @StoryValue("First")
                    public title: string = "Original";
                }
                export type Id = string;
            }
        `);
        assert.ok(first.classes.Item.storieContent);
        assert.equal(first.classes.Item.properties.title.defaultValueStory, '"First"');
        const stories = new Storie(build, config);
        await stories.write({ [uri]: { fileParsed: first } }, true);
        const storyPath = join(root, 'auto', 'Catalog', 'Item.stories.ts');
        const mdxPath = join(root, 'auto', 'Catalog', 'Item_.mdx');
        const firstStory = readFileSync(storyPath, 'utf8');
        assert.match(firstStory, /API\/Models\/Item/);
        assert.match(firstStory, /Initial documentation/);
        assert.match(firstStory, /"Current title\."/);
        assert.doesNotMatch(firstStory, /export const DefaultStory/);
        assert.match(readFileSync(mdxPath, 'utf8'), /av-story-class-render/);
        assert.ok(existsSync(join(root, 'auto', 'Catalog', 'Id.stories.ts')));
        assert.deepEqual(ts.createSourceFile('Item.stories.ts', firstStory, ts.ScriptTarget.Latest, true).parseDiagnostics, []);

        const second = source(2, `
            namespace Catalog {
                /** Updated documentation. */
                @Storybook({export:"public",prefix:"Docs/",group:"Records"})
                export class Item {
                    @StoryValue("Second")
                    public title: string = "Original";
                }
            }
        `);
        assert.notEqual(second, first);
        assert.equal(second.classes.Item.properties.title.defaultValueStory, '"Second"');
        await stories.write({ [uri]: { fileParsed: second } }, true);
        const secondStory = readFileSync(storyPath, 'utf8');
        assert.match(secondStory, /Docs\/Records\/Item/);
        assert.match(secondStory, /Updated documentation/);
        assert.match(secondStory, /export const DefaultStory/);
        assert.doesNotMatch(secondStory, /API\/Models|Initial documentation/);
        assert.equal(existsSync(join(root, 'auto', 'Catalog', 'Id.stories.ts')), false);
        assert.deepEqual(ts.createSourceFile('Item.stories.ts', secondStory, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
