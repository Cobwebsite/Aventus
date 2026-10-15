import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

test('npm bundle recovers when a missing import is unregistered and retains the working package', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-unregister-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const nodeModulesDir = join(root, 'node_modules');
    const packageDir = join(nodeModulesDir, 'working-fixture');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
        name: 'working-fixture', version: '1.0.0', type: 'module', main: 'index.js',
    }));
    writeFileSync(join(packageDir, 'index.js'), 'export const answer = () => 42;\n');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'UnregisterRecovery' });
    assert.deepEqual(builder.register('file:///working.lib.avt', {
        uri: 'working-fixture', libName: 'answer', alias: 'result',
    }), []);
    assert.deepEqual(builder.register('file:///missing.lib.avt', {
        uri: 'absent-fixture', libName: 'missing',
    }), []);
    const failed = await builder.compile();
    assert.equal(failed.errors.length, 1);
    assert.equal(failed.errors[0].title, 'Npm compilation errors');
    assert.equal(failed.errors[0].file, 'UnregisterRecovery_npmErrors');

    builder.unregister('file:///missing.lib.avt');
    const recovered = await builder.compile();
    assert.deepEqual(recovered.errors, []);
    assert.doesNotMatch(recovered.result, /absent-fixture|missing/);
    const context = {};
    runInNewContext(recovered.result, context);
    assert.equal(Object.values(context.npmCompilation)[0].result(), 42);

    builder.unregister('file:///working.lib.avt');
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
