import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function makePackage(root, name, code) {
    const folder = join(root, 'node_modules', name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(folder, 'index.js'), code);
}

function evaluate(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation);
}

test('two npm modules produce executable entries and removing one rebuilds the remaining module', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-multi-round38-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    makePackage(root, 'alpha-fixture', 'exports.answer = () => 40 + 2;');
    makePackage(root, 'beta-fixture', 'exports.label = () => "beta";');
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    const builder = new NpmBuilder({
        isBuildAllowed: true,
        nodeModulesDir: join(root, 'node_modules'),
        fullname: 'MultipleNpmModules',
    });
    builder.register('file:///alpha.lib.avt', { uri: 'alpha-fixture', libName: 'answer', alias: 'first' });
    builder.register('file:///beta.lib.avt', { uri: 'beta-fixture', libName: 'label', alias: 'second' });

    const both = await builder.compile();
    assert.deepEqual(both.errors, []);
    const entries = evaluate(both.result);
    assert.equal(entries.length, 2);
    assert.equal(entries.find(entry => entry.first)?.first(), 42);
    assert.equal(entries.find(entry => entry.second)?.second(), 'beta');

    builder.unregister('file:///alpha.lib.avt');
    const remaining = await builder.compile();
    assert.deepEqual(remaining.errors, []);
    assert.notEqual(remaining.result, both.result);
    const afterRemoval = evaluate(remaining.result);
    assert.equal(afterRemoval.length, 1);
    assert.equal(afterRemoval[0].second(), 'beta');
    assert.equal(Object.hasOwn(afterRemoval[0], 'first'), false);
    assert.doesNotMatch(remaining.result, /alpha-fixture/);
});

test('two wildcard namespace entries remain isolated when the same export name exists in both packages', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-namespaces-round38-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    makePackage(root, 'north-fixture', 'exports.shared = () => "north";');
    makePackage(root, 'south-fixture', 'exports.shared = () => "south";');
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    const builder = new NpmBuilder({
        isBuildAllowed: true,
        nodeModulesDir: join(root, 'node_modules'),
        fullname: 'TwoNamespaces',
    });
    builder.register('file:///north.lib.avt', { uri: 'north-fixture', libName: '*', alias: 'north' });
    builder.register('file:///south.lib.avt', { uri: 'south-fixture', libName: '*', alias: 'south' });

    const compiled = await builder.compile();
    assert.deepEqual(compiled.errors, []);
    const entries = evaluate(compiled.result);
    assert.equal(entries.length, 2);
    assert.equal(entries.find(entry => entry.north)?.north.shared(), 'north');
    assert.equal(entries.find(entry => entry.south)?.south.shared(), 'south');
    assert.notEqual(entries.find(entry => entry.north), entries.find(entry => entry.south));
});
