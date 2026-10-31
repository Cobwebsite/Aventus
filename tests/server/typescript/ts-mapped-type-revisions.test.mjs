import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('un type mappé distant renouvelle les diagnostics des clés et valeurs après édition', () => {
    const modelUri = 'file:///D:/round262/mapped-model.lib.avt';
    const consumerUri = 'file:///D:/round262/mapped-consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export type Fields = { name: string; age: number }; export type Labels = { [K in keyof Fields]: string }; }',
        [consumerUri]: 'const labels: Model.Labels = { name: "Name", age: "Age" };',
    };
    const versions = { [modelUri]: 1, [consumerUri]: 1 };
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
    const edit = (uri, source) => { sources[uri] = source; versions[uri]++; };
    const diagnostics = () => {
        const document = TextDocument.create(consumerUri, 'typescript', versions[consumerUri], sources[consumerUri]);
        return service.doValidation({ uri: consumerUri, documentInternal: document }).map(item => ({
            code: item.code, text: document.getText(item.range), line: item.range.start.line,
        }));
    };
    try {
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export type Fields = { name: string; enabled: boolean }; export type Labels = { [K in keyof Fields]: string }; }');
        assert.deepEqual(diagnostics(), [{ code: 2353, text: 'age', line: 0 }]);
        edit(consumerUri, '\nconst labels: Model.Labels = { name: "Name", enabled: "Enabled" };');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export type Fields = { name: string; enabled: boolean; count: number }; export type Labels = { [K in keyof Fields]: Fields[K] }; }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'enabled', line: 1 }]);
        edit(consumerUri, '\nconst labels: Model.Labels = { name: "Name", enabled: true };');
        assert.deepEqual(diagnostics(), [{ code: 2741, text: 'labels', line: 1 }]);
        edit(consumerUri, '\nconst labels: Model.Labels = { name: "Name", enabled: true, count: 2 };');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
