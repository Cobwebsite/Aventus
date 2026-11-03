import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

class FakeElement {
    constructor(id) {
        this.attributes = { _id: { value: id } };
        this.tagName = 'INPUT';
        this.listeners = new Map();
        this.attrs = new Map();
    }
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    removeEventListener(type, callback) {
        if(this.listeners.get(type) === callback) this.listeners.delete(type);
    }
    dispatch(type) { this.listeners.get(type)?.({ type, target: this }); }
    setAttribute(name, value) { this.attrs.set(name, value); }
    removeAttribute(name) { this.attrs.delete(name); }
    remove() { this.removed = true; }
}

test('TemplateInstance binds text, attributes, events and two-way input values', () => {
    const timers = [];
    const { Signal, TemplateInstance } = loadRuntime({
        customElements: { get() {}, define() {}, upgrade() {} },
        setTimeout(callback) { timers.push(callback); return timers.length; },
        clearTimeout() {},
    });
    const title = new Signal('first');
    const component = { get title() { return title.value; }, set title(value) { title.value = value; } };
    const text = new FakeElement('text');
    const input = new FakeElement('input');
    const content = {
        firstElementChild: text,
        lastElementChild: input,
        querySelectorAll: () => [text, input],
    };
    const events = [];
    const instance = new TemplateInstance(component, content, {
        content: {
            'text°@HTML': { fct: context => context.comp.title },
            'text°title': { fct: context => context.comp.title },
        },
        events: [{ id: 'input', eventName: 'click', fct: () => events.push('click') }],
        bindings: [{ id: 'input', injectionName: 'value', eventNames: ['change'],
            inject: context => context.comp.title,
            extract: (context, value) => { context.comp.title = value; },
        }],
    }, [], []);
    instance.render();
    assert.equal(text.innerHTML, 'first');
    assert.equal(text.attrs.get('title'), 'first');
    assert.equal(input.value, 'first');
    input.dispatch('click');
    assert.deepEqual(events, ['click']);
    title.value = 'second';
    for(const callback of timers.splice(0)) callback();
    assert.equal(text.innerHTML, 'second');
    assert.equal(text.attrs.get('title'), 'second');
    assert.equal(input.value, 'second');
    input.value = 'edited';
    input.dispatch('change');
    assert.equal(title.value, 'edited');
    for(const callback of timers.splice(0)) callback();
    assert.equal(text.innerHTML, 'edited');
    instance.destructor();
    assert.equal(text.removed, true);
    assert.equal(input.removed, true);
    title.value = 'after destruction';
    assert.equal(timers.length, 0);
    assert.equal(text.innerHTML, 'edited');
    input.value = 'ignored';
    input.dispatch('change');
    input.dispatch('click');
    assert.equal(title.value, 'after destruction');
    assert.deepEqual(events, ['click']);
});

test('TemplateInstance destroys the active conditional branch with its parent', () => {
    const inserted = [];
    const removed = [];
    const { Signal, TemplateInstance } = loadRuntime({
        document: { adoptNode() {} },
        customElements: { get() {}, define() {}, upgrade() {} },
    });
    const visible = new Signal(true);
    const component = {};
    const anchor = new FakeElement('anchor');
    anchor.parentNode = { insertBefore(fragment) { inserted.push(fragment.firstElementChild); } };
    const root = { firstElementChild: anchor, lastElementChild: anchor,
        querySelectorAll: () => [anchor] };
    const branch = label => ({ template: { content: { cloneNode() {
        const node = new FakeElement(label);
        node.remove = () => { removed.push(node); node.removed = true; };
        return { firstElementChild: node, lastElementChild: node, querySelectorAll: () => [] };
    } } }, actions: {}, loops: [], ifs: [] });
    const instance = new TemplateInstance(component, root, {}, [], [{
        anchorId: 'anchor',
        parts: [
            { condition: () => visible.value, template: branch('yes') },
            { condition: () => !visible.value, template: branch('no') },
        ],
    }]);
    instance.render();
    assert.equal(inserted.at(-1).attributes._id.value, 'yes');
    visible.value = false;
    assert.equal(inserted.at(-1).attributes._id.value, 'no');
    assert.equal(removed.includes(inserted[0]), true);
    instance.destructor();
    assert.equal(anchor.removed, true);
    assert.equal(inserted.at(-1).removed, true);
});

test('TemplateInstance rebuilds a simple loop when its Signal collection is reordered', async () => {
    const inserted = [];
    const removed = [];
    const { Signal, TemplateInstance } = loadRuntime({
        document: { adoptNode() {} },
        customElements: { get() {}, define() {}, upgrade() {} },
        queueMicrotask,
    });
    const items = new Signal([{ name: 'first' }, { name: 'second' }]);
    const component = { get items() { return items.value; } };
    const anchor = new FakeElement('anchor');
    anchor.parentNode = { insertBefore(fragment) { inserted.push(fragment.firstElementChild); } };
    const root = { firstElementChild: anchor, lastElementChild: anchor,
        querySelectorAll: () => [anchor] };
    const rowTemplate = { template: { content: { cloneNode() {
        const row = new FakeElement('row');
        row.remove = () => { row.removed = true; removed.push(row); };
        return { firstElementChild: row, lastElementChild: row, querySelectorAll: () => [row] };
    } } }, actions: { content: { 'row°@HTML': { fct: context => context.data.item.name } } },
    loops: [], ifs: [] };
    const instance = new TemplateInstance(component, root, {}, [{
        anchorId: 'anchor', template: rowTemplate,
        simple: { data: 'this.items', item: 'item', index: 'index' },
    }], []);
    instance.render();
    assert.deepEqual(inserted.map(row => row.innerHTML), ['first', 'second']);
    items.value = [{ name: 'second' }, { name: 'first' }];
    await Promise.resolve();
    assert.deepEqual(inserted.slice(-2).map(row => row.innerHTML), ['second', 'first']);
    assert.equal(removed.includes(inserted[0]), true);
    assert.equal(removed.includes(inserted[1]), true);
    items.value = [];
    await Promise.resolve();
    assert.equal(inserted.every(row => row.removed), true);
    instance.destructor();
    assert.equal(anchor.removed, true);
});

test('TemplateInstance destroys nested loop rows when a parent item is removed', async () => {
    const inserted = [];
    const { Signal, TemplateInstance } = loadRuntime({
        document: { adoptNode() {} },
        customElements: { get() {}, define() {}, upgrade() {} },
        queueMicrotask,
    });
    const groups = new Signal([
        { name: 'one', children: ['a', 'b'] },
        { name: 'two', children: ['c'] },
    ]);
    const component = { get groups() { return groups.value; } };
    const anchor = new FakeElement('groups');
    anchor.parentNode = { insertBefore() {} };
    const root = { firstElementChild: anchor, lastElementChild: anchor,
        querySelectorAll: () => [anchor] };
    const childTemplate = { template: { content: { cloneNode() {
        const node = new FakeElement('child');
        inserted.push(node);
        return { firstElementChild: node, lastElementChild: node, querySelectorAll: () => [node] };
    } } }, actions: { content: { 'child°@HTML': { fct: context => context.data.child } } },
    loops: [], ifs: [] };
    const groupTemplate = { template: { content: { cloneNode() {
        const row = new FakeElement('group');
        const childAnchor = new FakeElement('children');
        childAnchor.parentNode = { insertBefore() {} };
        return { firstElementChild: row, lastElementChild: row,
            querySelectorAll: () => [row, childAnchor] };
    } } }, actions: {}, loops: [{ anchorId: 'children', template: childTemplate,
        simple: { data: 'group.children', item: 'child', index: 'childIndex' } }], ifs: [] };
    const instance = new TemplateInstance(component, root, {}, [{ anchorId: 'groups',
        template: groupTemplate,
        simple: { data: 'this.groups', item: 'group', index: 'groupIndex' },
    }], []);
    instance.render();
    assert.deepEqual(inserted.map(node => node.innerHTML), ['a', 'b', 'c']);
    groups.value = [{ name: 'two', children: ['c'] }];
    await Promise.resolve();
    assert.equal(inserted.slice(0, 3).every(node => node.removed), true);
    assert.deepEqual(inserted.slice(3).map(node => node.innerHTML), ['c']);
    instance.destructor();
    assert.equal(inserted.every(node => node.removed), true);
});
