import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

test('ActionGuard currently leaves a rejected action and its retry pending', () => {
    const loader = new URL('./helpers/load-runtime.mjs', import.meta.url).href;
    const script = `
        import { loadRuntime } from ${JSON.stringify(loader)};
        const { ActionGuard } = loadRuntime();
        const guard = new ActionGuard();
        const rejections = [];
        process.on('unhandledRejection', error => rejections.push(error.message));
        const first = guard.run(['key'], async () => { throw new Error('action failed'); });
        await new Promise(resolve => setImmediate(resolve));
        let retryExecuted = false;
        const retry = guard.run(['key'], async () => { retryExecuted = true; return 'recovered'; });
        const status = await Promise.race([
            Promise.allSettled([first, retry]).then(() => 'settled'),
            new Promise(resolve => setTimeout(() => resolve('pending'), 20)),
        ]);
        process.stdout.write(JSON.stringify({ rejections, retryExecuted, status }));
    `;
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
        encoding: 'utf8', timeout: 5000,
        env: { ...process.env },
    });
    assert.equal(child.error, undefined);
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), {
        rejections: ['action failed'], retryExecuted: false, status: 'pending',
    });
});
