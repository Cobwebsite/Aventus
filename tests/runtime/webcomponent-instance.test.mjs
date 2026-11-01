import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('WebComponentInstance tracks instances by subclass and removes them', () => {
    const { WebComponent, WebComponentInstance } = loadRuntime();
    class First extends WebComponent {}
    class Second extends WebComponent {}
    const first = Object.create(First.prototype);
    const second = Object.create(Second.prototype);
    WebComponentInstance.addInstance(first);
    WebComponentInstance.addInstance(second);
    assert.deepEqual(Array.from(WebComponentInstance.getAllInstances(First)), [first]);
    assert.deepEqual(Array.from(WebComponentInstance.getAllInstances(WebComponent)), [first, second]);
    WebComponentInstance.removeInstance(first);
    assert.deepEqual(Array.from(WebComponentInstance.getAllInstances(First)), []);
    WebComponentInstance.removeInstance(second);
    assert.deepEqual(Array.from(WebComponentInstance.getAllInstances(WebComponent)), []);
});

test('WebComponentInstance creates a registered custom element and returns null for an unknown name', () => {
    class FakeElement {}
    class Registered extends FakeElement {}
    const { WebComponentInstance } = loadRuntime({
        HTMLElement: FakeElement,
        customElements: { get(name) { return name === 'av-registered' ? Registered : undefined; }, define() {} },
    });
    assert.equal(WebComponentInstance.create('av-registered') instanceof Registered, true);
    assert.equal(WebComponentInstance.create('missing'), null);
});

test('WebComponentInstance registers and removes subclass definitions', () => {
    const { WebComponent, WebComponentInstance } = loadRuntime({ performance: { now: () => 42 } });
    class First extends WebComponent {}
    class Second extends WebComponent {}
    WebComponentInstance.registerDefinition(First);
    WebComponentInstance.registerDefinition(Second);
    assert.deepEqual(Array.from(WebComponentInstance.getAllClassesOf(WebComponent)), [First, Second]);
    assert.equal(WebComponentInstance.lastDefinition, 42);
    WebComponentInstance.removeDefinition(First);
    assert.deepEqual(Array.from(WebComponentInstance.getAllDefinitions()), [Second]);
    WebComponentInstance.removeDefinition(Second);
    assert.deepEqual(Array.from(WebComponentInstance.getAllDefinitions()), []);
});
