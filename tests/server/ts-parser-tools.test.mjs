import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { buildJSON, getArg, hasFlag } = await loadServerModule('language-services/ts/parser/tools.ts');

function expression(source) {
    const file = ts.createSourceFile('fixture.ts', `const value = ${source};`, ts.ScriptTarget.Latest, true);
    return file.statements[0].declarationList.declarations[0].initializer;
}

test('TS parser tools classify literals, identifiers, calls and functions', () => {
    assert.deepEqual(getArg(expression('"text"')), { type: 'string', value: '"text"' });
    assert.deepEqual(getArg(expression('42')), { type: 'number', value: '42' });
    assert.deepEqual(getArg(expression('false')), { type: 'boolean', value: 'false' });
    assert.deepEqual(getArg(expression('config.value')), { type: 'identifier', value: 'config.value' });
    assert.deepEqual(getArg(expression('create()')), { type: 'call', value: 'create()' });
    assert.deepEqual(getArg(expression('() => 1')), { type: 'call', value: '() => 1' });
    assert.equal(getArg(expression('null')), null);
});

test('TS parser tools serialize nested object and array literals', () => {
    const source = '{ title: "hi", enabled: true, count: 2, nested: { code: "x" }, items: [1, false, { ok: true }] }';
    const result = JSON.parse(buildJSON(expression(source)));
    assert.deepEqual(result, {
        title: '"hi"',
        enabled: true,
        count: 2,
        nested: { code: '"x"' },
        items: [1, false, { ok: true }],
    });
    assert.deepEqual(getArg(expression('[1, "a"]')), { type: 'array', value: '[1,"\\"a\\""]' });
});

test('TS parser tools normalize quoted property names at every object level', () => {
    const result = JSON.parse(buildJSON(expression('{ "autoInit": false, nested: { "enabled": true }, "items": [{ "count": 2 }] }')));
    assert.deepEqual(result, { autoInit: false, nested: { enabled: true }, items: [{ count: 2 }] });
});

test('TS parser tools detect combined flags', () => {
    assert.equal(hasFlag(0b1010, 0b0010), true);
    assert.equal(hasFlag(0b1010, 0b0100), false);
});
