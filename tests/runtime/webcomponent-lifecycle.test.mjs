import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

class FakeElement {
    children = [];
    shadowRoot = null;
    listeners = new Map();
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    removeEventListener(type, callback) {
        if(this.listeners.get(type) === callback) this.listeners.delete(type);
    }
    dispatchEvent(event) { this.listeners.get(event.type)?.(event); return true; }
    remove() { this.removed = true; }
}

class FakeCustomEvent { constructor(type) { this.type = type; } }

test('WebComponent constructs, connects, observes attributes, disconnects and destroys', () => {
    const timers = [];
    const document = { readyState: 'loading', listeners: new Map(),
        addEventListener(type, callback) { this.listeners.set(type, callback); },
        removeEventListener(type) { this.listeners.delete(type); },
    };
    const { WebComponent, WebComponentInstance } = loadRuntime({
        HTMLElement: FakeElement, document, CustomEvent: FakeCustomEvent,
        setTimeout(callback) { timers.push(callback); return timers.length; },
    });
    const events = [];
    class Component extends WebComponent {
        __renderTemplate() { events.push('render'); }
        postConnect() { events.push('connect'); }
        postDisconnect() { events.push('disconnect'); }
        postDestruction() { events.push('destroy'); }
    }
    Component.__styleSheets = {};
    const component = new Component();
    component.shadowRoot = { adoptedStyleSheets: [], children: [] };
    assert.deepEqual(events, ['render']);
    assert.equal(component.isReady, false);
    assert.equal(document.listeners.has('DOMContentLoaded'), true);
    component.connectedCallback();
    assert.deepEqual(Array.from(WebComponentInstance.getAllInstances(Component)), [component]);
    document.readyState = 'complete';
    document.listeners.get('DOMContentLoaded')();
    assert.equal(timers.length, 1);
    timers.shift()();
    assert.equal(component.isReady, true);
    assert.deepEqual(events, ['render', 'connect']);
    component.__onChangeFct.title = [() => events.push('attribute')];
    component.attributeChangedCallback('title', null, 'new');
    assert.deepEqual(events, ['render', 'connect', 'attribute']);
    component.disconnectedCallback();
    assert.equal(timers.length, 1);
    timers.shift()();
    assert.deepEqual(events, ['render', 'connect', 'attribute', 'disconnect']);
    component.destructor();
    assert.deepEqual(events, ['render', 'connect', 'attribute', 'disconnect', 'destroy']);
    assert.deepEqual(Array.from(WebComponentInstance.getAllInstances(Component)), []);
});
