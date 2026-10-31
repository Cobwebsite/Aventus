import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('Date natif est diagnostiqué selon la portée après édition, sans confondre texte et symbole local', () => {
    const uri = 'file:///D:/test/ts-forbidden-scope-round142.lib.avt';
    let source = [
        'const label = "Date"; // Date',
        'const first: Date = new Date();',
        'function local(Date: { now(): number }) { return Date.now(); }',
        'const last = Date.now();',
    ].join('\n');
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

    function forbidden() {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return service.doValidation({ uri, documentInternal: document })
            .filter(item => item.code === 'forbidden-native-global')
            .map(item => ({ text: document.getText(item.range), start: item.range.start }));
    }

    assert.deepEqual(forbidden(), [
        { text: 'Date', start: { line: 1, character: 13 } },
        { text: 'Date', start: { line: 1, character: 24 } },
        { text: 'Date', start: { line: 3, character: 13 } },
    ]);

    source = source.replace('const last = Date.now();', 'const last = local({ now: () => 1 });');
    version++;
    assert.deepEqual(forbidden(), [
        { text: 'Date', start: { line: 1, character: 13 } },
        { text: 'Date', start: { line: 1, character: 24 } },
    ]);
});
