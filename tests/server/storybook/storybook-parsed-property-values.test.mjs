import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { AventusWebcomponentCompiler }, { AventusWebComponentLogicalFile },
    { Storie }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/component/compiler/compiler.ts', 'language-services/ts/component/File.ts',
    'project/storybook/Stories.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('parsed Property StoryValue changes and removal regenerate controls and story args', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-story-property-values-'));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    });
    SettingsManager.instance = { settings: { useStats: false } };
    GenericServer.instance = { logLevel: 4 };

    const uri = `file:///${root.replaceAll('\\', '/')}/Card.wcl.avt`;
    const config = { module: 'Demo', componentPrefix: 'demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', namespaces: [], noNamespaceUri: {}, isCoreBuild: false,
        hasNpmOutput: false, hasStories: true, npmBuilder: { unregister() {} }, buildConfig: config,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null,
        htmlLanguageService: { getInternalTagUri: () => null },
    };
    const stories = new Storie(build, config);

    const generate = async (version, members) => {
        const source = `@TagName("demo-card") @Storybook({export:"public"}) export class Card { ${members} }`;
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
        assert.equal(compiler.compile().componentName, 'Card');
        logical.storyBookInfo = { argsTypes: compiler.storyArgTypes, args: compiler.storyArgs };
        await stories.write({ [uri]: logical }, true);
        const story = readFileSync(join(root, 'auto', 'Card.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Card_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Card.stories.ts', story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-class-render/);
        return { args: compiler.storyArgs, controls: compiler.storyArgTypes, story };
    };

    const first = await generate(1,
        '@Property() public label: string = "First"; @Property() @StoryValue(4) public count: number = 2;');
    assert.equal(first.args.label, '"First"');
    assert.equal(first.args.count, '4');
    assert.equal(first.controls.label.table.category, 'Properties');
    assert.equal(first.controls.label.control, 'text');
    assert.equal(first.controls.count.control, 'number');
    assert.match(first.story, /"count":4/);

    const second = await generate(2,
        '@Property() public label: string = "Second default"; @Property() @StoryValue(7) public count: number = 3;');
    assert.equal(second.args.label, '"Second default"');
    assert.equal(second.args.count, '7');
    assert.equal(second.controls.count.table.category, 'Properties');
    assert.match(second.story, /"count":7/);
    assert.doesNotMatch(second.story, /"First"/);

    const third = await generate(3, '@Property() public label: string = "Last";');
    assert.equal(third.args.label, '"Last"');
    assert.equal(third.args.count, undefined);
    assert.equal(third.controls.count, undefined);
    assert.match(third.story, /"label":"Last"/);
    assert.doesNotMatch(third.story, /"count"|Second default|"First"/);
});
