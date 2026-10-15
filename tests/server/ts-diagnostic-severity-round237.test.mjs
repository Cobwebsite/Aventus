import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les diagnostics inutiles restent des suggestions et les erreurs suivent les corrections successives', () => {
    const uri = 'file:///D:/round237/diagnostics.lib.avt';
    let source = 'function compute() { const unused = 1; const value: string = 42; return value; }';
    let version = 1;
    const host = {
        getCompilationSettings: () => ({ target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true, noUnusedLocals: true }),
        getScriptFileNames: () => [uri], getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => String(version),
        getScriptSnapshot: name => {
            const content = name === uri ? source : ts.sys.readFile(name);
            return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
        },
        getCurrentDirectory: () => '/', getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        fileExists: name => name === uri || ts.sys.fileExists(name),
        readFile: name => name === uri ? source : ts.sys.readFile(name), readDirectory: ts.sys.readDirectory,
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    function diagnostics() {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return service.doValidation({ uri, documentInternal: document }).map(item => ({
            text: document.getText(item.range), message: item.message,
            severity: item.severity, tags: item.tags, line: item.range.start.line,
        }));
    }
    function edit(next) { source = next; version++; }
    try {
        let result = diagnostics();
        assert.ok(result.some(item => item.text === 'unused' && item.severity === 4 && item.tags?.includes(1)));
        assert.ok(result.some(item => item.text === 'value' && item.severity === 1 && /not assignable/.test(item.message)));

        edit('\nfunction compute() { const unused = 1; const value: string = "ok"; return value; }');
        result = diagnostics();
        assert.deepEqual(result.map(item => [item.text, item.line, item.severity, item.tags]), [['unused', 1, 4, [1]]]);

        edit('function compute() { const value: string = "ok"; return value; }');
        assert.deepEqual(diagnostics(), []);

        edit('function compute() { const value: string = ; return value; }');
        result = diagnostics();
        assert.ok(result.some(item => item.severity === 1 && /Expression expected/.test(item.message)));
    } finally { languageService.dispose(); }
});
