import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('completion in a narrowed remote union follows producer and consumer revisions', async () => {
    const modelUri = 'file:///D:/round277/union-model.lib.avt';
    const userUri = 'file:///D:/round277/union-user.lib.avt';
    const sources = {};
    const versions = {};
    const files = {};
    const refresh = (uri, source) => {
        sources[uri] = source;
        versions[uri] = (versions[uri] ?? 0) + 1;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        files[uri] = { file: { uri, documentInternal: document }, versionInternal: versions[uri], contentForLanguageService: source };
    };
    refresh(modelUri, 'namespace Model { export type Value = { kind: "text"; title: string } | { kind: "count"; amount: number }; }');
    refresh(userUri, 'declare const item: Model.Value;\nif (item.kind === "text") { item.kind; }');
    const host = {
        getCompilationSettings: () => ({ noLib: true, strict: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri] ?? 0),
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    service.filesLoaded = files;
    service.filesNeeded = Object.keys(files);
    service.build = { tsFiles: files };
    const complete = async () => {
        const source = sources[userUri];
        const offset = source.lastIndexOf('item.') + 'item.'.length;
        return service.doComplete(files[userUri].file, files[userUri].file.documentInternal.positionAt(offset));
    };
    try {
        let result = await complete();
        assert.deepEqual(result.items.map(item => item.label).sort(), ['kind', 'title']);
        assert.match((await service.doResolve(result.items.find(item => item.label === 'title'))).detail, /title: string/);

        refresh(modelUri, 'namespace Model { export type Value = { kind: "text"; heading: boolean } | { kind: "count"; amount: number }; }');
        result = await complete();
        assert.deepEqual(result.items.map(item => item.label).sort(), ['heading', 'kind']);
        assert.match((await service.doResolve(result.items.find(item => item.label === 'heading'))).detail, /heading: boolean/);

        refresh(userUri, 'declare const item: Model.Value;\nif (item.kind === "count") { item.kind; }');
        result = await complete();
        assert.deepEqual(result.items.map(item => item.label).sort(), ['amount', 'kind']);
        assert.match((await service.doResolve(result.items.find(item => item.label === 'amount'))).detail, /amount: number/);
    } finally { languageService.dispose(); }
});
