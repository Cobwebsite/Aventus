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

function exportedValues(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0];
}

test('npm exports subpaths switch across revisions without retaining the previous entry', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-subpaths-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'subpath-fixture');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
        name: 'subpath-fixture', version: '1.0.0',
        exports: { './alpha': './alpha.js', './beta': './beta.js' },
    }));
    writeFileSync(join(packageDir, 'alpha.js'), 'exports.value = () => "alpha";');
    writeFileSync(join(packageDir, 'beta.js'), 'exports.value = () => "beta";');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'Subpaths',
    });
    const source = 'file:///subpath.lib.avt';

    builder.register(source, { uri: 'subpath-fixture/alpha', libName: 'value', alias: 'selected' });
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.equal(exportedValues(first.result).selected(), 'alpha');

    builder.unregister(source);
    builder.register(source, { uri: 'subpath-fixture/beta', libName: 'value', alias: 'selected' });
    const second = await builder.compile();
    assert.deepEqual(second.errors, []);
    assert.equal(exportedValues(second.result).selected(), 'beta');
    assert.notEqual(second.result, first.result);

    builder.unregister(source);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
