import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { TypeInfo } = await loadServerModule('language-services/ts/parser/TypeInfo.ts');

function typeInfo(source) {
    const file = ts.createSourceFile('types.ts', `type Value = ${source};`, ts.ScriptTarget.Latest, true);
    return new TypeInfo(file.statements[0].type);
}

test('type parser recognizes primitive, literal, union and intersection types', () => {
    assert.equal(new TypeInfo(null).kind, 'notype');
    assert.equal(typeInfo('string').getFullTxt(), 'string');
    assert.equal(typeInfo('42').getFullTxt(), '42');
    assert.equal(typeInfo('string | number').getFullTxt(), 'string | number');
    assert.equal(typeInfo('A & B').getFullTxt(), 'A & B');
});

test('type parser preserves generic references, arrays, tuples and indexed access', () => {
    const generic = typeInfo('Map<string, number>');
    assert.equal(generic.kind, 'type');
    assert.equal(generic.getFullTxt(), 'Map<string, number>');
    const array = typeInfo('Widget[]');
    assert.equal(array.isArray, true);
    assert.equal(array.value, 'Widget');
    assert.equal(typeInfo('[string, number]').getFullTxt(), '[string, number]');
    assert.equal(typeInfo('T["id"]').getFullTxt(), 'T["id"]');
});
