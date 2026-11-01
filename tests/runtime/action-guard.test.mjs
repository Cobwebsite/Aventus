import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('ActionGuard shares an in-flight result for matching keys and starts a new action afterward', async () => {
    const { ActionGuard } = loadRuntime();
    const guard = new ActionGuard();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let executions = 0;
    const first = guard.run(['same'], async () => { executions++; await gate; return 'result'; });
    const second = guard.run(['same'], async () => { executions++; return 'unexpected'; });
    assert.equal(executions, 1);
    release();
    assert.deepEqual(await Promise.all([first, second]), ['result', 'result']);
    assert.equal(await guard.run(['same'], async () => { executions++; return 'new'; }), 'new');
    assert.equal(executions, 2);
});

test('ActionGuard runs different key sets independently', async () => {
    const { ActionGuard } = loadRuntime();
    const guard = new ActionGuard();
    const results = await Promise.all([
        guard.run(['first'], async () => 1),
        guard.run(['second'], async () => 2),
    ]);
    assert.deepEqual(results, [1, 2]);
});

test('ActionGuard rejects every matching caller and releases the key for a retry', async () => {
    const { ActionGuard } = loadRuntime();
    const guard = new ActionGuard();
    const error = new Error('action failed');
    let fail;
    const gate = new Promise((resolve, reject) => { fail = reject; });
    let executions = 0;
    const first = guard.run(['key'], () => { executions++; return gate; });
    const second = guard.run(['key'], async () => { executions++; return 'unexpected'; });
    assert.equal(executions, 1);
    fail(error);
    const results = await Promise.allSettled([first, second]);
    assert.deepEqual(results.map(result => result.status), ['rejected', 'rejected']);
    assert.equal(results[0].reason, error);
    assert.equal(results[1].reason, error);
    assert.equal(await guard.run(['key'], async () => { executions++; return 'recovered'; }), 'recovered');
    assert.equal(executions, 2);
});

test('ActionGuard also releases the key after a synchronous throw', async () => {
    const { ActionGuard } = loadRuntime();
    const guard = new ActionGuard();
    const error = new Error('synchronous failure');
    await assert.rejects(guard.run(['key'], () => { throw error; }), reason => reason === error);
    assert.equal(await guard.run(['key'], async () => 'recovered'), 'recovered');
});
