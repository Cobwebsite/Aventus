import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { TypeInfo }] = await loadServerModules(['manifest/Manifest.ts', 'language-services/ts/parser/TypeInfo.ts']);
const manifest = Object.create(Manifest.prototype);

const simple = (kind, value) => ({ kind, value, isArray: false });

test('manifest documentation formats nested composite TypeScript types', () => {
    const union = { kind: 'union', nested: [simple('string'), simple('number')], isArray: true };
    assert.equal(manifest.getTypeTxt(union), 'string | number[]');
    assert.equal(manifest.getTypeTxt({ kind: 'tuple', nested: [simple('string'), simple('boolean')], isArray: false }), '[string, boolean]');
    assert.equal(manifest.getTypeTxt({ kind: 'intersection', nested: [simple('A'), simple('B')], isArray: false }), 'A & B');
    assert.equal(manifest.getTypeTxt({ kind: 'indexedAccess', nested: [simple('Record'), simple('literal', '"name"')], isArray: false }), 'Record["name"]');
    assert.equal(manifest.getTypeTxt({
        kind: 'conditional', isArray: false,
        conditionalType: { check: simple('T'), extends: simple('string'), true: simple('number'), false: simple('boolean') },
    }), 'T extends string ? number : boolean');
    assert.equal(manifest.getTypeTxt({
        kind: 'mappedType', isArray: false,
        mappedType: { parameterName: 'K', parameterType: simple('Keys'), modifier: '?', type: simple('string') },
    }), '{ [K in Keys]?: string }');
});

test('manifest preserves keyof, typeof and infer from TypeScript types', () => {
    const parse = source => {
        const file = ts.createSourceFile('types.ts', `type Value<T> = ${source};`, ts.ScriptTarget.Latest, true);
        return new TypeInfo(file.statements[0].type);
    };
    assert.equal(manifest.getTypeTxt(parse('keyof T')), 'keyof T');
    assert.equal(manifest.getTypeTxt(parse('typeof value')), 'typeof value');
    assert.equal(manifest.getTypeTxt(parse('infer U')), 'infer U');
    assert.equal(manifest.getTypeTxt(parse('T extends string ? number : never')), 'T extends string ? number : never');
});

test('manifest Markdown describes static properties, methods with defaults, and CSS literal chains', () => {
    const ast = ts.createSourceFile('card.ts', 'class Card { open(force?: boolean, count: number = 2): string { return "ok"; } static reset(): void {} }', ts.ScriptTarget.Latest, true);
    const [method, staticMethod] = ast.statements[0].members;
    const output = manifest.generateDescription({
        fullName: 'Demo.Card', class: {}, attributes: [], props: [],
        propsStatic: [{ name: 'total', type: simple('number') }],
        methods: [{ name: 'open', node: method, documentation: { definitions: ['Opens card'] } }],
        methodsStatic: [{ name: 'reset', node: staticMethod }],
        slots: {}, cssProperties: [{ name: '--tone', type: 'literal', typeValues: ['warm', 'cool'], chainValues: ['base', 'accent'], documentation: 'Tone value' }],
    });
    assert.match(output, /### \*\*Static Properties:\*\*[\s\S]*total: number/);
    assert.match(output, /### \*\*Methods:\*\*[\s\S]*open\(force\?: boolean, count: number = 2\): string\*\* - Opens card/);
    assert.match(output, /### \*\*Static Methods:\*\*[\s\S]*reset\(\): void/);
    assert.match(output, /--tone: warm \| cool\*\* - Tone value\n   - base < accent/);
});
