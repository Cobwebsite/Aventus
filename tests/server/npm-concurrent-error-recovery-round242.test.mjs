import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

test('concurrent npm compile retries the same imports after a reported bundler error', async t => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previous; });

    const builder = new NpmBuilder({ isBuildAllowed: true });
    builder.register('file:///widget.lib.avt', { uri: 'widget-package', libName: 'Widget' });
    let finishFirst;
    let calls = 0;
    builder.esbuildBuild = async () => {
        calls++;
        if (calls === 1) return new Promise(resolve => { finishFirst = resolve; });
        return { result: '/* recovered Widget */', errors: [] };
    };

    const first = builder.compile();
    const overlapping = builder.compile();
    finishFirst({ result: '', errors: [{ title: 'Npm compilation errors', file: 'npmErrors' }] });
    const [failed, overlappingResult] = await Promise.all([first, overlapping]);
    assert.equal(failed.errors.length, 1);
    assert.deepEqual(overlappingResult.errors, []);
    assert.match(overlappingResult.result, /recovered Widget/);
    assert.equal(calls, 2);

    const retried = await builder.compile();
    assert.equal(calls, 2);
    assert.match(retried.result, /recovered Widget/);
    assert.deepEqual(retried.errors, []);

    builder.register('file:///other.lib.avt', { uri: 'other-package', libName: 'Other' });
    const recovered = await builder.compile();
    assert.equal(calls, 3);
    assert.match(recovered.result, /recovered Widget/);
    assert.deepEqual(recovered.errors, []);
});
