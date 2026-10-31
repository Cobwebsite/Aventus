import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('remote generic default follows model revisions without an explicit type argument', () => {
    const modelUri = 'file:///D:/round281/generic-model.lib.avt';
    const consumerUri = 'file:///D:/round281/generic-consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export interface Box<T = string> { value: T } }',
        [consumerUri]: 'const box: Model.Box = { value: "ready" };',
    };
    const versions = { [modelUri]: 1, [consumerUri]: 1 };
    const host = {
        getCompilationSettings: () => ({ noLib: true, strict: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri]),
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
        edit(modelUri, 'namespace Model { export interface Box<T = number> { value: T } }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'value', line: 0 }]);
        edit(consumerUri, '\nconst box: Model.Box = { value: 7 };');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export interface Box<T = boolean> { value: T } }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'value', line: 1 }]);
        edit(consumerUri, '\nconst box: Model.Box = { value: true };');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
