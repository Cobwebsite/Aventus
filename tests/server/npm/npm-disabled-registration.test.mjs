import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { Build }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'project/Build.ts', 'GenericServer.ts',
]);

test('enabling a build indexes npm imports registered while compilation was disabled', t => {
    const previousServer = GenericServer.instance;
    GenericServer.instance = { isIDE: false };
    t.after(() => { GenericServer.instance = previousServer; });
    const build = Object.create(Build.prototype);
    build.disableBuild();
    const builder = new NpmBuilder(build);
    build.npmBuilder = builder;
    builder.register('file:///widget.lib.avt', {
        uri: 'widget-package', libName: 'Widget', alias: 'Control',
    });
    assert.equal(builder.storedInfo['file:///widget.lib.avt'].length, 1);
    assert.deepEqual(builder.infos, {});
    build.enableBuild();
    assert.ok(Object.keys(builder.infos).length > 0);
    assert.deepEqual(builder.infos['widget-package'].part.Widget.externalAlias, ['Control']);
});
