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

const uri = 'file:///D:/round149/composition.lib.avt';
const build = {
    npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
    namespaces: [],
    getNamespaceForUri: () => '', getNpmReplacementName: () => '',
};
function parse(version, content) {
    const document = TextDocument.create(uri, 'typescript', version, content);
    return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
}

test('le modèle conserve les unions, intersections, tableaux et opérateurs de type imbriqués', () => {
    const model = parse(1, 'export type Value<T> = (Readonly<T> & { id: string }) | null;\nexport type Keys<T> = readonly (keyof T)[];');
    const value = model.aliases.Value.type;
    assert.equal(value.kind, 'union');
    assert.deepEqual(value.nested.map(part => part.kind), ['intersection', 'literal']);
    assert.deepEqual(value.nested[0].nested.map(part => part.kind), ['type', 'typeLiteral']);
    assert.equal(value.nested[0].nested[0].value, 'Readonly');
    assert.equal(value.nested[0].nested[0].genericValue[0].value, 'T');
    assert.equal(value.nested[0].nested[1].nested[0].kind, 'string');

    const keys = model.aliases.Keys.type;
    assert.equal(keys.kind, 'typeOperator');
    assert.equal(keys.value, 'readonly');
    assert.equal(keys.nested[0].kind, 'typeOperator');
    assert.equal(keys.nested[0].value, 'keyof');
    assert.equal(keys.nested[0].isArray, true);
    assert.deepEqual(model.errors, []);
});

test('une édition remplace la composition du type sans réutiliser les anciennes branches', () => {
    const first = parse(2, 'export type Result = string | number;');
    assert.deepEqual(first.aliases.Result.type.nested.map(part => part.kind), ['string', 'number']);
    const second = parse(3, 'export type Result = { ok: boolean } & { code: number };');
    assert.notEqual(first, second);
    assert.equal(second.aliases.Result.type.kind, 'intersection');
    assert.deepEqual(second.aliases.Result.type.nested.map(part => part.kind), ['typeLiteral', 'typeLiteral']);
    assert.deepEqual(second.aliases.Result.type.nested.map(part => part.nested[0].kind), ['boolean', 'number']);
    assert.deepEqual(second.errors, []);
});

test('les signatures fonction et constructeur conservent leurs paramètres et types de retour', () => {
    const model = parse(4, 'export class Widget {}\nexport type Factory = (name: string, flags: number[]) => Widget;\nexport type WidgetClass = new (name: string) => Widget;\nexport type WidgetType = typeof Widget;');
    const factory = model.aliases.Factory.type;
    assert.equal(factory.kind, 'function');
    assert.equal(factory.fctType.parameters.name.kind, 'string');
    assert.equal(factory.fctType.parameters.flags.kind, 'number');
    assert.equal(factory.fctType.parameters.flags.isArray, true);
    assert.equal(factory.fctType.return.value, 'Widget');
    assert.deepEqual(factory.nested.map(part => part.kind), ['string', 'number', 'type']);

    const constructor = model.aliases.WidgetClass.type;
    assert.equal(constructor.kind, 'constructor');
    assert.equal(constructor.fctType.parameters.name.kind, 'string');
    assert.equal(constructor.fctType.return.value, 'Widget');
    const query = model.aliases.WidgetType.type;
    assert.equal(query.kind, 'typeOperator');
    assert.equal(query.value, 'typeof');
    assert.equal(query.nested[0].value, 'Widget');
    assert.deepEqual(model.errors, []);
});
