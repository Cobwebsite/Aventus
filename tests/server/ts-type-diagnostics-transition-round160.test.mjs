import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les incompatibilités de types suivent le déplacement puis la correction de la valeur', () => {
    const uri = 'file:///D:/round160/type-diagnostics.lib.avt';
    let source = '';
    let version = 0;
    const host = {
        getCompilationSettings: () => ({ target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
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
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = ts.createLanguageService(host);
    const validate = text => {
        source = text;
        version++;
        const document = TextDocument.create(uri, 'typescript', version, source);
        return service.doValidation({ uri, documentInternal: document }).map(item => ({
            message: item.message, text: document.getText(item.range), line: item.range.start.line,
        }));
    };
    try {
        const first = validate('const label: string = 42;');
        assert.ok(first.some(item => /not assignable to type 'string'/.test(item.message) && item.text === 'label'));

        const moved = validate('\nconst label: string = 42;\nconst count: number = "wrong";');
        assert.equal(moved.filter(item => /not assignable to type/.test(item.message)).length, 2);
        assert.ok(moved.some(item => item.text === 'label' && item.line === 1));
        assert.ok(moved.some(item => item.text === 'count' && item.line === 2));

        const fixed = validate('const label: string = "ok";\nconst count: number = 42;');
        assert.deepEqual(fixed, []);
    } finally { service.languageService.dispose(); }
});
