import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('Instance creates one instance per class and recreates it after removal', () => {
    const { Instance } = loadRuntime();
    let created = 0;
    class Service { constructor() { this.id = ++created; } }
    class OtherService {}
    const first = Instance.get(Service);
    assert.equal(Instance.get(Service), first);
    assert.equal(created, 1);
    assert.notEqual(Instance.get(OtherService), first);
    assert.equal(Instance.destroy(first), true);
    assert.equal(Instance.destroy(first), false);
    assert.notEqual(Instance.get(Service), first);
    assert.equal(created, 2);
});

test('Instance.set accepts a supplied instance once per class', () => {
    const { Instance } = loadRuntime();
    class Service {}
    const supplied = new Service();
    assert.equal(Instance.set(supplied), true);
    assert.equal(Instance.set(new Service()), false);
    assert.equal(Instance.get(Service), supplied);
    assert.equal(Instance.destroy(supplied), true);
});
