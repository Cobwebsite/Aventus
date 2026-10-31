import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('le diagnostic Date natif porte un code et une plage exacts et disparaît après remplacement', () => {
    const uri = 'file:///D:/test/ts-forbidden-diagnostics-round139.lib.avt';
    let source = 'const first = new Date();\nconst second = Date.now();';
    let version = 1;
    const host = {
        getCompilationSettings: () => ({ target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true }),
        getScriptFileNames: () => [uri],
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: name => name === uri ? String(version) : '1',
        getScriptSnapshot: name => {
            const content = name === uri ? source : ts.sys.readFile(name);
            return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
        },
        getCurrentDirectory: () => '/',
        getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        fileExists: name => name === uri || ts.sys.fileExists(name),
        readFile: name => name === uri ? source : ts.sys.readFile(name),
        readDirectory: ts.sys.readDirectory,
    };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = ts.createLanguageService(host);

    function diagnostics() {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return { document, items: service.doValidation({ uri, documentInternal: document }) };
    }

    let result = diagnostics();
    let forbidden = result.items.filter(item => item.code === 'forbidden-native-global');
    assert.equal(forbidden.length, 2);
    assert.deepEqual(forbidden.map(item => result.document.getText(item.range)), ['Date', 'Date']);
    assert.deepEqual(forbidden.map(item => item.range.start), [
        { line: 0, character: 18 }, { line: 1, character: 15 },
    ]);
    assert.ok(forbidden.every(item => item.severity === 1 && item.source === 'Aventus Ts'));
    assert.ok(forbidden.every(item => item.message.includes('Aventus.Date')));

    source = 'function use(Date: { now(): number }) { return Date.now(); }';
    version++;
    result = diagnostics();
    forbidden = result.items.filter(item => item.code === 'forbidden-native-global');
    assert.deepEqual(forbidden, []);
});
