import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };

function fixture() {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    const bundles = [];
    builder.esbuildBuild = async source => {
        bundles.push(source);
        return { result: `/* bundle ${bundles.length} */`, errors: [] };
    };
    return { builder, bundles };
}

test('unchanged npm imports reuse both the dependency bundle and export wrapper', async () => {
    const { builder, bundles } = fixture();
    builder.register('file-a', { uri: 'sample-library', libName: 'Widget' });
    const first = await builder.compile();
    const second = await builder.compile();
    assert.equal(bundles.length, 1);
    assert.deepEqual(second, first);
    assert.match(first.result, /bundle 1/);
});

test('adding and removing an alias refreshes exports without recompiling unchanged imports', async () => {
    const { builder, bundles } = fixture();
    builder.register('file-a', { uri: 'sample-library', libName: 'Widget', alias: 'First' });
    const initial = await builder.compile();
    builder.register('file-b', { uri: 'sample-library', libName: 'Widget', alias: 'Second' });
    const withAlias = await builder.compile();
    assert.equal(bundles.length, 1);
    assert.match(initial.result, /\['First'\]/);
    assert.doesNotMatch(initial.result, /\['Second'\]/);
    assert.match(withAlias.result, /\['First'\]/);
    assert.match(withAlias.result, /\['Second'\]/);
    builder.unregister('file-a');
    const afterRemoval = await builder.compile();
    assert.equal(bundles.length, 1);
    assert.doesNotMatch(afterRemoval.result, /\['First'\]/);
    assert.match(afterRemoval.result, /\['Second'\]/);
});

test('changing imported symbols rebuilds dependencies and final unregister clears stale output', async () => {
    const { builder, bundles } = fixture();
    builder.register('file-a', { uri: 'sample-library', libName: 'Widget' });
    const first = await builder.compile();
    builder.register('file-b', { uri: 'sample-library', libName: 'Button' });
    const second = await builder.compile();
    assert.equal(bundles.length, 2);
    assert.notEqual(second.result, first.result);
    assert.match(bundles[1], /Button/);
    builder.unregister('file-a');
    const third = await builder.compile();
    assert.equal(bundles.length, 3);
    assert.doesNotMatch(bundles[2], /Widget/);
    assert.match(third.result, /Button/);
    builder.unregister('file-b');
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
