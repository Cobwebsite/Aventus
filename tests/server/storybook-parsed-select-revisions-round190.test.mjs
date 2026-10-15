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

test('parsed Storybook select options and values track three component revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-select-revisions-'));
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
    const generate = async (version, type, value) => {
        const source = `@TagName("demo-card") @Storybook({export:"public"}) export class Card {
            @Attribute() @StoryValue("${value}") public mode: ${type} = "${value}";
        }`;
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
        const output = readFileSync(join(root, 'auto', 'Card.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Card_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Card.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-class-render/);
        return { controls: compiler.storyArgTypes, args: compiler.storyArgs, output };
    };

    const first = await generate(1, '"compact" | "wide"', 'compact');
    assert.deepEqual(first.controls.mode.options, ['compact', 'wide']);
    assert.equal(first.controls.mode.control, 'select');
    assert.equal(first.args.mode, 'compact');
    assert.match(first.output, /"options": \[\s*"compact",\s*"wide"/);

    const second = await generate(2, '"wide" | "full"', 'full');
    assert.deepEqual(second.controls.mode.options, ['wide', 'full']);
    assert.equal(second.args.mode, 'full');
    assert.match(second.output, /"options": \[\s*"wide",\s*"full"/);
    assert.doesNotMatch(second.output, /"compact"/);

    const third = await generate(3, '"minimal"', 'minimal');
    assert.deepEqual(third.controls.mode.options, ['minimal']);
    assert.equal(third.args.mode, 'minimal');
    assert.match(third.output, /"minimal"/);
    assert.doesNotMatch(third.output, /"wide"|"full"|"compact"/);
});
