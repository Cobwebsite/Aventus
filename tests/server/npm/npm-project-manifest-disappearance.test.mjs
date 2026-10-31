import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function valueOf(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0].value;
}

test('npm compilation refreshes installed source as project manifest disappears and returns', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-same-manifest-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'mutable-lib');
    mkdirSync(packageDir, { recursive: true });
    const manifest = join(root, 'package.json');
    writeFileSync(manifest, JSON.stringify({ dependencies: { 'mutable-lib': '1.0.0' } }));
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'mutable-lib', main: 'index.js' }));
    const entry = join(packageDir, 'index.js');
    writeFileSync(entry, 'exports.value = 11;');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'MutableLib',
    });
    builder.register('file:///mutable.lib.avt', { uri: 'mutable-lib', libName: 'value' });
    const initial = await builder.compile();
    assert.deepEqual(initial.errors, []);
    assert.equal(valueOf(initial.result), 11);

    rmSync(manifest);
    writeFileSync(entry, 'exports.value = 29;');
    const withoutManifest = await builder.compile();
    assert.deepEqual(withoutManifest.errors, []);
    assert.equal(valueOf(withoutManifest.result), 29);

    writeFileSync(manifest, JSON.stringify({ dependencies: { 'mutable-lib': '1.0.0' } }));
    writeFileSync(entry, 'exports.value = 47;');
    const restored = await builder.compile();
    assert.deepEqual(restored.errors, []);
    assert.equal(valueOf(restored.result), 47);
    assert.notEqual(restored.result, withoutManifest.result);

    writeFileSync(entry, 'exports.value = 59;');
    const cached = await builder.compile();
    assert.deepEqual(cached.errors, []);
    assert.equal(cached.result, restored.result);
    assert.equal(valueOf(cached.result), 47);
});
