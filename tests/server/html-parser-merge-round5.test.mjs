import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

function result(label) {
    return {
        events: [`${label}-event`],
        pressEvents: [`${label}-press`],
        loops: [`${label}-loop`],
        ifs: [`${label}-if`],
        content: { [label]: label },
        contextEdits: [`${label}-edit`],
        injection: [`${label}-injection`],
        bindings: [`${label}-binding`],
        elements: [],
    };
}

test('HTML template merge carries every generated instruction in source order', () => {
    const first = result('first');
    const second = result('second');
    ParserHtml.mergeTemplateResult(first, second);
    const suffixes = { events: 'event', pressEvents: 'press', loops: 'loop', ifs: 'if', contextEdits: 'edit', injection: 'injection', bindings: 'binding' };
    for (const [field, suffix] of Object.entries(suffixes)) {
        assert.deepEqual(first[field], [`first-${suffix}`, `second-${suffix}`]);
    }
    assert.deepEqual(first.content, { first: 'first', second: 'second' });
});

test('HTML template merge deduplicates element IDs and accumulates tag counts and positions', () => {
    const first = result('first');
    first.elements.push({ name: 'button', ids: ['same'], tags: { button: 1 }, isArray: false, positions: [1] });
    const second = result('second');
    second.elements.push({ name: 'button', ids: ['same', 'other'], tags: { button: 2, input: 1 }, isArray: false, positions: [3, 5] });
    ParserHtml.mergeTemplateResult(first, second);
    assert.deepEqual(first.elements[0], {
        name: 'button', ids: ['same', 'other'], tags: { button: 3, input: 1 }, isArray: true, positions: [1, 3, 5],
    });
});
