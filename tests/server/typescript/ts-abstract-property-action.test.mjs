import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('une propriété abstraite ajoutée puis modifiée dans la base renouvelle l’action et le diagnostic de l’enfant', async () => {
    const baseUri = 'file:///D:/test/round171-abstract-property/base.lib.avt';
    const childUri = 'file:///D:/test/round171-abstract-property/child.lib.avt';
    const sources = {
        [baseUri]: 'namespace Shared { export abstract class Base { abstract title: string; } }',
        [childUri]: 'class Card extends Shared.Base { title = "card"; }',
    };
    const versions = { [baseUri]: 1, [childUri]: 1 };
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
    service.build = { tsFiles: files, npmBuilder: { unregister() {} }, externalPackageInformation: { getNpmUri: () => undefined }, getNpmReplacementName: () => '', project: { resolveAlias: name => name }, buildConfig: { stories: false }, hasNpmOutput: false, namespaces: [] };
    try {
        assert.equal(languageService.getSemanticDiagnostics(childUri).some(item => item.code === 2515), false);
        refresh(baseUri, 'namespace Shared { export abstract class Base { abstract title: string; abstract count: number; } }');
        const diagnostic = languageService.getSemanticDiagnostics(childUri).find(item => item.code === 2515);
        assert.ok(diagnostic);
        const child = files[childUri].file;
        const range = { start: child.documentInternal.positionAt(diagnostic.start), end: child.documentInternal.positionAt(diagnostic.start + diagnostic.length) };
        const action = (await service.doCodeAction(child, range)).find(item => /implement inherited abstract class/i.test(item.title));
        assert.ok(action);
        assert.deepEqual(Object.keys(action.edit.changes), [childUri]);
        const updated = TextDocument.applyEdits(child.documentUser, action.edit.changes[childUri]);
        assert.match(updated, /count:\s*number/);
        refresh(childUri, updated);
        assert.equal(languageService.getSemanticDiagnostics(childUri).some(item => item.code === 2515), false);
        refresh(baseUri, 'namespace Shared { export abstract class Base { abstract title: string; abstract count: number; abstract active: boolean; } }');
        assert.ok(languageService.getSemanticDiagnostics(childUri).some(item => item.code === 2515));
        refresh(childUri, updated.replace(/}\s*$/, 'active = true; }'));
        assert.equal(languageService.getSemanticDiagnostics(childUri).some(item => item.code === 2515), false);
    } finally {
        languageService.dispose();
    }
});
