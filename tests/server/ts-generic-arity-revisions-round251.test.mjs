import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('l’arité d’un type générique distant actualise les diagnostics après modification de sa déclaration', () => {
    const modelUri = 'file:///D:/round251/generic.lib.avt';
    const consumerUri = 'file:///D:/round251/consumer-generic.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export interface Pair<T> { first: T; } }',
        [consumerUri]: 'declare const pair: Model.Pair<string>;',
    };
    const versions = { [modelUri]: 1, [consumerUri]: 1 };
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
    const edit = (uri, source) => { sources[uri] = source; versions[uri]++; };
    const diagnostics = () => {
        const document = TextDocument.create(consumerUri, 'typescript', versions[consumerUri], sources[consumerUri]);
        return service.doValidation({ uri: consumerUri, documentInternal: document }).map(item => ({
            code: item.code, text: document.getText(item.range), line: item.range.start.line,
        }));
    };
    try {
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export interface Pair<T, U> { first: T; second: U; } }');
        assert.deepEqual(diagnostics(), [{ code: 2314, text: 'Model.Pair<string>', line: 0 }]);
        edit(consumerUri, '\ndeclare const pair: Model.Pair<string, number>;');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export interface Pair<T> { first: T; } }');
        assert.deepEqual(diagnostics(), [{ code: 2314, text: 'Model.Pair<string, number>', line: 1 }]);
        edit(consumerUri, 'declare const pair: Model.Pair<string>;');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
