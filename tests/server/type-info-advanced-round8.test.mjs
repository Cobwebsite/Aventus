import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { TypeInfo } = await loadServerModule('language-services/ts/parser/TypeInfo.ts');

function parseType(source) {
    const file = ts.createSourceFile('types.ts', `type Value<T> = ${source};`, ts.ScriptTarget.Latest, true);
    return new TypeInfo(file.statements[0].type);
}

test('type model retains mapped and inferred type structure', () => {
    const mapped = parseType('{ [K in keyof T]?: T[K] }');
    assert.equal(mapped.kind, 'mappedType');
    assert.equal(mapped.mappedType.parameterName, 'K');
    assert.equal(mapped.mappedType.parameterType.kind, 'typeOperator');
    assert.equal(mapped.mappedType.type.kind, 'indexedAccess');
    assert.equal(parseType('infer U').getFullTxt(), 'infer U');
});

test('type text currently substitutes typeof for keyof', () => {
    assert.equal(parseType('typeof value').getFullTxt(), 'typeof value');
    assert.equal(parseType('keyof T').getFullTxt(), 'typeof T');
});

test('conditional type text currently interpolates the extends method itself', () => {
    const conditional = parseType('T extends string ? number : never');
    assert.equal(conditional.kind, 'conditional');
    assert.equal(conditional.conditionalType.extends.getFullTxt(), 'string');
    assert.notEqual(conditional.getFullTxt(), 'T extends string ? number : never');
    assert.match(conditional.getFullTxt(), /getFullTxt/);
});
