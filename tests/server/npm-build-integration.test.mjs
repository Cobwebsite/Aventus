import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

test('npm compilation bundles a local module and reuses the result until imports change', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-fixture-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'node_modules', 'tiny-fixture'), { recursive: true });
    writeFileSync(join(root, 'node_modules', 'tiny-fixture', 'package.json'), JSON.stringify({ name: 'tiny-fixture', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(root, 'node_modules', 'tiny-fixture', 'index.js'), 'exports.answer = 42;\n');

    const notifications = [];
    GenericServer.instance = {
        logLevel: 0,
        connection: { sendNotification: (...params) => notifications.push(params) },
    };
    const builder = new NpmBuilder({
        isBuildAllowed: true,
        nodeModulesDir: join(root, 'node_modules'),
        fullname: 'Fixture',
    });
    builder.register('file:///first.lib.avt', { uri: 'tiny-fixture', libName: 'answer', alias: 'meaning' });
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.match(first.result, /npmCompilation/);
    assert.match(first.result, /meaning/);
    assert.match(first.result, /42/);
    assert.deepEqual((await builder.compile()), first);
    assert.equal(notifications.filter(([command]) => command === 'aventus/compiled/part').length, 2);

    builder.unregister('file:///first.lib.avt');
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});

test('npm compilation reports a missing module as a build error', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-missing-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const notifications = [];
    GenericServer.instance = {
        logLevel: 0,
        connection: { sendNotification: (...params) => notifications.push(params) },
    };
    const builder = new NpmBuilder({
        isBuildAllowed: true,
        nodeModulesDir: join(root, 'node_modules'),
        fullname: 'MissingFixture',
    });
    builder.register('file:///missing.lib.avt', { uri: 'package-that-does-not-exist', libName: 'value' });
    const result = await builder.compile();
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].title, 'Npm compilation errors');
    assert.equal(result.errors[0].file, 'MissingFixture_npmErrors');
    assert.ok(notifications.some(([command]) => command === 'aventus/addDebugFile'));
});
