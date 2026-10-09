import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

function result(elements = []) {
    return {
        events: [], pressEvents: [], loops: [], ifs: [], content: {},
        contextEdits: [], injection: [], bindings: [], elements,
    };
}

test('HTML parser merges template events, content and element metadata', () => {
    const main = result([{
        name: 'button', ids: ['first'], tags: { button: 1 }, isArray: false,
        positions: [1],
    }]);
    main.events.push('click');
    main.content.title = 'First';
    const next = result([{
        name: 'button', ids: ['first', 'second'], tags: { button: 1 }, isArray: false,
        positions: [2],
    }, {
        name: 'input', ids: ['field'], tags: { input: 1 }, isArray: false,
        positions: [3],
    }]);
    next.events.push('change');
    next.content.subtitle = 'Second';

    ParserHtml.mergeTemplateResult(main, next);
    assert.deepEqual(main.events, ['click', 'change']);
    assert.deepEqual(main.content, { title: 'First', subtitle: 'Second' });
    assert.equal(main.elements.length, 2);
    assert.deepEqual(main.elements[0].ids, ['first', 'second']);
    assert.deepEqual(main.elements[0].positions, [1, 2]);
    assert.equal(main.elements[0].tags.button, 2);
    assert.equal(main.elements[0].isArray, true);
});
