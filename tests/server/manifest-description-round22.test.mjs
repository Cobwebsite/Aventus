import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Manifest } = await loadServerModule('manifest/Manifest.ts');
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
