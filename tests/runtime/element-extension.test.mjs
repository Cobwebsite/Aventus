import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

function elementHarness() {
    class Node { constructor(name, parentNode = null) { this.nodeName = name; this.parentNode = parentNode; } }
    class Element extends Node {
        constructor(name, parentNode = null, classes = []) {
            super(name, parentNode);
            this.tagName = name;
            this.classList = { contains: value => classes.includes(value) };
        }
    }
    class ShadowRoot extends Node { constructor(host) { super('#shadow-root'); this.host = host; } }
    const { ElementExtension } = loadRuntime({ Node, Element, HTMLElement: Element, ShadowRoot });
    return { ElementExtension, Element, ShadowRoot };
}

test('ElementExtension finds parents by tag and class; stop node is checked after traversal', () => {
    const { ElementExtension, Element } = elementHarness();
    const root = new Element('APP', null, ['root']);
    const section = new Element('SECTION', root, ['panel']);
    const leaf = new Element('SPAN', section);
    assert.equal(ElementExtension.findParentByTag(leaf, 'section'), section);
    assert.equal(ElementExtension.findParentByClass(leaf, 'root'), root);
    assert.equal(ElementExtension.findParentByTag(leaf, 'missing'), null);
    assert.equal(ElementExtension.findParentByClass(leaf, 'root', section), root);
    assert.deepEqual(Array.from(ElementExtension.findParentsByTag(leaf, ['section', 'app'])), [section, root]);
});

test('ElementExtension crosses a shadow root to find the host ancestry', () => {
    const { ElementExtension, Element, ShadowRoot } = elementHarness();
    const root = new Element('APP');
    const host = new Element('CARD', root);
    const shadow = new ShadowRoot(host);
    const leaf = new Element('SPAN', shadow);
    assert.equal(ElementExtension.findParentByTag(leaf, 'card'), host);
    assert.equal(ElementExtension.findParentByTag(leaf, 'app'), root);
});

test('ElementExtension returns elements and nodes assigned to the default slot', () => {
    const { ElementExtension, Element } = elementHarness();
    const host = new Element('CARD');
    const first = new Element('SPAN');
    const second = new Element('BUTTON');
    const slot = { assignedElements: () => [first, second], assignedNodes: () => [first, second] };
    host.shadowRoot = { querySelector: selector => selector === 'slot:not([name])' ? slot : null };
    assert.deepEqual(Array.from(ElementExtension.getElementsInSlot(host)), [first, second]);
    assert.deepEqual(Array.from(ElementExtension.getNodesInSlot(host)), [first, second]);
});

test('ElementExtension follows active elements through a web component shadow root', () => {
    const { ElementExtension, WebComponent } = loadRuntime();
    class Host extends WebComponent {}
    const host = Object.create(Host.prototype);
    const inner = { nodeName: 'INPUT' };
    host.shadowRoot = { activeElement: inner };
    assert.equal(ElementExtension.getActiveElement({ activeElement: host }), inner);
    assert.equal(ElementExtension.getActiveElement(null), null);
});

test('ElementExtension follows a named slot nested inside another slot', () => {
    const { ElementExtension, Element } = elementHarness();
    const host = new Element('CARD');
    const first = new Element('SPAN');
    const second = new Element('BUTTON');
    const text = { nodeName: '#text' };
    const nested = {
        nodeName: 'SLOT',
        assignedElements: () => [second],
        assignedNodes: () => [second, text],
    };
    const outer = {
        assignedElements: () => [first, nested],
        assignedNodes: () => [first, nested],
    };
    const selectors = [];
    host.shadowRoot = { querySelector(selector) {
        selectors.push(selector);
        return selector === 'slot[name="content"]' ? outer : null;
    } };
    assert.deepEqual(Array.from(ElementExtension.getElementsInSlot(host, 'content')), [first, second]);
    assert.deepEqual(Array.from(ElementExtension.getNodesInSlot(host, 'content')), [first, second]);
    assert.deepEqual(selectors, ['slot[name="content"]', 'slot[name="content"]']);
    assert.deepEqual(Array.from(ElementExtension.getElementsInSlot(host, 'missing')), []);
});

test('ElementExtension checks containment across a shadow root host', () => {
    const { ElementExtension, Element, ShadowRoot } = elementHarness();
    const documentRoot = {};
    const outer = new Element('APP');
    const host = new Element('CARD', outer);
    const unrelated = new Element('OTHER');
    const shadow = new ShadowRoot(host);
    const inner = new Element('SPAN', shadow);
    outer.getRootNode = host.getRootNode = unrelated.getRootNode = () => documentRoot;
    inner.getRootNode = () => shadow;
    outer.contains = node => node === host;
    unrelated.contains = () => false;
    assert.equal(ElementExtension.containsChild(outer, inner), true);
    assert.equal(ElementExtension.containsChild(unrelated, inner), false);
});
