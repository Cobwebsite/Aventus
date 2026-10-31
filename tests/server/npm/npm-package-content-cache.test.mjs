import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function importedValue(result, alias) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0][alias]();
}

test('npm compilation refreshes changed dependency versions and removes a retired import', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-package-cache-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'changing-library');
    const projectPackageJson = join(root, 'package.json');
    writeFileSync(projectPackageJson, JSON.stringify({ devDependencies: { 'changing-library': '1.0.0' } }));
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'changing-library', main: 'index.js' }));
    const entry = join(packageDir, 'index.js');
    writeFileSync(entry, 'exports.value = () => 11;');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'Changing',
    });
    const source = 'file:///changing.lib.avt';
    assert.deepEqual(builder.register(source, { uri: 'changing-library', libName: 'value', alias: 'current' }), []);

    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.equal(importedValue(first.result, 'current'), 11);

    // The package version changes while the registered import remains identical.
    writeFileSync(entry, 'exports.value = () => 22; exports.newer = () => 33;');
    writeFileSync(projectPackageJson, JSON.stringify({ devDependencies: { 'changing-library': '1.0.1' } }));
    const refreshed = await builder.compile();
    assert.deepEqual(refreshed.errors, []);
    assert.notEqual(refreshed.result, first.result);
    assert.equal(importedValue(refreshed.result, 'current'), 22);

    // A different named import changes the generated entry and forces a fresh bundle.
    builder.unregister(source);
    assert.deepEqual(builder.register(source, { uri: 'changing-library', libName: 'newer', alias: 'renamed' }), []);
    const revised = await builder.compile();
    assert.deepEqual(revised.errors, []);
    assert.equal(importedValue(revised.result, 'renamed'), 33);
    assert.notEqual(revised.result, first.result);

    builder.unregister(source);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
