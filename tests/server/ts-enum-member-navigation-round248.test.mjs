import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('la navigation et le renommage d’un membre enum suivent deux changements de déclaration distante', async () => {
    const ownerUri = 'file:///D:/round248/status.lib.avt';
    const userUri = 'file:///D:/round248/usage.lib.avt';
    const sources = {
        [ownerUri]: 'namespace Model { export enum Status { Ready, Done } }',
        [userUri]: 'const current = Model.Status.Ready;\nconst final = Model.Status.Done;',
    };
    const versions = { [ownerUri]: 0, [userUri]: 0 };
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
        getScriptVersion: uri => String(versions[uri] ?? 0),
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
    service.build = { tsFiles: files };
    const position = name => files[userUri].file.documentInternal.positionAt(sources[userUri].lastIndexOf(name) + 1);
    const definition = async name => {
        const result = await service.findDefinition(files[userUri].file, position(name));
        return result?.find(item => item.uri === ownerUri);
    };
    try {
        let found = await definition('Done');
        assert.equal(files[ownerUri].file.documentInternal.getText(found.range), 'Done');

        refresh(ownerUri, '\nnamespace Model { export enum Status { Ready, Complete } }');
        assert.equal(await definition('Done'), undefined);
        refresh(userUri, 'const current = Model.Status.Ready;\nconst final = Model.Status.Complete;');
        found = await definition('Complete');
        assert.equal(files[ownerUri].file.documentInternal.getText(found.range), 'Complete');
        assert.equal(found.range.start.line, 1);

        const edits = await service.onRename(files[userUri].file, position('Complete'), 'Finished');
        assert.deepEqual(new Set(Object.keys(edits?.changes ?? {})), new Set([ownerUri, userUri]));
        assert.deepEqual(edits.changes[ownerUri].map(item => files[ownerUri].file.documentInternal.getText(item.range)), ['Complete']);
        assert.deepEqual(edits.changes[userUri].map(item => files[userUri].file.documentInternal.getText(item.range)), ['Complete']);

        refresh(ownerUri, '\nnamespace Model { export enum Status { Ready, Finished } }');
        refresh(userUri, 'const current = Model.Status.Ready;\nconst final = Model.Status.Finished;');
        found = await definition('Finished');
        assert.equal(files[ownerUri].file.documentInternal.getText(found.range), 'Finished');
    } finally { languageService.dispose(); }
});
