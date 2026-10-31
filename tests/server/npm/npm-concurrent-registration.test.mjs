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

function exportsOf(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0];
}

test('npm compile queued behind an active bundle observes a newly registered alias', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-queued-registration-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'revision-lib');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { 'revision-lib': '1.0.0' } }));
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'revision-lib', main: 'index.js' }));
    writeFileSync(join(packageDir, 'index.js'), 'exports.first = 11; exports.second = 22;');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'QueuedLib',
    });
    const firstUri = 'file:///first.lib.avt';
    const secondUri = 'file:///second.lib.avt';
    builder.register(firstUri, { uri: 'revision-lib', libName: 'first' });

    const active = builder.compile();
    builder.register(secondUri, { uri: 'revision-lib', libName: 'second', alias: 'renamed' });
    const queued = builder.compile();
    const [initial, revised] = await Promise.all([active, queued]);
    assert.deepEqual(initial.errors, []);
    assert.deepEqual(revised.errors, []);
    assert.equal(exportsOf(initial.result).first, 11);
    assert.equal('renamed' in exportsOf(initial.result), false);
    assert.equal(exportsOf(revised.result).first, 11);
    assert.equal(exportsOf(revised.result).renamed, 22);

    builder.unregister(firstUri);
    const afterRemoval = await builder.compile();
    assert.deepEqual(afterRemoval.errors, []);
    assert.equal('first' in exportsOf(afterRemoval.result), false);
    assert.equal(exportsOf(afterRemoval.result).renamed, 22);

    builder.unregister(secondUri);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
