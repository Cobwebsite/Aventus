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

test('numeric and boolean StoryValue arguments from parsed source produce valid story args after edit', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storyvalue-types-'));
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
    const compile = async (version, count, active) => {
        const source = `@TagName("demo-card") @Storybook({export:"public"}) export class Card {
            @Attribute() @StoryValue(${count}) public count: number = 0;
            @Attribute() @StoryValue(${active}) public active: boolean = false;
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
        assert.deepEqual(ts.createSourceFile('Card.stories.ts', output, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return { args: compiler.storyArgs, controls: compiler.storyArgTypes, output };
    };

    const first = await compile(1, 3, true);
    assert.equal(first.args.count, '3');
    assert.equal(first.args.active, 'true');
    assert.equal(first.controls.count.control, 'number');
    assert.equal(first.controls.active.control, 'boolean');
    assert.match(first.output, /"count":3/);
    assert.match(first.output, /"active":true/);

    const second = await compile(2, 7, false);
    assert.equal(second.args.count, '7');
    assert.equal(second.args.active, 'false');
    assert.match(second.output, /"count":7/);
    assert.match(second.output, /"active":false/);
    assert.doesNotMatch(second.output, /"count":3|"active":true/);
});
