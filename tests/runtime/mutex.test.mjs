import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('Mutex hands the lock to waiters in order', async () => {
    const { Mutex } = loadRuntime();
    const mutex = new Mutex();
    assert.equal(await mutex.waitOne(), true);
    const order = [];
    const second = mutex.waitOne().then(value => order.push(['second', value]));
    const third = mutex.waitOne().then(value => order.push(['third', value]));
    mutex.release();
    await second;
    assert.deepEqual(order, [['second', true]]);
    mutex.release();
    await third;
    assert.deepEqual(order, [['second', true], ['third', true]]);
    mutex.release();
    assert.equal(await mutex.waitOne(), true);
    mutex.release();
});

test('Mutex releaseOnlyLast cancels older waiters and remains reusable', async () => {
    const { Mutex } = loadRuntime();
    const mutex = new Mutex();
    await mutex.waitOne();
    const first = mutex.waitOne();
    const last = mutex.waitOne();
    mutex.releaseOnlyLast();
    assert.equal(await first, false);
    assert.equal(await last, true);
    mutex.release();
    assert.equal(await mutex.waitOne(), true);
    mutex.release();
});

test('Mutex safeRun variants release after callback failures', async () => {
    const { Mutex } = loadRuntime();
    const mutex = new Mutex();
    const originalError = console.error;
    const errors = [];
    console.error = error => errors.push(error.message);
    try {
        assert.equal(await mutex.safeRun(() => { throw new Error('sync'); }), null);
        assert.equal(await mutex.safeRunAsync(async () => { throw new Error('async'); }), null);
        assert.equal(await mutex.safeRunLast(() => { throw new Error('last'); }), null);
        assert.equal(await mutex.safeRunLastAsync(async () => { throw new Error('last async'); }), undefined);
        assert.deepEqual(errors, ['sync', 'async', 'last', 'last async']);
        assert.equal(await mutex.safeRun(() => 'recovered'), 'recovered');
    } finally {
        console.error = originalError;
    }
});

test('Mutex safeRunLastAsync skips intermediate queued callbacks and runs the latest', async () => {
    const { Mutex } = loadRuntime();
    const mutex = new Mutex();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const calls = [];
    const first = mutex.safeRunLastAsync(async () => { calls.push('first'); await gate; return 1; });
    const middle = mutex.safeRunLastAsync(async () => { calls.push('middle'); return 2; });
    const last = mutex.safeRunLastAsync(async () => { calls.push('last'); return 3; });
    release();
    assert.deepEqual(await Promise.all([first, middle, last]), [1, undefined, 3]);
    assert.deepEqual(calls, ['first', 'last']);
    assert.equal(await mutex.safeRunLastAsync(async () => 4), 4);
});

test('Mutex safeRunLast runs only the latest queued synchronous callback', async () => {
    const { Mutex } = loadRuntime();
    const mutex = new Mutex();
    await mutex.waitOne();
    const calls = [];
    const first = mutex.safeRunLast(() => { calls.push('first'); return 1; });
    const middle = mutex.safeRunLast(() => { calls.push('middle'); return 2; });
    const last = mutex.safeRunLast(() => { calls.push('last'); return 3; });
    mutex.releaseOnlyLast();
    assert.deepEqual(await Promise.all([first, middle, last]), [null, null, 3]);
    assert.deepEqual(calls, ['last']);
    assert.equal(await mutex.safeRunLast(() => 4), 4);
});

test('Mutex dispose releases the lock but leaves existing waiters unresolved', async () => {
    const { Mutex } = loadRuntime();
    const mutex = new Mutex();
    await mutex.waitOne();
    let settled = false;
    mutex.waitOne().then(() => { settled = true; });
    mutex.dispose();
    await Promise.resolve();
    assert.equal(settled, false);
    assert.equal(await mutex.waitOne(), true);
    mutex.release();
    await Promise.resolve();
    assert.equal(settled, false);
});
