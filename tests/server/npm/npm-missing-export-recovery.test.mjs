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

function evaluate(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0];
}

test('a missing named export reports a bundle error, then recompiles after the module is fixed', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-export-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'named-export-fixture');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
        name: 'named-export-fixture', version: '1.0.0', type: 'module', main: 'index.js',
    }));
    const moduleFile = join(packageDir, 'index.js');
    writeFileSync(moduleFile, 'export const other = () => 3;');
    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });

    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'MissingExport',
    });
    builder.register('file:///client.lib.avt', { uri: 'named-export-fixture', libName: 'target', alias: 'value' });
    const first = await builder.compile();
    assert.equal(first.errors.length, 1);
    assert.equal(first.result.includes('npmCompilation'), true);

    writeFileSync(moduleFile, 'export const target = () => 42;');
    const repaired = await builder.compile();
    assert.deepEqual(repaired.errors, []);
    assert.equal(evaluate(repaired.result).value(), 42);
});
