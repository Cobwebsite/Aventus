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

function exportedValue(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0].value;
}

test('npm bundle cache follows development dependency revisions on the same builder', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-devdependency-revision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'dev-revision-lib');
    mkdirSync(packageDir, { recursive: true });
    const projectManifest = join(root, 'package.json');
    const entry = join(packageDir, 'index.js');
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'dev-revision-lib', main: 'index.js' }));
    writeFileSync(projectManifest, JSON.stringify({ devDependencies: { 'dev-revision-lib': '1.0.0' } }));
    writeFileSync(entry, 'exports.value = 10;');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'DevRevisionLib',
    });
    builder.register('file:///dev-revision.lib.avt', { uri: 'dev-revision-lib', libName: 'value' });

    const initial = await builder.compile();
    assert.deepEqual(initial.errors, []);
    assert.equal(exportedValue(initial.result), 10);

    writeFileSync(entry, 'exports.value = 20;');
    const cached = await builder.compile();
    assert.deepEqual(cached.errors, []);
    assert.equal(exportedValue(cached.result), 10);
    assert.equal(cached.result, initial.result);

    writeFileSync(projectManifest, JSON.stringify({ devDependencies: { 'dev-revision-lib': '2.0.0' } }));
    const revised = await builder.compile();
    assert.deepEqual(revised.errors, []);
    assert.equal(exportedValue(revised.result), 20);
    assert.notEqual(revised.result, initial.result);

    writeFileSync(entry, 'exports.value = 30;');
    writeFileSync(projectManifest, JSON.stringify({ devDependencies: {} }));
    const removed = await builder.compile();
    assert.deepEqual(removed.errors, []);
    assert.equal(exportedValue(removed.result), 30);

    builder.unregister('file:///dev-revision.lib.avt');
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
