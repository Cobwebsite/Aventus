import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function exportedValue(result) {
    const context = {};
    runInNewContext(result, context);
    return Object.values(context.npmCompilation)[0].shared;
}

test('same npm alias from two exports emits a diagnostic and recovers after removing the collision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-same-alias-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });

    const nodeModulesDir = join(root, 'node_modules');
    const packageDir = join(nodeModulesDir, 'alias-fixture');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
        name: 'alias-fixture', version: '1.0.0', main: 'index.js',
    }));
    writeFileSync(join(packageDir, 'index.js'), 'exports.first = 11; exports.second = 29;');

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'AliasFixture' });
    const first = { uri: 'alias-fixture', libName: 'first', alias: 'shared' };
    const second = { uri: 'alias-fixture', libName: 'second', alias: 'shared' };
    assert.deepEqual(builder.register('file:///first.lib.avt', first), []);
    assert.match(builder.register('file:///second.lib.avt', second)[0].message,
        /npm alias shared.*alias-fixture.*first.*second/);
    const collision = await builder.compile();
    assert.deepEqual(collision.errors, []);
    assert.equal(exportedValue(collision.result), 29);

    builder.unregister('file:///second.lib.avt');
    const recovered = await builder.compile();
    assert.deepEqual(recovered.errors, []);
    assert.equal(exportedValue(recovered.result), 11);

    assert.match(builder.register('file:///second.lib.avt', second)[0].message, /npm alias shared/);
    const restored = await builder.compile();
    assert.deepEqual(restored.errors, []);
    assert.equal(exportedValue(restored.result), 29);

    builder.unregister('file:///first.lib.avt');
    builder.unregister('file:///second.lib.avt');
    assert.deepEqual(builder.register('file:///second.lib.avt', second), []);
    assert.match(builder.register('file:///first.lib.avt', first)[0].message,
        /npm alias shared.*alias-fixture.*second.*first/);
    const reversed = await builder.compile();
    assert.deepEqual(reversed.errors, []);
    assert.equal(exportedValue(reversed.result), 29);
    builder.unregister('file:///first.lib.avt');
    assert.deepEqual(builder.register('file:///same-export.lib.avt', second), []);
});

test('repeated registrations of one export produce one diagnostic for a conflicting export', () => {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    const first = { uri: 'alias-fixture', libName: 'first', alias: 'shared' };
    assert.deepEqual(builder.register('file:///one.lib.avt', first), []);
    assert.deepEqual(builder.register('file:///two.lib.avt', first), []);
    const diagnostics = builder.register('file:///three.lib.avt', {
        uri: 'alias-fixture', libName: 'second', alias: 'shared',
    });
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0].message, /first.*second/);
});
