import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

test('concurrent npm compile after an esbuild exception retains stale cache until imports change', async t => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previous; });

    const builder = new NpmBuilder({ isBuildAllowed: true });
    builder.register('file:///widget.lib.avt', { uri: 'widget-package', libName: 'Widget' });
    let rejectFirst;
    let calls = 0;
    builder.esbuildBuild = async () => {
        calls++;
        if (calls === 1) return new Promise((_resolve, reject) => { rejectFirst = reject; });
        return { result: '/* recovered Widget */', errors: [] };
    };

    const first = builder.compile();
    const overlapping = builder.compile();
    rejectFirst(new Error('temporary bundler failure'));
    const results = await Promise.allSettled([first, overlapping]);
    assert.deepEqual(results.map(result => [result.status, result.reason?.message]), [
        ['rejected', 'temporary bundler failure'],
        ['rejected', 'temporary bundler failure'],
    ]);
    assert.equal(calls, 1);

    const stale = await builder.compile();
    assert.equal(calls, 1);
    assert.deepEqual(stale, { result: '', errors: [] });

    builder.register('file:///other.lib.avt', { uri: 'other-package', libName: 'Other' });
    const recovered = await builder.compile();
    assert.equal(calls, 2);
    assert.match(recovered.result, /recovered Widget/);
    assert.deepEqual(recovered.errors, []);
});
