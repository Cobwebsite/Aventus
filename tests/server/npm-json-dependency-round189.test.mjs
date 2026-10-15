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

function exportsOf(compiled) {
    const context = {};
    runInNewContext(compiled.result, context);
    return Object.values(context.npmCompilation)[0];
}

test('npm bundle includes a package JSON dependency and rebuilds it after import set revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-json-dependency-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const folder = join(root, 'node_modules', 'json-package-fixture');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), JSON.stringify({
        name: 'json-package-fixture', version: '1.0.0', type: 'module', main: 'index.js',
    }));
    writeFileSync(join(folder, 'values.json'), JSON.stringify({ answer: 41, label: 'first' }));
    writeFileSync(join(folder, 'index.js'),
        'import values from "./values.json"; export const answer = values.answer; export const label = values.label;\n');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'JsonPackageFixture',
    });
    const source = 'file:///json.lib.avt';
    builder.register(source, { uri: 'json-package-fixture', libName: 'answer', alias: 'value' });
    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.equal(exportsOf(first).value, 41);
    assert.deepEqual(await builder.compile(), first);

    writeFileSync(join(folder, 'values.json'), JSON.stringify({ answer: 42, label: 'second' }));
    builder.register('file:///extra.lib.avt', { uri: 'json-package-fixture', libName: 'label', alias: 'text' });
    const revised = await builder.compile();
    assert.deepEqual(revised.errors, []);
    assert.deepEqual({ ...exportsOf(revised) }, { value: 42, text: 'second' });

    builder.unregister('file:///extra.lib.avt');
    const removed = await builder.compile();
    assert.deepEqual(removed.errors, []);
    assert.deepEqual({ ...exportsOf(removed) }, { value: 42 });
    builder.unregister(source);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
