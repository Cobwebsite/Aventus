import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ParserHtml }, { AventusWebcomponentCompiler },
    { AventusWebComponentLogicalFile }, { Storie }, { GenericServer },
    { SettingsManager }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/ts/component/compiler/compiler.ts',
    'language-services/ts/component/File.ts', 'project/storybook/Stories.ts',
    'GenericServer.ts', 'settings/Settings.ts',
]);

test('parsed Storybook slot values follow view and decorator revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-slot-values-'));
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
    const viewUri = uri.replace('.wcl.avt', '.wcv.avt');
    const config = { module: 'Demo', componentPrefix: 'demo', stories: { output: root, format: 'public' } };
    const build = {
        module: 'Demo', namespaces: [], noNamespaceUri: {}, isCoreBuild: false,
        hasNpmOutput: false, hasStories: true, npmBuilder: { unregister() {} }, buildConfig: config,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        wcFiles: {}, tsFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        tsLanguageService: { doValidation: () => [] }, addNamespace() {},
        getComponentPrefix: () => 'demo', getWebComponentDefinitionFile: () => null,
        getWebComponentTagDependency: () => null, getAvoidParsingTags: () => [],
        htmlLanguageService: { getInternalTagUri: () => null, getClassByTag: () => null },
        externalPackageInformation: { getNpmUri: () => null },
    };
    const stories = new Storie(build, config);

    const generate = async (version, values, viewText) => {
        const source = `@TagName("demo-card") @Storybook({export:"public",slots:{values:${JSON.stringify(values)}}}) export class Card {}`;
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
        const viewDocument = TextDocument.create(viewUri, 'Aventus HTML', version, viewText);
        const view = { file: { uri: viewUri, versionUser: version, documentUser: viewDocument }, tsFile: logical, scssFile: null };
        build.htmlFiles[viewUri] = { fileParsed: ParserHtml.parse(view, build), compiledVersion: version, slotsInfo: {} };
        const compiler = new AventusWebcomponentCompiler(logical, build);
        assert.equal(compiler.compile().componentName, 'Card');
        logical.storyBookInfo = { argsTypes: compiler.storyArgTypes, args: compiler.storyArgs };
        await stories.write({ [uri]: logical }, true);
        const story = readFileSync(join(root, 'auto', 'Card.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Card_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Card.stories.ts', story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /av-story-class-render/);
        return { story, args: compiler.storyArgs, argTypes: compiler.storyArgTypes };
    };

    const first = await generate(1, { header: '"First heading"' }, '<slot name="header"></slot>');
    assert.equal(first.args['@header'], '"First heading"');
    assert.equal(first.argTypes['@header'].control, 'text');
    assert.match(first.story, /First heading/);

    const second = await generate(2, { header: '"Second heading"', footer: '"Footer text"' },
        '<slot name="header"></slot><slot name="footer"></slot>');
    assert.equal(second.args['@header'], '"Second heading"');
    assert.equal(second.args['@footer'], '"Footer text"');
    assert.doesNotMatch(second.story, /First heading/);
    assert.match(second.story, /Second heading|Footer text/);

    const third = await generate(3, {}, '<slot name="footer"></slot>');
    assert.equal(third.args['@footer'], '');
    assert.equal(third.args['@header'], undefined);
    assert.doesNotMatch(third.story, /First heading|Second heading|Footer text|"@header"/);
});
