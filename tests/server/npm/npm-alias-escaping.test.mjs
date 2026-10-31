import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ NpmBuilder }, { GenericServer }] = await loadServerModules([
    'project/BuildNpm.ts', 'GenericServer.ts',
]);

test('an apostrophe in an npm export alias produces executable JavaScript across re-registration', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-quote-alias-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const nodeModulesDir = join(root, 'node_modules');
    const moduleDir = join(nodeModulesDir, 'alias-fixture');
    mkdirSync(moduleDir, { recursive: true });
    writeFileSync(join(moduleDir, 'package.json'), JSON.stringify({
        name: 'alias-fixture', version: '1.0.0', type: 'module', main: 'index.js',
    }));
    writeFileSync(join(moduleDir, 'index.js'), 'export const value = 17;\n');
    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 99, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'AliasFixture' });
    const sourceUri = 'file:///alias-fixture.lib.avt';
    assert.deepEqual(builder.register(sourceUri, { uri: 'alias-fixture', libName: 'value', alias: "user'sValue" }), []);
    const quoted = await builder.compile();
    assert.deepEqual(quoted.errors, []);
    const firstContext = {};
    runInNewContext(quoted.result, firstContext);
    assert.equal(Object.values(firstContext.npmCompilation)[0]["user'sValue"], 17);

    builder.unregister(sourceUri);
    assert.deepEqual(builder.register(sourceUri, { uri: 'alias-fixture', libName: 'value', alias: 'usersValue' }), []);
    const repaired = await builder.compile();
    assert.deepEqual(repaired.errors, []);
    const context = {};
    runInNewContext(repaired.result, context);
    assert.equal(Object.values(context.npmCompilation)[0].usersValue, 17);
    assert.equal('user\'sValue' in Object.values(context.npmCompilation)[0], false);
});
