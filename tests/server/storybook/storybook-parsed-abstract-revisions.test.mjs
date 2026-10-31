import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { AventusWebComponentLogicalFile }, { Storie }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/component/File.ts', 'project/storybook/Stories.ts',
    'GenericServer.ts', 'settings/Settings.ts',
]);

test('parsed Storybook component revisions toggle live rendering for abstract classes', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-abstract-revisions-'));
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
    const generate = async (version, isAbstract, documentation) => {
        const source = `/** ${documentation} */ @TagName("demo-card") @Storybook({export:"public"}) export ${isAbstract ? 'abstract ' : ''}class Card {}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        parsed.classes.Card.implements.push('Aventus.DefaultComponent');
        const logical = Object.create(AventusWebComponentLogicalFile.prototype);
        logical._componentClassName = 'Card';
        logical._file = file;
        logical._build = build;
        logical.fileParsed = parsed;
        logical.storyBookInfo = { argsTypes: {}, args: {} };
        await stories.write({ [uri]: logical }, true);
        const story = readFileSync(join(root, 'auto', 'Card.stories.ts'), 'utf8');
        const mdx = readFileSync(join(root, 'auto', 'Card_.mdx'), 'utf8');
        assert.deepEqual(ts.createSourceFile('Card.stories.ts', story, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
        return { parsed, story, mdx };
    };

    const first = await generate(1, false, 'Concrete first');
    assert.equal(first.parsed.classes.Card.isAbstract, false);
    assert.match(first.story, /Concrete first/);
    assert.match(first.story, /render: \(args\) => render\(args, Card\)/);
    assert.match(first.mdx, /<Canvas \/>/);

    const second = await generate(2, true, 'Abstract middle');
    assert.equal(second.parsed.classes.Card.isAbstract, true);
    assert.match(second.story, /Abstract middle/);
    assert.doesNotMatch(second.story, /Concrete first|render: \(args\) => render\(args, Card\)/);
    assert.doesNotMatch(second.mdx, /<Canvas \/>/);

    const third = await generate(3, false, 'Concrete again');
    assert.equal(third.parsed.classes.Card.isAbstract, false);
    assert.match(third.story, /Concrete again/);
    assert.doesNotMatch(third.story, /Abstract middle|Concrete first/);
    assert.match(third.story, /render: \(args\) => render\(args, Card\)/);
    assert.match(third.mdx, /<Canvas \/>/);
});
