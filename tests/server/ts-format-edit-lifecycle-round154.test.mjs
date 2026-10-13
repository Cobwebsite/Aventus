import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('formatage TS après édition : plage et préférence de point-virgule suivent le document courant', async () => {
    const uri = 'file:///D:/test/round154-format.lib.avt';
    const otherUri = 'file:///D:/test/round154-other.lib.avt';
    let source = 'const first={a:1,b:2}\nconst untouched={x:3,y:4}\n';
    let version = 1;
    const otherSource = 'const other={z:5}\n';
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022 }),
        getScriptFileNames: () => [uri, otherUri],
        getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: name => name === uri ? String(version) : '1',
        getScriptSnapshot: name => name === uri ? ts.ScriptSnapshot.fromString(source) : name === otherUri ? ts.ScriptSnapshot.fromString(otherSource) : undefined,
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: name => name === uri || name === otherUri,
        readFile: name => name === uri ? source : name === otherUri ? otherSource : undefined,
        readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageServiceNamespace = languageService;
    const options = { tabSize: 4, insertSpaces: true };
    async function formatFirstLine(semiColon) {
        const document = TextDocument.create(uri, 'typescript', version, source);
        const file = { uri, documentInternal: document, documentUser: document };
        const range = { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } };
        const edits = await service.format(file, range, options, semiColon);
        assert.ok(edits.length > 0);
        assert.ok(edits.every(edit => document.offsetAt(edit.range.end) <= source.indexOf('\n') + 1));
        return TextDocument.applyEdits(document, edits);
    }
    try {
        let output = await formatFirstLine(true);
        assert.match(output.split('\n')[0], /a: 1, b: 2.*;$/);
        assert.equal(output.split('\n')[1], 'const untouched={x:3,y:4}');

        source = 'const changed={nested:{value:7}}\nconst untouched={x:3,y:4}\n';
        version++;
        output = await formatFirstLine(false);
        assert.match(output.split('\n')[0], /changed = \{ nested: \{ value: 7 \} \}/);
        assert.doesNotMatch(output.split('\n')[0], /;$/);
        assert.doesNotMatch(output, /first|a: 1/);
        assert.equal(output.split('\n')[1], 'const untouched={x:3,y:4}');
        assert.equal(otherSource, 'const other={z:5}\n');
    } finally {
        languageService.dispose();
    }
});
