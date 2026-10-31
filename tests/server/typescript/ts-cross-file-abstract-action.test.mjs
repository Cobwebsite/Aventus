import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

test('action TS : une méthode abstraite ajoutée dans un autre fichier est implémentée après édition', async () => {
    const baseUri = 'file:///D:/test/round140-abstract/base.lib.avt';
    const childUri = 'file:///D:/test/round140-abstract/child.lib.avt';
    const sources = {
        [baseUri]: 'namespace Shared { export abstract class Base { abstract name(): string; } }',
        [childUri]: 'class Card extends Shared.Base { name(): string { return "card"; } }',
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
        refresh(baseUri, 'namespace Shared { export abstract class Base { abstract name(): string; abstract id(): number; } }');
        const diagnostic = languageService.getSemanticDiagnostics(childUri).find(item => item.code === 2515);
        assert.ok(diagnostic, 'la nouvelle méthode abstraite invalide la classe dérivée');
        const child = files[childUri].file;
        const range = {
            start: child.documentInternal.positionAt(diagnostic.start),
            end: child.documentInternal.positionAt(diagnostic.start + diagnostic.length),
        };
        const action = (await service.doCodeAction(child, range)).find(item => /implement inherited abstract class/i.test(item.title));
        assert.ok(action, 'une action propose de compléter la classe dérivée');
        assert.deepEqual(Object.keys(action.edit.changes), [childUri]);
        const updated = TextDocument.applyEdits(child.documentUser, action.edit.changes[childUri]);
        assert.match(updated, /id\(\): number/);
        assert.match(updated, /name\(\): string/);
        refresh(childUri, updated);
        assert.equal(languageService.getSemanticDiagnostics(childUri).some(item => item.code === 2515), false);
    } finally {
        languageService.dispose();
    }
});
