import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

function fragment(label, count, ids) {
    return {
        events: [`${label}-event`], pressEvents: [`${label}-press`],
        loops: [`${label}-loop`], ifs: [`${label}-if`],
        content: { shared: label, [label]: count },
        contextEdits: [`${label}-context`], injection: [`${label}-injection`],
        bindings: [`${label}-binding`],
        elements: [{ name: 'field', ids, tags: { input: count }, isArray: false, positions: [count] }],
    };
}

test('trois fragments HTML fusionnés conservent l’ordre des actions et cumulent les occurrences', () => {
    const first = fragment('first', 1, ['one']);
    const second = fragment('second', 2, ['one', 'two']);
    const third = fragment('third', 3, ['two', 'three']);
    ParserHtml.mergeTemplateResult(first, second);
    ParserHtml.mergeTemplateResult(first, third);

    for (const [field, suffix] of Object.entries({
        events: 'event', pressEvents: 'press', loops: 'loop', ifs: 'if',
        contextEdits: 'context', injection: 'injection', bindings: 'binding',
    })) {
        assert.deepEqual(first[field], [`first-${suffix}`, `second-${suffix}`, `third-${suffix}`]);
    }
    assert.deepEqual(first.content, { shared: 'third', first: 1, second: 2, third: 3 });
    assert.deepEqual(first.elements, [{
        name: 'field', ids: ['one', 'two', 'three'], tags: { input: 6 },
        isArray: true, positions: [1, 2, 3],
    }]);
    assert.deepEqual(second.elements[0].ids, ['one', 'two']);
    assert.deepEqual(third.elements[0].ids, ['two', 'three']);
});
