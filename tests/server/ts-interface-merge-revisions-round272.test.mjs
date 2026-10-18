import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('merged remote interface declarations update consumer diagnostics across three files', () => {
    const baseUri = 'file:///D:/round272/base.lib.avt';
    const extensionUri = 'file:///D:/round272/extension.lib.avt';
    const consumerUri = 'file:///D:/round272/consumer.lib.avt';
    const sources = {
        [baseUri]: 'namespace Model { export interface Options { title: string; } }',
        [extensionUri]: 'namespace Model { export interface Options { enabled?: boolean; } }',
        [consumerUri]: 'const options: Model.Options = { title: "Hello" };\nconst flag: boolean | undefined = options.enabled;',
    };
    const versions = { [baseUri]: 1, [extensionUri]: 1, [consumerUri]: 1 };
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
        edit(extensionUri, 'namespace Model { export interface Options { enabled: boolean; } }');
        assert.deepEqual(diagnostics(), [{ code: 2741, text: 'options', line: 0 }]);
        edit(consumerUri, 'const options: Model.Options = { title: "Hello", enabled: true };\nconst flag: boolean = options.enabled;');
        assert.deepEqual(diagnostics(), []);
        edit(extensionUri, 'namespace Model { export interface Options { retryCount: number; } }');
        assert.deepEqual(diagnostics(), [
            { code: 2353, text: 'enabled', line: 0 },
            { code: 2339, text: 'enabled', line: 1 },
        ]);
        edit(consumerUri, 'const options: Model.Options = { title: "Hello", retryCount: 2 };\nconst count: number = options.retryCount;');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
