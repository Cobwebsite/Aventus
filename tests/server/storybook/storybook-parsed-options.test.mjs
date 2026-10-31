import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { AventusWebcomponentCompiler }, { AventusWebComponentLogicalFile }, { Storie }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/component/compiler/compiler.ts', 'language-services/ts/component/File.ts',
    'project/storybook/Stories.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('parsed Storybook options update live canvas and default story through component edits', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-options-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };
    try {
        const uri = `file:///${root.replaceAll('\\', '/')}/Card.wcl.avt`;
        const config = { module: 'Demo', componentPrefix: 'demo', stories: { output: root, format: 'public' } };
        const build = {
            module: 'Demo', namespaces: [], noNamespaceUri: {}, isCoreBuild: false, hasNpmOutput: false, hasStories: true,
            npmBuilder: { unregister() {} }, buildConfig: config,
            getNamespaceForUri: () => '', getNpmReplacementName: () => '',
            wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
            tsLanguageService: { doValidation: () => [] }, addNamespace() {},
            getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
            getWebComponentTagDependency: () => null,
            htmlLanguageService: { getInternalTagUri: () => null },
        };
        const stories = new Storie(build, config);
        const generate = async (version, options) => {
            const source = `@TagName("demo-card") @Storybook(${JSON.stringify({ export: 'public', ...options })}) export class Card {}`;
            const document = TextDocument.create(uri, 'typescript', version, source);
            const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
            const parsed = ParserTs.parse(file, false, build);
            parsed.classes.Card.implements.push('Aventus.DefaultComponent');
            const logical = Object.create(AventusWebComponentLogicalFile.prototype);
            logical._componentClassName = 'Card';
            logical._file = file;
            logical._build = build;
            logical.fileParsed = parsed;
            Object.defineProperty(logical, 'viewMethodName', { value: '__view' });
            logical.resetViewClassInfoDep = () => {};
            const compiler = new AventusWebcomponentCompiler(logical, build);
            compiler.compile();
            logical.storyBookInfo = { argsTypes: compiler.storyArgTypes, args: compiler.storyArgs };
            await stories.write({ [uri]: logical }, true);
            const story = readFileSync(join(root, 'auto', 'Card.stories.ts'), 'utf8');
            const mdx = readFileSync(join(root, 'auto', 'Card_.mdx'), 'utf8');
            assert.deepEqual(ts.createSourceFile('Card.stories.ts', story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
            return { parsed, story, mdx };
        };

        const initial = await generate(1, {});
        assert.equal(initial.parsed.classes.Card.storieDecorator.noLive, undefined);
        assert.match(initial.story, /export const DefaultStory/);
        assert.match(initial.story, /render: \(args\) => render\(args, Card\)/);
        assert.match(initial.mdx, /<Canvas \/>/);

        const noLive = await generate(2, { noLive: true });
        assert.equal(noLive.parsed.classes.Card.storieDecorator.noLive, true);
        assert.match(noLive.story, /export const DefaultStory/);
        assert.doesNotMatch(noLive.story, /render: \(args\) => render\(args, Card\)/);
        assert.doesNotMatch(noLive.mdx, /<Canvas \/>/);

        const noDefault = await generate(3, { noDefaultStory: true });
        assert.equal(noDefault.parsed.classes.Card.storieDecorator.noDefaultStory, true);
        assert.doesNotMatch(noDefault.story, /export const DefaultStory|render: \(args\) => render\(args, Card\)/);
        assert.doesNotMatch(noDefault.mdx, /<Canvas \/>/);

        const restored = await generate(4, {});
        assert.match(restored.story, /export const DefaultStory/);
        assert.match(restored.mdx, /<Canvas \/>/);
    } finally {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
