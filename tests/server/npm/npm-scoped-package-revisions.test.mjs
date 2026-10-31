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
    return Object.values(context.npmCompilation);
}

test('a scoped npm package resolves from an ancestor and updates imported symbols across revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-scoped-revisions-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const name = '@sample/widgets';
    const packageDir = join(root, 'node_modules', '@sample', 'widgets');
    const nestedApp = join(root, 'app', 'nested');
    mkdirSync(packageDir, { recursive: true });
    mkdirSync(nestedApp, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(packageDir, 'index.js'), 'exports.first = () => 11; exports.second = () => 22;');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(nestedApp, 'node_modules'), fullname: 'Scoped',
    });
    builder.register('file:///first.lib.avt', { uri: name, libName: 'first', alias: 'current' });
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.equal(evaluate(first.result)[0].current(), 11);

    builder.unregister('file:///first.lib.avt');
    builder.register('file:///second.lib.avt', { uri: name, libName: 'second', alias: 'current' });
    const second = await builder.compile();
    assert.deepEqual(second.errors, []);
    assert.equal(evaluate(second.result)[0].current(), 22);
    assert.notEqual(second.result, first.result);

    builder.unregister('file:///second.lib.avt');
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
