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

function makePackage(nodeModulesDir, name, value) {
    const folder = join(nodeModulesDir, name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(folder, 'index.js'), `exports.shared = () => ${JSON.stringify(value)};\n`);
}

function entries(result) {
    const context = {};
    runInNewContext(result, context);
    return Object.values(context.npmCompilation);
}

test('same named export in separate npm packages keeps independent aliases through unregister and re-register', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-collision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });

    const nodeModulesDir = join(root, 'node_modules');
    makePackage(nodeModulesDir, 'alpha-collision', 'alpha');
    makePackage(nodeModulesDir, 'beta-collision', 'beta');
    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'CollisionFixture' });
    builder.register('file:///beta.lib.avt', { uri: 'beta-collision', libName: 'shared', alias: 'betaValue' });
    builder.register('file:///alpha.lib.avt', { uri: 'alpha-collision', libName: 'shared', alias: 'alphaValue' });

    const first = await builder.compile();
    assert.deepEqual(first.errors, []);
    assert.deepEqual(entries(first.result).map(entry => Object.keys(entry)[0]), ['alphaValue', 'betaValue']);
    assert.equal(entries(first.result)[0].alphaValue(), 'alpha');
    assert.equal(entries(first.result)[1].betaValue(), 'beta');

    builder.unregister('file:///beta.lib.avt');
    const removed = await builder.compile();
    assert.deepEqual(removed.errors, []);
    assert.equal(entries(removed.result).length, 1);
    assert.equal(entries(removed.result)[0].alphaValue(), 'alpha');

    builder.register('file:///beta.lib.avt', { uri: 'beta-collision', libName: 'shared', alias: 'renamedBeta' });
    const restored = await builder.compile();
    assert.deepEqual(restored.errors, []);
    assert.deepEqual(entries(restored.result).map(entry => Object.keys(entry)[0]), ['alphaValue', 'renamedBeta']);
    assert.equal(entries(restored.result)[1].renamedBeta(), 'beta');
});

test('default and _default exports use distinct generated identifiers in one npm bundle', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-default-collision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = previousServer; });

    const nodeModulesDir = join(root, 'node_modules');
    const folder = join(nodeModulesDir, 'default-collision');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), JSON.stringify({
        name: 'default-collision', version: '1.0.0', type: 'module', main: 'index.js',
    }));
    writeFileSync(join(folder, 'index.js'), 'export default "main"; export const _default = "named";\n');

    const builder = new NpmBuilder({ isBuildAllowed: true, nodeModulesDir, fullname: 'DefaultCollisionFixture' });
    builder.register('file:///one.lib.avt', { uri: 'default-collision', libName: 'default', alias: 'primary' });
    builder.register('file:///two.lib.avt', { uri: 'default-collision', libName: '_default', alias: 'secondary' });
    const compiled = await builder.compile();
    assert.deepEqual(compiled.errors, []);
    assert.equal(entries(compiled.result).length, 1);
    assert.deepEqual({ ...entries(compiled.result)[0] }, { primary: 'main', secondary: 'named' });
});
