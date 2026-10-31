import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

function exported(result) {
    const context = {};
    runInNewContext(result, context);
    return Object.values(context.npmCompilation)[0];
}

test('npm output follows three source revisions without retaining withdrawn aliases', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-three-source-revisions-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const folder = join(root, 'node_modules', 'multi-source-fixture');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), JSON.stringify({
        name: 'multi-source-fixture', version: '1.0.0', type: 'module', main: 'index.js',
    }));
    writeFileSync(join(folder, 'index.js'), 'export const first = 11; export const second = 22;\n');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(root, 'node_modules'), fullname: 'MultiSourceFixture',
    });
    const packageUri = 'multi-source-fixture';
    const firstFile = 'file:///first.lib.avt';
    const secondFile = 'file:///second.lib.avt';
    const thirdFile = 'file:///third.lib.avt';

    assert.deepEqual(builder.register(firstFile, { uri: packageUri, libName: 'first', alias: 'fromFirst' }), []);
    assert.deepEqual(builder.register(secondFile, { uri: packageUri, libName: 'second', alias: 'fromSecond' }), []);
    const initial = await builder.compile();
    assert.deepEqual(initial.errors, []);
    assert.deepEqual({ ...exported(initial.result) }, { fromFirst: 11, fromSecond: 22 });

    builder.unregister(firstFile);
    assert.deepEqual(builder.register(thirdFile, { uri: packageUri, libName: 'first', alias: 'replacement' }), []);
    const replaced = await builder.compile();
    assert.deepEqual(replaced.errors, []);
    assert.deepEqual({ ...exported(replaced.result) }, { replacement: 11, fromSecond: 22 });
    assert.doesNotMatch(replaced.result, /\['fromFirst'\]/);

    builder.unregister(secondFile);
    assert.deepEqual(builder.register(secondFile, { uri: packageUri, libName: '*', alias: 'whole' }), []);
    const namespace = await builder.compile();
    assert.deepEqual(namespace.errors, []);
    assert.deepEqual(Object.keys(exported(namespace.result)).sort(), ['replacement', 'whole']);
    assert.equal(exported(namespace.result).whole.second, 22);
    assert.doesNotMatch(namespace.result, /\['fromSecond'\]/);

    builder.unregister(thirdFile);
    const onlyNamespace = await builder.compile();
    assert.deepEqual(onlyNamespace.errors, []);
    assert.deepEqual(Object.keys(exported(onlyNamespace.result)), ['whole']);
    assert.doesNotMatch(onlyNamespace.result, /\['replacement'\]/);

    builder.unregister(secondFile);
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});
