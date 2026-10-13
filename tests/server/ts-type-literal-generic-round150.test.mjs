import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

const uri = 'file:///D:/round150/type-literal-generic.lib.avt';
const build = {
    npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
    namespaces: [], getNamespaceForUri: () => '', getNpmReplacementName: () => '',
};
function parse(version, source) {
    const document = TextDocument.create(uri, 'typescript', version, source);
    return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
}

test('les alias conservent les littéraux et arguments génériques imbriqués avec leurs plages', () => {
    const source = 'export type Response = Promise<Map<string, "ready" | 404 | false>>;';
    const model = parse(1, source);
    const outer = model.aliases.Response.type;
    assert.equal(outer.kind, 'type');
    assert.equal(outer.value, 'Promise');
    assert.equal(outer.genericValue[0].value, 'Map');
    const [key, value] = outer.genericValue[0].genericValue;
    assert.equal(key.kind, 'string');
    assert.equal(value.kind, 'union');
    assert.deepEqual(value.nested.map(part => [part.kind, part.value]), [
        ['literal', '"ready"'], ['literal', '404'], ['literal', 'false'],
    ]);
    assert.equal(source.slice(outer.start, outer.end), 'Promise<Map<string, "ready" | 404 | false>>');
    assert.equal(source.slice(value.start, value.end), '"ready" | 404 | false');
    assert.deepEqual(model.errors, []);
});

test('une édition remplace les valeurs littérales et les arguments génériques sans état périmé', () => {
    parse(2, 'export type Response = Promise<Map<string, "ready" | 404>>;');
    const source = 'export type Response = ReadonlyArray<{ status: "done"; count: number }>;';
    const model = parse(3, source);
    const response = model.aliases.Response.type;
    assert.equal(response.value, 'ReadonlyArray');
    assert.equal(response.genericValue.length, 1);
    const record = response.genericValue[0];
    assert.equal(record.kind, 'typeLiteral');
    assert.deepEqual(record.nested.map(part => [part.kind, part.value]), [
        ['literal', '"done"'], ['number', ''],
    ]);
    assert.equal(source.slice(record.start, record.end), '{ status: "done"; count: number }');
    assert.deepEqual(model.errors, []);
});
