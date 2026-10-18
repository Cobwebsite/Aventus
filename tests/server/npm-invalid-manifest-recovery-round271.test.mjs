import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function exportedValue(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0].value;
}

test('npm bundle refreshes across invalid and repaired project package manifests', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-invalid-manifest-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'revision-lib');
    mkdirSync(packageDir, { recursive: true });
    const projectManifest = join(root, 'package.json');
    const entry = join(packageDir, 'index.js');
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'revision-lib', main: 'index.js' }));
    writeFileSync(projectManifest, JSON.stringify({ dependencies: { 'revision-lib': '1.0.0' } }));
    writeFileSync(entry, 'exports.value = 10;');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'RevisionLib',
    });
    builder.register('file:///revision.lib.avt', { uri: 'revision-lib', libName: 'value' });

    const initial = await builder.compile();
    assert.deepEqual(initial.errors, []);
    assert.equal(exportedValue(initial.result), 10);

    writeFileSync(projectManifest, '{"dependencies":');
    writeFileSync(entry, 'exports.value = 20;');
    const invalid = await builder.compile();
    assert.deepEqual(invalid.errors, [{ title: 'Npm compilation errors', file: 'RevisionLib_npmErrors' }]);

    writeFileSync(projectManifest, JSON.stringify({ dependencies: { 'revision-lib': '2.0.0' } }));
    writeFileSync(entry, 'exports.value = 30;');
    const repaired = await builder.compile();
    assert.deepEqual(repaired.errors, []);
    assert.equal(exportedValue(repaired.result), 30);
    assert.notEqual(repaired.result, initial.result);

    builder.unregister('file:///revision.lib.avt');
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
