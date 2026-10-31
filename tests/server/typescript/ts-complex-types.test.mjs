import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

const build = {
    npmBuilder: { unregister() {} },
    buildConfig: {}, hasNpmOutput: false,
    getNamespaceForUri: () => '', getNpmReplacementName: () => '',
};
const uri = 'file:///D:/round144/complex.lib.avt';

function parse(source, version) {
    const document = TextDocument.create(uri, 'typescript', version, source);
    return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
}

test('le modèle TypeScript conserve les branches des types conditionnels, mappés et indexés', () => {
    const model = parse('export type Values<T> = T extends string ? [T, number] : T[keyof T];\nexport type Optional<T> = { [K in keyof T]?: T[K] };', 1);
    const values = model.aliases.Values.type;
    assert.equal(values.kind, 'conditional');
    assert.deepEqual([
        values.conditionalType.check.kind,
        values.conditionalType.extends.kind,
        values.conditionalType.true.kind,
        values.conditionalType.false.kind,
    ], ['type', 'string', 'tuple', 'indexedAccess']);
    assert.deepEqual(values.conditionalType.true.nested.map(part => [part.kind, part.value]), [
        ['type', 'T'], ['number', ''],
    ]);
    assert.deepEqual(values.conditionalType.false.nested.map(part => part.kind), ['type', 'typeOperator']);
    const optional = model.aliases.Optional.type;
    assert.equal(optional.kind, 'mappedType');
    assert.equal(optional.mappedType.parameterName, 'K');
    assert.equal(optional.mappedType.parameterType.value, 'keyof');
    assert.equal(optional.mappedType.type.kind, 'indexedAccess');
    assert.equal(optional.mappedType.modifier, '?');
    assert.deepEqual(model.errors, []);
});

test('une édition remplace un alias complexe sans conserver son ancienne branche', () => {
    const previous = parse('export type Choice<T> = T extends string ? T[] : never;', 2);
    assert.equal(previous.aliases.Choice.type.kind, 'conditional');
    const next = parse('export type Choice<T> = { [K in keyof T]-?: T[K] };', 3);
    assert.notEqual(next, previous);
    assert.equal(next.aliases.Choice.type.kind, 'mappedType');
    assert.equal(next.aliases.Choice.type.mappedType.modifier, '-');
    assert.equal(next.aliases.Choice.type.conditionalType, undefined);
    assert.deepEqual(next.errors, []);
});
