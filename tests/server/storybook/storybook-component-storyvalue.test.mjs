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
GenericServer.instance = { logLevel: 4 };

test('StoryValue from a parsed WebComponent becomes a live Storybook arg and follows source edits', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storyvalue-'));
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const uri = `file:///${root.replaceAll('\\', '/')}/Card.wcl.avt`;
        const config = { module: 'Demo', componentPrefix: 'demo', stories: { output: root, prefix: 'Library', format: 'public' } };
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
        const story = new Storie(build, config);
        const compile = async (version, storyValue) => {
            const source = `@TagName("demo-card") @Storybook({export:"public"}) export class Card {
                @Attribute() @StoryValue(${JSON.stringify(storyValue)}) public title: string = "Source default";
            }`;
            const document = TextDocument.create(uri, 'typescript', version, source);
            const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
            const fileParsed = ParserTs.parse(file, false, build);
            fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
            const logical = Object.create(AventusWebComponentLogicalFile.prototype);
            logical._componentClassName = 'Card';
            logical._file = file;
            logical._build = build;
            logical.fileParsed = fileParsed;
            Object.defineProperty(logical, 'viewMethodName', { value: '__view' });
            logical.resetViewClassInfoDep = () => {};
            const compiler = new AventusWebcomponentCompiler(logical, build);
            const result = compiler.compile();
            assert.equal(result.componentName, 'Card');
            assert.equal(fileParsed.classes.Card.properties.title.defaultValueStory, JSON.stringify(storyValue));
            logical.storyBookInfo = { argsTypes: compiler.storyArgTypes, args: compiler.storyArgs };
            await story.write({ [uri]: logical }, true);
            const output = readFileSync(join(root, 'auto', 'Card.stories.ts'), 'utf8');
            const diagnostics = ts.createSourceFile('Card.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics;
            return { output, args: compiler.storyArgs, argTypes: compiler.storyArgTypes, diagnostics };
        };
        const first = await compile(1, 'First title');
        assert.equal(first.args.title, '"First title"');
        assert.equal(first.argTypes.title.control, 'text');
        assert.match(first.output, /"title":"First title"/);
        assert.equal(first.diagnostics.length, 0);
        assert.match(first.output, /render: \(args\) => render\(args, Card\)/);
        const second = await compile(2, 'Updated title');
        assert.equal(second.args.title, '"Updated title"');
        assert.match(second.output, /"title":"Updated title"/);
        assert.equal(second.diagnostics.length, 0);
        assert.doesNotMatch(second.output, /First title/);
        const escaped = await compile(3, 'A "quote" and \\ path');
        assert.equal(escaped.args.title, JSON.stringify('A "quote" and \\ path'));
        assert.ok(escaped.output.includes(`"title":${JSON.stringify('A "quote" and \\ path')}`));
        assert.equal(escaped.diagnostics.length, 0);
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
