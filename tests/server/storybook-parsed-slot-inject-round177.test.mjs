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

test('parsed Storybook slot injections update component imports across source edits', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-slot-inject-'));
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
        externalPackageInformation: { getNpmUri: () => null },
    };
    const stories = new Storie(build, config);
    const generate = async (version, injected) => {
        const source = `class First {} class Second {}
            @TagName("demo-card") @Storybook({export:"public",slots:{inject:${JSON.stringify(injected)}}})
            export class Card {}`;
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
        // The component compiler invokes this while compiling a linked view.
        parsed.classes.Card.loadStoryBookInject();
        logical.storyBookInfo = { argsTypes: compiler.storyArgTypes, args: compiler.storyArgs };
        await stories.write({ [uri]: logical }, true);
        const story = readFileSync(join(root, 'auto', 'Card.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Card_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Card.stories.ts', story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        assert.match(mdx, /import Meta from '.\/Card\.stories'/);
        assert.match(mdx, /<Canvas \/>/);
        return { story, mdx, parsed };
    };

    const first = await generate(1, ['First']);
    assert.deepEqual(first.parsed.classes.Card.storieDecorator.slots.inject, ['First']);
    assert.match(first.story, /import \{ First \} from /);
    assert.doesNotMatch(first.story, /import \{ Second \} from /);

    const second = await generate(2, ['Second']);
    assert.match(second.story, /import \{ Second \} from /);
    assert.doesNotMatch(second.story, /import \{ First \} from /);

    const third = await generate(3, []);
    assert.doesNotMatch(third.story, /import \{ (?:First|Second) \} from /);
    assert.match(third.story, /import \{ Card \} from /);
});
