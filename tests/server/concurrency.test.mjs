import assert from 'node:assert/strict';
import test from 'node:test';
import { ActionGuard, Mutex } from '../../server/src/Mutex.ts';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

test('Mutex grants the lock in arrival order', async () => {
    const mutex = new Mutex();
    await mutex.waitOne();

    const acquired = [];
    const first = mutex.waitOne().then(() => acquired.push('first'));
    const second = mutex.waitOne().then(() => acquired.push('second'));
    await Promise.resolve();
    assert.deepEqual(acquired, []);

    mutex.release();
    await first;
    assert.deepEqual(acquired, ['first']);
    mutex.release();
    await second;
    assert.deepEqual(acquired, ['first', 'second']);
    mutex.release();
    await mutex.waitOne();
    mutex.release();
});

test('ActionGuard shares one in-flight action for equal keys', async () => {
    const guard = new ActionGuard();
    const pending = deferred();
    let calls = 0;
    const first = guard.run(['build', 1], () => {
        calls++;
        return pending.promise;
    });
    const second = guard.run(['build', 1], () => {
        calls++;
        return Promise.resolve('unexpected');
    });
    assert.equal(first, second);
    pending.resolve('done');
    assert.equal(await first, 'done');
    assert.equal(calls, 1);
});

test('ActionGuard keeps different keys independent and permits a retry', async () => {
    const guard = new ActionGuard();
    const pending = deferred();
    const first = guard.run(['a'], () => pending.promise);
    const other = guard.run(['b'], async () => 'other');
    assert.equal(await other, 'other');
    pending.resolve('first');
    assert.equal(await first, 'first');
    assert.equal(await guard.run(['a'], async () => 'again'), 'again');
});

test('ActionGuard propagates a failure and permits a retry', async () => {
    const guard = new ActionGuard();
    const pending = deferred();
    const first = guard.run(['build'], () => pending.promise);
    const second = guard.run(['build'], async () => 'unexpected');
    pending.reject(new Error('build failed'));
    await assert.rejects(first, /build failed/);
    await assert.rejects(second, /build failed/);
    assert.equal(await guard.run(['build'], async () => 'recovered'), 'recovered');
});
