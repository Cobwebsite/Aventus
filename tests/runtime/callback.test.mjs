import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('Callback deduplicates, preserves scope and return values, then removes and clears', () => {
    const { Callback } = loadRuntime();
    const callbacks = new Callback();
    const scope = { factor: 3 };
    function first(value) { return this.factor * value; }
    const second = value => value + 1;
    callbacks.add(first, scope);
    callbacks.add(first, { factor: 99 });
    callbacks.add(second);
    assert.deepEqual([...callbacks.trigger(2)], [6, 3]);
    callbacks.remove(first);
    assert.deepEqual([...callbacks.trigger(2)], [3]);
    callbacks.clear();
    assert.deepEqual([...callbacks.trigger(2)], []);
});

test('CallbackGroup isolates groups and uses a snapshot during mutation', () => {
    const { CallbackGroup } = loadRuntime();
    const groups = new CallbackGroup();
    const calls = [];
    const later = value => calls.push(`later:${value}`);
    const first = value => { calls.push(`first:${value}`); groups.add('a', later); };
    groups.add('a', first);
    groups.add('b', value => calls.push(`other:${value}`));
    groups.trigger('a', 1);
    groups.trigger('a', 2);
    groups.clear('a');
    groups.trigger('a', 3);
    groups.trigger('b', 4);
    groups.clearAll();
    groups.trigger('b', 5);
    assert.deepEqual(calls, ['first:1', 'first:2', 'later:2', 'other:4']);
});
