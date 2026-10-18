import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('remote accessor write diagnostics follow setter additions and removals', () => {
    const modelUri = 'file:///D:/round279/accessor-model.lib.avt';
    const userUri = 'file:///D:/round279/accessor-user.lib.avt';
    const sources = {
        [modelUri]: 'namespace Model { export class Counter { get count(): number { return 1; } } }',
        [userUri]: 'declare const counter: Model.Counter;\ncounter.count = 2;\nconst read: number = counter.count;',
    };
    const versions = { [modelUri]: 1, [userUri]: 1 };
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
        const document = TextDocument.create(userUri, 'typescript', versions[userUri], sources[userUri]);
        return service.doValidation({ uri: userUri, documentInternal: document }).map(item => ({
            code: item.code, text: document.getText(item.range), line: item.range.start.line,
        }));
    };
    try {
        assert.deepEqual(diagnostics(), [{ code: 2540, text: 'count', line: 1 }]);

        edit(modelUri, 'namespace Model { export class Counter { get count(): number { return 1; } set count(value: number) {} } }');
        assert.deepEqual(diagnostics(), []);

        edit(userUri, '\n\ndeclare const counter: Model.Counter;\ncounter.count = "wrong";\nconst read: number = counter.count;');
        assert.deepEqual(diagnostics(), [{ code: 2322, text: 'counter.count', line: 3 }]);

        edit(userUri, '\n\ndeclare const counter: Model.Counter;\ncounter.count = 3;\nconst read: number = counter.count;');
        assert.deepEqual(diagnostics(), []);

        edit(modelUri, 'namespace Model { export class Counter { get count(): number { return 1; } } }');
        assert.deepEqual(diagnostics(), [{ code: 2540, text: 'count', line: 3 }]);
    } finally { languageService.dispose(); }
});
