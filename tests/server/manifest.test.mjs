import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Manifest } = await loadServerModule('manifest/Manifest.ts');
const manifest = Object.create(Manifest.prototype);

test('manifest formats common types for generated documentation', () => {
    assert.equal(manifest.getTypeTxt({ kind: 'string', isArray: false }), 'string');
    assert.equal(manifest.getTypeTxt({ kind: 'number', isArray: true }), 'number[]');
    assert.equal(manifest.getTypeTxt({
        kind: 'type', value: 'Map', genericValue: [
            { kind: 'string', isArray: false }, { kind: 'number', isArray: false },
        ], isArray: false,
    }), 'Map<string, number>');
    assert.equal(manifest.getTypeTxt({
        kind: 'union', nested: [
            { kind: 'literal', value: '"small"', isArray: false },
            { kind: 'literal', value: '"large"', isArray: false },
        ], isArray: false,
    }), '"small" | "large"');
});

test('manifest description includes component docs, attributes, slots and CSS variables', () => {
    const description = manifest.generateDescription({
        fullName: 'Demo.Card',
        class: { documentation: { definitions: ['A reusable card.'] } },
        attributes: [{ name: 'size', type: { kind: 'string', isArray: false }, documentation: { definitions: ['Card size'] } }],
        props: [], propsStatic: [], methods: [], methodsStatic: [],
        slots: { header: { doc: 'Heading content' } },
        cssProperties: [{ name: '--card-color', type: 'color', documentation: 'Card foreground' }],
    });
    assert.match(description, /## Demo\.Card/);
    assert.match(description, /A reusable card/);
    assert.match(description, /size: string/);
    assert.match(description, /Heading content/);
    assert.match(description, /--card-color: color/);
});
