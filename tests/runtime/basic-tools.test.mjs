import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('uuidv4 generates distinct version-4 identifiers using injected crypto', () => {
    const { uuidv4 } = loadRuntime({ crypto: webcrypto });
    const first = uuidv4();
    const second = uuidv4();
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    assert.match(first, pattern);
    assert.match(second, pattern);
    assert.notEqual(first, second);
});

test('Async assimilates direct values and promises, including rejections', async () => {
    const { Async } = loadRuntime();
    assert.equal(await Async(5), 5);
    assert.equal(await Async(Promise.resolve('ready')), 'ready');
    await assert.rejects(Async(Promise.reject(new Error('failed'))), /failed/);
});

test('sleep resolves after its timer fires', async () => {
    const timers = [];
    const { sleep } = loadRuntime({ setTimeout(callback, delay) {
        timers.push({ callback, delay });
    } });
    let resolved = false;
    const pending = sleep(25).then(() => { resolved = true; });
    assert.equal(timers.length, 1);
    assert.equal(timers[0].delay, 25);
    assert.equal(resolved, false);
    timers[0].callback();
    await pending;
    assert.equal(resolved, true);
});

test('uuidv4 throws when crypto is unavailable', () => {
    const { uuidv4 } = loadRuntime({ crypto: undefined });
    assert.throws(() => uuidv4(), error => error?.name === 'TypeError');
});

test('sleep forwards boundary delays and resolves independently in timer firing order', async () => {
    const timers = [];
    const { sleep } = loadRuntime({ setTimeout(callback, delay) {
        timers.push({ callback, delay });
    } });
    const resolved = [];
    const zero = sleep(0).then(() => resolved.push('zero'));
    const negative = sleep(-5).then(() => resolved.push('negative'));
    const long = sleep(100).then(() => resolved.push('long'));
    assert.deepEqual(timers.map(timer => timer.delay), [0, -5, 100]);
    timers[1].callback();
    await negative;
    assert.deepEqual(resolved, ['negative']);
    timers[0].callback();
    await zero;
    assert.deepEqual(resolved, ['negative', 'zero']);
    timers[2].callback();
    await long;
    assert.deepEqual(resolved, ['negative', 'zero', 'long']);
});
