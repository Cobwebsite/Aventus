import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('action TS : une méthode ajoutée à une interface propose une correction indépendante pour deux classes', async () => {
    const root = 'file:///D:/test/round209-method/';
    const contractUri = `${root}contract.lib.avt`;
    const firstUri = `${root}first.lib.avt`;
    const secondUri = `${root}second.lib.avt`;
    const sources = {
        [contractUri]: 'interface Renderer { name: string; }',
        [firstUri]: 'class First implements Renderer { name = "first"; }',
        [secondUri]: 'class Second implements Renderer { name = "second"; }',
    };
    const versions = Object.fromEntries(Object.keys(sources).map(uri => [uri, 1]));
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
    Object.assign(service, {
        languageService, languageServiceNamespace: languageService, filesLoaded: files,
        filesNeeded: Object.keys(files), i18nFiles: {},
        build: { tsFiles: files, npmBuilder: { unregister() {} }, externalPackageInformation: { getNpmUri: () => undefined }, getNpmReplacementName: () => '', project: { resolveAlias: name => name }, buildConfig: { stories: false }, hasNpmOutput: false, namespaces: [] },
    });
    const missing = uri => languageService.getSemanticDiagnostics(uri).find(diagnostic => diagnostic.code === 2420);
    async function applyAction(uri) {
        const diagnostic = missing(uri);
        assert.ok(diagnostic, `diagnostic d'interface pour ${uri}`);
        const file = files[uri].file;
        const range = { start: file.documentInternal.positionAt(diagnostic.start), end: file.documentInternal.positionAt(diagnostic.start + diagnostic.length) };
        const action = (await service.doCodeAction(file, range)).find(item => /implement interface/i.test(item.title));
        assert.ok(action, `action d'implémentation pour ${uri}`);
        assert.deepEqual(Object.keys(action.edit.changes), [uri]);
        const updated = TextDocument.applyEdits(file.documentUser, action.edit.changes[uri]);
        assert.match(updated, /render\(value: number\): string/);
        refresh(uri, updated);
    }
    try {
        assert.equal(missing(firstUri), undefined);
        assert.equal(missing(secondUri), undefined);
        refresh(contractUri, 'interface Renderer { name: string; render(value: number): string; }');
        assert.ok(missing(firstUri));
        assert.ok(missing(secondUri));
        await applyAction(firstUri);
        assert.equal(missing(firstUri), undefined);
        assert.ok(missing(secondUri), 'la correction de First ne modifie pas Second');
        await applyAction(secondUri);
        assert.equal(missing(secondUri), undefined);
        assert.match(sources[firstUri], /name = "first"/);
        assert.match(sources[secondUri], /name = "second"/);
        assert.match(sources[contractUri], /render\(value: number\): string/);
    } finally {
        languageService.dispose();
    }
});
