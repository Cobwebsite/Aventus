import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('un type conditionnel distant avec infer actualise les diagnostics après ses révisions', () => {
    const modelUri = 'file:///D:/round267/conditional-model.lib.avt';
    const consumerUri = 'file:///D:/round267/conditional-consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export type Box<T> = { value: T }; export type Item<T> = T extends Box<infer U> ? U : T; export type Result = Item<Box<string>>; }',
        [consumerUri]: 'const result: Model.Result = "ready";',
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
        edit(modelUri, 'namespace Model { export type Box<T> = { value: T }; export type Item<T> = T extends Box<infer U> ? U : T; export type Result = Item<Box<number>>; }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'result', line: 0 }]);
        edit(consumerUri, '\nconst result: Model.Result = 42;');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export type Box<T> = { value: T }; export type Item<T> = T extends Box<infer U> ? { item: U } : T; export type Result = Item<Box<number>>; }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'result', line: 1 }]);
        edit(consumerUri, '\nconst result: Model.Result = { item: 42 };');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
