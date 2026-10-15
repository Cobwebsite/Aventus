import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { AventusWebcomponentCompiler }, { AventusWebComponentLogicalFile },
    { Storie }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/component/compiler/compiler.ts', 'language-services/ts/component/File.ts',
    'project/storybook/Stories.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('parsed StoryValue removal restores field default and removes stale attribute args', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storyvalue-removal-'));
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
        '@Attribute() @StoryValue(12) public count: number = 2; @Attribute() public enabled: boolean = true;');
    assert.equal(first.args.count, '12');
    assert.equal(first.args.enabled, 'true');
    assert.equal(first.controls.count.control, 'number');
    assert.equal(first.controls.enabled.control, 'boolean');
    assert.match(first.story, /"count":12/);

    const second = await generate(2,
        '@Attribute() public count: number = 5; @Attribute() @StoryValue(false) public enabled: boolean = true;');
    assert.equal(second.args.count, '5');
    assert.equal(second.args.enabled, 'false');
    assert.match(second.story, /"count":5/);
    assert.match(second.story, /"enabled":false/);
    assert.doesNotMatch(second.story, /"count":12/);

    const third = await generate(3, '@Attribute() public count: number = 8;');
    assert.equal(third.args.count, '8');
    assert.equal(third.args.enabled, undefined);
    assert.equal(third.controls.enabled, undefined);
    assert.match(third.story, /"count":8/);
    assert.doesNotMatch(third.story, /"enabled"|"count":5|"count":12/);
});
