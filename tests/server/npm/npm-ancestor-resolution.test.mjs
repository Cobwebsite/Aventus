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

function packageAt(folder, name, code) {
    const path = join(folder, 'node_modules', name);
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(path, 'index.js'), code);
}

function exported(result) {
    const context = vm.createContext({});
    vm.runInContext(result, context);
    return Object.values(context.npmCompilation);
}

test('npm compilation resolves packages from successive ancestor node_modules folders', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-ancestors-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const workspace = join(root, 'workspace');
    const app = join(workspace, 'app');
    mkdirSync(app, { recursive: true });
    packageAt(root, 'root-fixture', 'exports.fromRoot = () => "root";');
    packageAt(workspace, 'workspace-fixture', 'exports.fromWorkspace = () => "workspace";');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(app, 'node_modules'), fullname: 'Ancestors',
    });
    builder.register('file:///root.lib.avt', { uri: 'root-fixture', libName: 'fromRoot' });
    builder.register('file:///workspace.lib.avt', { uri: 'workspace-fixture', libName: 'fromWorkspace' });

    const compiled = await builder.compile();
    assert.deepEqual(compiled.errors, []);
    const entries = exported(compiled.result);
    assert.equal(entries.length, 2);
    assert.equal(entries.find(entry => entry.fromRoot)?.fromRoot(), 'root');
    assert.equal(entries.find(entry => entry.fromWorkspace)?.fromWorkspace(), 'workspace');
});

test('npm compilation uses the nearest package when ancestor folders repeat its name', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-nearest-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const workspace = join(root, 'workspace');
    const app = join(workspace, 'app');
    mkdirSync(app, { recursive: true });
    packageAt(root, 'duplicate-fixture', 'exports.location = () => "root";');
    packageAt(workspace, 'duplicate-fixture', 'exports.location = () => "workspace";');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });
    const builder = new NpmBuilder({
        isBuildAllowed: true, nodeModulesDir: join(app, 'node_modules'), fullname: 'Nearest',
    });
    builder.register('file:///duplicate.lib.avt', { uri: 'duplicate-fixture', libName: 'location' });
    const compiled = await builder.compile();
    assert.deepEqual(compiled.errors, []);
    assert.equal(exported(compiled.result)[0].location(), 'workspace');
});
