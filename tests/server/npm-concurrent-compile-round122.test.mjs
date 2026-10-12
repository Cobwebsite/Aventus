import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

test('concurrent npm compile can return an empty result while the first bundle is pending', async t => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previous; });

    const builder = new NpmBuilder({ isBuildAllowed: true });
    builder.register('file:///widget.lib.avt', { uri: 'widget-package', libName: 'Widget' });
    let finishBuild;
    let calls = 0;
    builder.esbuildBuild = async () => {
        calls++;
        return new Promise(resolve => { finishBuild = resolve; });
    };

    const first = builder.compile();
    assert.equal(calls, 1);
    const overlapping = await builder.compile();
    assert.deepEqual(overlapping, { result: '', errors: [] });

    finishBuild({ result: '/* bundled Widget */', errors: [] });
    const completed = await first;
    assert.match(completed.result, /bundled Widget/);
    assert.match(completed.result, /npmCompilation/);
    assert.equal(calls, 1);
    assert.deepEqual(await builder.compile(), completed);
});
