import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('Signal notifies only on changed identity and supports unsubscribe and destroy', () => {
    const { Signal, WatchAction } = loadRuntime();
    const changes = [];
    const signal = new Signal(1, () => changes.push('hook'));
    const listener = (action, path, value) => changes.push([action, path, value]);
    signal.subscribe(listener);
    signal.subscribe(listener);
    signal.value = 1;
    assert.deepEqual(changes, []);
    signal.value = 2;
    assert.deepEqual(changes, ['hook', [WatchAction.UPDATED, '*', 2]]);
    signal.unsubscribe(listener);
    signal.value = 3;
    signal.subscribe(listener);
    signal.destroy();
    signal.value = 4;
    assert.deepEqual(changes, ['hook', [WatchAction.UPDATED, '*', 2], 'hook', 'hook']);
});

test('Signal defers subscriptions added during notification to the next change', () => {
    const { Signal } = loadRuntime();
    const signal = new Signal(0);
    const calls = [];
    const later = () => calls.push('later');
    const first = () => {
        calls.push('first');
        signal.unsubscribe(first);
        signal.subscribe(later);
    };
    signal.subscribe(first);
    signal.value = 1;
    assert.deepEqual(calls, ['first']);
    signal.value = 2;
    assert.deepEqual(calls, ['first', 'later']);
    signal.destroy();
    signal.value = 3;
    assert.deepEqual(calls, ['first', 'later']);
});
