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

function exportedValue(result) {
    const context = {};
    runInNewContext(result, context);
    return context.npmCompilation;
}

test('a dependency version change rebuilds the bundle without changing imports', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-source-rebuild-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const priorServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = priorServer; });

    const nodeModulesDir = join(root, 'node_modules');
    const projectPackageJson = join(root, 'package.json');
    writeFileSync(projectPackageJson, JSON.stringify({ dependencies: { 'changing-module': '1.0.0' } }));
    const packageDir = join(nodeModulesDir, 'changing-module');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
        name: 'changing-module', version: '1.0.0', main: 'index.js',
    }));
    const moduleFile = join(packageDir, 'index.js');
    writeFileSync(moduleFile, 'exports.value = 1; exports.extra = 7;\n');

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'ChangingModule' });
    builder.register('file:///one.lib.avt', { uri: 'changing-module', libName: 'value' });
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.equal(Object.values(exportedValue(first.result))[0].value, 1);

    writeFileSync(moduleFile, 'exports.value = 2; exports.extra = 7;\n');
    const unchangedVersion = await builder.compile();
    assert.equal(unchangedVersion.result, first.result);

    writeFileSync(projectPackageJson, JSON.stringify({ dependencies: { 'changing-module': '1.0.1' } }));
    const unchangedImports = await builder.compile();
    assert.deepEqual(unchangedImports.errors, []);
    assert.equal(Object.values(exportedValue(unchangedImports.result))[0].value, 2);

    builder.register('file:///two.lib.avt', { uri: 'changing-module', libName: 'extra' });
    const changedImports = await builder.compile();
    assert.deepEqual(changedImports.errors, []);
    assert.equal(Object.values(exportedValue(changedImports.result))[0].value, 2);
});
