import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('TemplateContext inherits parent data and prints nullish values as empty text', () => {
    const { TemplateContext } = loadRuntime();
    const component = {};
    const parent = new TemplateContext(component, { title: 'parent' });
    const child = new TemplateContext(component, { count: 2 }, parent);
    assert.equal(child.data.title, 'parent');
    assert.equal(child.data.count, 2);
    assert.equal(child.print(null), '');
    assert.equal(child.print(undefined), '');
    assert.equal(child.print(0), '0');
    child.destructor();
    parent.destructor();
});

test('TemplateContext chooses an unused loop index name', () => {
    const { TemplateContext } = loadRuntime();
    const context = new TemplateContext({}, { index0: 'taken', index1: 'taken' });
    assert.equal(context.registerIndex(), 'index2');
    context.destructor();
});
