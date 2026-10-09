import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/LanguageService.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

let sequence = 0;
function model(source) {
    const uri = `file:///D:/test/compile-round2-${++sequence}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const build = {
        module: 'Demo', namespaces: [], isCoreBuild: false, hasNpmOutput: false,
        npmBuilder: { unregister() {} }, buildConfig: {},
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const parsed = ParserTs.parse(file, false, build);
    return { parsed, file: { file, fileParsed: parsed, build } };
}

test('simple exported TypeScript class compiles to script and visible declaration', () => {
    const { parsed, file } = model('export class Greeter { greet() { return "hello"; } }');
    const compiled = AventusTsLanguageService.compileTs(parsed.classes.Greeter, file);
    assert.match(compiled.compiled, /Greeter/);
    assert.match(compiled.compiled, /greet/);
    assert.match(compiled.docVisible, /class Greeter/);
    assert.equal(compiled.docInvisible, '');
    assert.equal(compiled.uri, file.file.uri);
});

test('private TypeScript class keeps its declaration out of the visible export', () => {
    const { parsed, file } = model('class Hidden { value = 1; }');
    const compiled = AventusTsLanguageService.compileTs(parsed.classes.Hidden, file);
    assert.match(compiled.compiled, /Hidden/);
    assert.equal(compiled.docVisible, '');
    assert.match(compiled.docInvisible, /class Hidden/);
});
