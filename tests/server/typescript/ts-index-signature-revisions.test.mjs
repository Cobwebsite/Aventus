import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les diagnostics d’un accès indexé suivent le type et la clé de la signature distante', () => {
    const modelUri = 'file:///D:/round253/index-model.lib.avt';
    const consumerUri = 'file:///D:/round253/index-consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export interface Dictionary { [key: string]: number } }',
        [consumerUri]: 'declare const values: Model.Dictionary;\nconst count: number = values["count"];',
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
        edit(modelUri, 'namespace Model { export interface Dictionary { [key: string]: string } }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'count', line: 1 }]);
        edit(consumerUri, '\ndeclare const values: Model.Dictionary;\nconst count: string = values["count"];');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export interface Dictionary { [key: number]: string } }');
        assert.deepEqual(diagnostics(), [{ code: 7015, text: '"count"', line: 2 }]);
        edit(consumerUri, '\ndeclare const values: Model.Dictionary;\nconst count: string = values[0];');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
