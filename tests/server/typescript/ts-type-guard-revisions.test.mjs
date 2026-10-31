import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('a remote type predicate refreshes narrowed assignments after producer and consumer edits', () => {
    const modelUri = 'file:///D:/round270/guard-model.lib.avt';
    const consumerUri = 'file:///D:/round270/guard-consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export type Value = { kind: "text"; value: string } | { kind: "count"; value: number }; export declare function isSelected(value: Value): value is { kind: "text"; value: string }; }',
        [consumerUri]: 'declare const item: Model.Value;\nif (Model.isSelected(item)) { const result: string = item.value; }',
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
        edit(modelUri, 'namespace Model { export type Value = { kind: "text"; value: string } | { kind: "count"; value: number }; export declare function isSelected(value: Value): value is { kind: "count"; value: number }; }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'result', line: 1 }]);
        edit(consumerUri, '\ndeclare const item: Model.Value;\nif (Model.isSelected(item)) { const result: number = item.value; }');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export type Value = { kind: "text"; value: string } | { kind: "count"; value: boolean }; export declare function isSelected(value: Value): value is { kind: "count"; value: boolean }; }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'result', line: 2 }]);
        edit(consumerUri, '\ndeclare const item: Model.Value;\nif (Model.isSelected(item)) { const result: boolean = item.value; }');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
