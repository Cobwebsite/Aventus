import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-retry-round8-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const nodeModulesDir = join(root, 'node_modules');
    mkdirSync(nodeModulesDir);
    const notifications = [];
    GenericServer.instance = {
        logLevel: 0,
        connection: { sendNotification: (...args) => notifications.push(args) },
    };
    const build = { isBuildAllowed: true, nodeModulesDir, fullname: 'RetryFixture' };
    return { root, nodeModulesDir, build, notifications };
}

test('npm compilation updates the exported alias without recompiling an unchanged import', async t => {
    const { nodeModulesDir, build, notifications } = fixture(t);
    const packageDir = join(nodeModulesDir, 'tiny-retry');
    mkdirSync(packageDir);
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'tiny-retry', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(packageDir, 'index.js'), 'exports.answer = 42;\n');
    const builder = new NpmBuilder(build);
    builder.register('file:///first.lib.avt', { uri: 'tiny-retry', libName: 'answer', alias: 'first' });
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.match(first.result, /first/);
    builder.register('file:///second.lib.avt', { uri: 'tiny-retry', libName: 'answer', alias: 'second' });
    const second = await builder.compile();
    assert.deepEqual(second.errors, []);
    assert.match(second.result, /first/);
    assert.match(second.result, /second/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled/part').length, 2);
});

test('npm builder currently retains a failed bundle after the missing module becomes available', async t => {
    const { nodeModulesDir, build, notifications } = fixture(t);
    const builder = new NpmBuilder(build);
    builder.register('file:///missing.lib.avt', { uri: 'tiny-later', libName: 'answer' });
    const first = await builder.compile();
    assert.equal(first.errors.length, 1);
    const packageDir = join(nodeModulesDir, 'tiny-later');
    mkdirSync(packageDir);
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: 'tiny-later', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(packageDir, 'index.js'), 'exports.answer = 42;\n');
    const second = await builder.compile();
    assert.deepEqual(second, first);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled/part').length, 2);
    builder.unregister('file:///missing.lib.avt');
    builder.register('file:///missing.lib.avt', { uri: 'tiny-later', libName: 'answer' });
    const third = await builder.compile();
    assert.deepEqual(third, first);
});
