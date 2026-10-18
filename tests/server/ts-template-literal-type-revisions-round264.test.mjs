import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('template literal types refresh consumer diagnostics after producer and consumer revisions', () => {
    const modelUri = 'file:///D:/round264/template-model.lib.avt';
    const consumerUri = 'file:///D:/round264/template-consumer.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export type Action = "open" | "close"; export type Event = `on:${Action}`; }',
        [consumerUri]: 'const first: Model.Event = "on:open"; const second: Model.Event = "on:close";',
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
        edit(modelUri, 'namespace Model { export type Action = "open" | "save"; export type Event = `on:${Action}`; }');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'second', line: 0 }]);
        edit(consumerUri, '\nconst first: Model.Event = "on:open"; const second: Model.Event = "on:save";');
        assert.deepEqual(diagnostics(), []);
        edit(modelUri, 'namespace Model { export type Action = "delete"; export type Event = `after:${Action}`; }');
        assert.deepEqual(diagnostics(), [
            { code: 2322, text: 'first', line: 1 },
            { code: 2322, text: 'second', line: 1 },
        ]);
        edit(consumerUri, '\nconst first: Model.Event = "after:delete";');
        assert.deepEqual(diagnostics(), []);
    } finally { languageService.dispose(); }
});
