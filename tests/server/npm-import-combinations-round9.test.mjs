import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-combinations-round9-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const nodeModulesDir = join(root, 'node_modules');
    const packageDir = join(nodeModulesDir, 'tiny-combo');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'tiny-combo', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(packageDir, 'index.js'), 'exports.answer = 42; exports.extra = 7;\n');
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    return new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'ComboFixture' });
}

test('npm compilation exposes two named aliases and a namespace for one module', async t => {
    const builder = fixture(t);
    builder.register('file:///one.lib.avt', { uri: 'tiny-combo', libName: 'answer', alias: 'meaning' });
    builder.register('file:///two.lib.avt', { uri: 'tiny-combo', libName: 'answer', alias: 'value' });
    builder.register('file:///three.lib.avt', { uri: 'tiny-combo', libName: '*', alias: 'module' });
    const compiled = await builder.compile();
    assert.deepEqual(compiled.errors, []);
    const context = vm.createContext({});
    vm.runInContext(compiled.result, context);
    const exported = Object.values(context.npmCompilation)[0];
    assert.deepEqual(Object.keys(exported).sort(), ['meaning', 'module', 'value']);
    assert.equal(exported.module.answer, 42);
    // This reproduces the current mapping of named imports to the namespace object.
    assert.equal(exported.meaning, exported.module);
    assert.equal(exported.value, exported.module);
});

test('an invalid wildcard registration remains stored until its file is removed', () => {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    assert.throws(() => builder.register('file:///invalid.lib.avt', { uri: 'tiny-combo', libName: '*' }), /has no alias/);
    assert.equal(builder.storedInfo['file:///invalid.lib.avt'].length, 1);
    assert.throws(() => builder.rebuildInfo(), /has no alias/);
    builder.unregister('file:///invalid.lib.avt');
    assert.deepEqual(builder.writeFileToCompile(), { buildTxt: 'export default {  }', toExport: '' });
});

test('imports registered while building is disabled are picked up when it is enabled', () => {
    const build = { isBuildAllowed: false };
    const builder = new NpmBuilder(build);
    builder.register('file:///one.lib.avt', { uri: 'tiny-combo', libName: 'answer' });
    assert.deepEqual(builder.infos, {});
    build.isBuildAllowed = true;
    builder.rebuildInfo();
    assert.match(builder.writeFileToCompile().buildTxt, /from "tiny-combo"/);
});
