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

function exportsOf(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation)[0];
}

test('npm imports switch between namespace and named modes across source revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-import-mode-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packageDir = join(root, 'node_modules', 'mode-fixture');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'mode-fixture', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(packageDir, 'index.js'), 'exports.first = 17; exports.second = 29;');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });
    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'ModeFixture' });
    const uri = 'file:///mode.lib.avt';

    builder.register(uri, { uri: 'mode-fixture', libName: '*', alias: 'whole' });
    builder.register(uri, { uri: 'mode-fixture', libName: 'first', alias: 'chosen' });
    const initial = await builder.compile();
    assert.deepEqual(initial.errors, []);
    assert.deepEqual(Object.keys(exportsOf(initial.result)).sort(), ['chosen', 'whole']);
    assert.equal(exportsOf(initial.result).whole.second, 29);
    assert.equal(exportsOf(initial.result).chosen, 17);

    builder.unregister(uri);
    builder.register(uri, { uri: 'mode-fixture', libName: 'second', alias: 'chosen' });
    const named = await builder.compile();
    assert.deepEqual(named.errors, []);
    assert.deepEqual(Object.keys(exportsOf(named.result)), ['chosen']);
    assert.equal(exportsOf(named.result).chosen, 29);
    assert.notEqual(named.result, initial.result);

    builder.unregister(uri);
    builder.register(uri, { uri: 'mode-fixture', libName: '*', alias: 'complete' });
    const namespace = await builder.compile();
    assert.deepEqual(namespace.errors, []);
    assert.deepEqual(Object.keys(exportsOf(namespace.result)), ['complete']);
    assert.equal(exportsOf(namespace.result).complete.first, 17);
    assert.equal(exportsOf(namespace.result).complete.second, 29);

    builder.unregister(uri);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
