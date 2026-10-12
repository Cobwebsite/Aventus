import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { Build }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'project/Build.ts', 'GenericServer.ts',
]);

test('npm imports registered while compilation is disabled need an explicit rebuild after enabling', async t => {
    const previousServer = GenericServer.instance;
    GenericServer.instance = { isIDE: false };
    t.after(() => { GenericServer.instance = previousServer; });
    const build = Object.create(Build.prototype);
    build.disableBuild();
    const builder = new NpmBuilder(build);
    builder.register('file:///widget.lib.avt', {
        uri: 'widget-package', libName: 'Widget', alias: 'Control',
    });
    assert.equal(builder.storedInfo['file:///widget.lib.avt'].length, 1);
    build.enableBuild();
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });

    builder.rebuildInfo();
    assert.ok(Object.keys(builder.infos).length > 0);
});
