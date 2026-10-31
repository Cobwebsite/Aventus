import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { loadServerModules } from '../helpers/load-ts.mjs';

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
    assert.equal(exported.meaning, 42);
    assert.equal(exported.value, 42);
});

test('npm compilation exposes a default import under its local alias', async t => {
    const builder = fixture(t);
    writeFileSync(join(builder.build.nodeModulesDir, 'tiny-combo', 'index.js'), 'module.exports = class Client {};\n');
    builder.register('file:///client.lib.avt', { uri: 'tiny-combo', libName: 'default', alias: 'Client' });
    const compiled = await builder.compile();
    assert.deepEqual(compiled.errors, []);
    const context = vm.createContext({});
    vm.runInContext(compiled.result, context);
    const exported = Object.values(context.npmCompilation)[0];
    assert.equal(typeof exported.Client, 'function');
    assert.equal(typeof new exported.Client(), 'object');
});

test('npm compilation exposes default and named imports from one declaration', async t => {
    const builder = fixture(t);
    const packageDir = join(builder.build.nodeModulesDir, 'tiny-combo');
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'tiny-combo', version: '1.0.0', type: 'module', main: 'index.js' }));
    writeFileSync(join(packageDir, 'index.js'), 'export default class Client {}; export const Helper = 42;\n');
    builder.register('file:///client.lib.avt', { uri: 'tiny-combo', libName: 'default', alias: 'Client' });
    builder.register('file:///client.lib.avt', { uri: 'tiny-combo', libName: 'Helper', alias: 'LocalHelper' });
    const compiled = await builder.compile();
    assert.deepEqual(compiled.errors, []);
    const context = vm.createContext({});
    vm.runInContext(compiled.result, context);
    const exported = Object.values(context.npmCompilation)[0];
    assert.equal(typeof exported.Client, 'function');
    assert.equal(exported.LocalHelper, 42);
});

test('an invalid wildcard registration does not change stored imports', () => {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    const range = { start: { line: 2, character: 4 }, end: { line: 2, character: 31 } };
    const errors = builder.register('file:///invalid.lib.avt', { uri: 'tiny-combo', libName: '*' }, range);
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /has no alias/);
    assert.deepEqual(errors[0].range, range);
    assert.equal(builder.storedInfo['file:///invalid.lib.avt'], undefined);
    builder.rebuildInfo();
    assert.deepEqual(builder.writeFileToCompile(), { buildTxt: 'export default {  }', toExport: '' });
    assert.deepEqual(builder.register('file:///invalid.lib.avt', { uri: 'tiny-combo', libName: '*', alias: 'module' }), []);
    assert.match(builder.writeFileToCompile().buildTxt, /import \* as .* from "tiny-combo"/);
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
