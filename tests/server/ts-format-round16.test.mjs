import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture(sources) {
    const entries = Object.fromEntries(Object.entries(sources).map(([name, source]) => {
        const uri = `file:///D:/test/round16-${name}.lib.avt`;
        const document = TextDocument.create(uri, 'typescript', 1, source);
        return [name, { uri, document, file: { uri, documentInternal: document, documentUser: document } }];
    }));
    const byUri = Object.fromEntries(Object.values(entries).map(entry => [entry.uri, entry]));
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022 }),
        getScriptFileNames: () => Object.keys(byUri),
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: () => '1',
        getScriptSnapshot: uri => byUri[uri] ? ts.ScriptSnapshot.fromString(byUri[uri].document.getText()) : undefined,
        getCurrentDirectory: () => '/',
        getDefaultLibFileName: () => '',
        fileExists: uri => !!byUri[uri],
        readFile: uri => byUri[uri]?.document.getText(),
        readDirectory: () => [],
    };
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageServiceNamespace = ts.createLanguageService(host);
    return { service, entries };
}

const options = { tabSize: 4, insertSpaces: true };

test('TypeScript formatting edits only the selected file when several files are loaded', async () => {
    const { service, entries } = fixture({ first: 'const first={a:1,b:2}', second: 'const second={x:3,y:4}' });
    const { first, second } = entries;
    const range = { start: first.document.positionAt(0), end: first.document.positionAt(first.document.getText().length) };
    const edits = await service.format(first.file, range, options);
    const result = TextDocument.applyEdits(first.document, edits);
    assert.ok(edits.length > 0);
    assert.match(result, /a: 1/);
    assert.match(result, /b: 2/);
    assert.equal(second.document.getText(), 'const second={x:3,y:4}');
});

test('TypeScript formatting does not edit text beyond the requested range', async () => {
    const source = 'const first={a:1,b:2}\nconst second={x:3,y:4}';
    const { service, entries } = fixture({ ranged: source });
    const { ranged } = entries;
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: source.indexOf('\n') } };
    const edits = await service.format(ranged.file, range, options);
    const result = TextDocument.applyEdits(ranged.document, edits);
    assert.ok(edits.length > 0);
    assert.equal(result.split('\n')[1], 'const second={x:3,y:4}');
    assert.match(result.split('\n')[0], /a: 1/);
});
