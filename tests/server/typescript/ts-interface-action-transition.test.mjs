import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('action TS : les membres d’interface ajoutés puis retirés suivent les éditions inter-fichiers', async () => {
    const contractUri = 'file:///D:/round169/contract.lib.avt';
    const implementationUri = 'file:///D:/round169/implementation.lib.avt';
    const sources = {
        [contractUri]: 'interface Contract { title: string; }',
        [implementationUri]: 'class Card implements Contract { title = "card"; }',
    };
    const versions = Object.fromEntries(Object.keys(sources).map(uri => [uri, 0]));
    const files = {};
    const refresh = (uri, source) => {
        sources[uri] = source;
        versions[uri]++;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
    };
    for (const [uri, source] of Object.entries(sources)) refresh(uri, source);
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri]),
        getScriptSnapshot: uri => ts.ScriptSnapshot.fromString(sources[uri]),
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
    const actions = async () => {
        const file = files[implementationUri].file;
        const diagnostic = languageService.getSemanticDiagnostics(implementationUri).find(item => item.code === 2420);
        if (!diagnostic) return [];
        const range = { start: file.documentInternal.positionAt(diagnostic.start), end: file.documentInternal.positionAt(diagnostic.start + diagnostic.length) };
        return service.doCodeAction(file, range);
    };
    try {
        assert.equal(languageService.getSemanticDiagnostics(implementationUri).some(item => item.code === 2420), false);
        refresh(contractUri, 'interface Contract { title: string; count: number; }');
        const diagnostic = languageService.getSemanticDiagnostics(implementationUri).find(item => item.code === 2420);
        assert.ok(diagnostic, 'le nouveau membre rend la classe incomplète');
        const action = (await actions()).find(item => /implement interface/i.test(item.title));
        assert.ok(action, 'une action propose les membres manquants');
        assert.deepEqual(Object.keys(action.edit.changes), [implementationUri]);
        const updated = TextDocument.applyEdits(files[implementationUri].file.documentUser, action.edit.changes[implementationUri]);
        assert.match(updated, /count\s*:\s*number/);
        assert.match(updated, /title\s*=\s*"card"/);
        refresh(implementationUri, updated);
        assert.equal(languageService.getSemanticDiagnostics(implementationUri).some(item => item.code === 2420), false);

        refresh(contractUri, 'interface Contract { title: string; }');
        assert.equal(languageService.getSemanticDiagnostics(implementationUri).some(item => item.code === 2420), false);
        assert.deepEqual(await actions(), []);
    } finally { languageService.dispose(); }
});
