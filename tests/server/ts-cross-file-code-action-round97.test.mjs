import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('action TS inter-fichiers : un membre ajouté à l’interface est implémenté dans le consommateur', async () => {
    const root = 'file:///D:/test/round97-action/';
    const ownerUri = `${root}contract.lib.avt`;
    const consumerUri = `${root}card.lib.avt`;
    const sources = {
        [ownerUri]: 'namespace Shared { export interface Named { name(): string; } }',
        [consumerUri]: 'class Card implements Shared.Named { name(): string { return "card"; } }',
    };
    const versions = { [ownerUri]: 1, [consumerUri]: 1 };
    const files = {};
    function refresh(uri, source) {
        sources[uri] = source;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
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
    service.build = { tsFiles: files, npmBuilder: { unregister() {} }, externalPackageInformation: { getNpmUri: () => undefined }, getNpmReplacementName: () => '', getNamespaceForUri: () => '', project: { resolveAlias: name => name }, buildConfig: { stories: false }, hasNpmOutput: false, namespaces: [] };
    try {
        assert.equal(languageService.getSemanticDiagnostics(consumerUri).some(item => item.code === 2420), false);
        refresh(ownerUri, 'namespace Shared { export interface Named { name(): string; id(): number; } }');
        const diagnostic = languageService.getSemanticDiagnostics(consumerUri).find(item => item.code === 2420);
        assert.ok(diagnostic, 'l’ajout du membre dans un autre fichier invalide la classe');
        const consumer = files[consumerUri].file;
        const range = {
            start: consumer.documentInternal.positionAt(diagnostic.start),
            end: consumer.documentInternal.positionAt(diagnostic.start + diagnostic.length),
        };
        const action = (await service.doCodeAction(consumer, range)).find(item => /implement interface/i.test(item.title));
        assert.ok(action, 'une action propose de compléter la classe');
        assert.deepEqual(Object.keys(action.edit.changes), [consumerUri]);
        const updated = TextDocument.applyEdits(consumer.documentUser, action.edit.changes[consumerUri]);
        assert.match(updated, /id\(\): number/);
        assert.match(updated, /name\(\): string/);
        refresh(consumerUri, updated);
        assert.equal(languageService.getSemanticDiagnostics(consumerUri).some(item => item.code === 2420), false);
    } finally {
        languageService.dispose();
    }
});
