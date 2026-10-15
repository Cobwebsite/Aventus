import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('action TS : propriétés ajoutées à une interface distante, plages et diagnostics après correction', async () => {
    const root = 'file:///D:/test/round185-property/';
    const contractUri = `${root}contract.lib.avt`;
    const consumerUri = `${root}consumer.lib.avt`;
    const sources = {
        [contractUri]: 'namespace Shared { export interface Item { name: string; } }',
        [consumerUri]: 'class Card implements Shared.Item { name = "card"; }',
    };
    const versions = { [contractUri]: 1, [consumerUri]: 1 };
    const files = {};
    function refresh(uri, source) {
        sources[uri] = source;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
        return file;
    }
    for (const [uri, source] of Object.entries(sources)) refresh(uri, source);
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri]),
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    service.languageServiceNamespace = languageService;
    service.filesLoaded = files;
    service.filesNeeded = Object.keys(files);
    service.i18nFiles = {};
    service.build = { tsFiles: files, npmBuilder: { unregister() {} }, externalPackageInformation: { getNpmUri: () => undefined }, getNpmReplacementName: () => '', project: { resolveAlias: name => name }, buildConfig: { stories: false }, hasNpmOutput: false, namespaces: [] };
    try {
        assert.equal(languageService.getSemanticDiagnostics(consumerUri).some(item => item.code === 2420), false);
        refresh(contractUri, 'namespace Shared { export interface Item { name: string; id: number; active: boolean; } }');
        const diagnostic = languageService.getSemanticDiagnostics(consumerUri).find(item => item.code === 2420);
        assert.ok(diagnostic);
        assert.equal(sources[consumerUri].slice(diagnostic.start, diagnostic.start + diagnostic.length), 'Card');
        const consumer = files[consumerUri].file;
        const range = { start: consumer.documentInternal.positionAt(diagnostic.start), end: consumer.documentInternal.positionAt(diagnostic.start + diagnostic.length) };
        const action = (await service.doCodeAction(consumer, range)).find(item => /implement interface/i.test(item.title));
        assert.ok(action);
        assert.deepEqual(Object.keys(action.edit.changes), [consumerUri]);
        const edits = action.edit.changes[consumerUri];
        assert.ok(edits.every(edit => edit.range.start.line === 0 && edit.range.end.line === 0));
        assert.ok(edits.every(edit => consumer.documentUser.offsetAt(edit.range.start) <= consumer.documentUser.offsetAt(edit.range.end)));
        const updated = TextDocument.applyEdits(consumer.documentUser, edits);
        assert.match(updated, /id: number/);
        assert.match(updated, /active: boolean/);
        refresh(consumerUri, updated);
        assert.equal(languageService.getSemanticDiagnostics(consumerUri).some(item => item.code === 2420), false);
    } finally {
        languageService.dispose();
    }
});
