import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-entry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} }, _savePath: root };
    t.after(() => { GenericServer.instance = previous; });
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Catalog@web', module: 'Catalog', name: 'web', version: '3.2.1' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = { filesUri: [], getByUri: () => undefined };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    return { root, build, outputs: [join(root, 'one'), join(root, 'two')] };
}

function source(name, value) {
    return {
        names: [name], content: [`export const ${name.split('.').at(-1)} = ${value};`], imports: {},
        forcedDependencies: [], sourceUri: [],
    };
}

test('npm output synthesizes parent entry points and replaces renamed exports on rebuild', async t => {
    const { build, outputs } = fixture(t);
    const options = { path: outputs, packageJson: false, manifest: false };
    await build.writeBuildNpm(options, {
        npm: { 'Catalog.UI.Controls': { content: ['export interface Marker {}'], imports: {} } },
        npmsrc: { 'component.js': source('Catalog.UI.Controls.OldButton', '1') },
    });
    for (const output of outputs) {
        assert.match(readFileSync(join(output, 'index.js'), 'utf8'), /export \{ Catalog \}/);
        assert.match(readFileSync(join(output, 'Catalog', 'index.js'), 'utf8'), /export \{ UI \}/);
        assert.match(readFileSync(join(output, 'Catalog', 'UI', 'index.js'), 'utf8'), /export \{ Controls \}/);
        assert.match(readFileSync(join(output, 'Catalog', 'UI', 'Controls', 'index.js'), 'utf8'), /OldButton/);
        assert.equal(existsSync(join(output, 'package.json')), false);
    }
    await build.writeBuildNpm(options, {
        npm: { 'Catalog.UI.Controls': { content: ['export interface Marker {}'], imports: {} } },
        npmsrc: { 'component.js': source('Catalog.UI.Controls.NewButton', '2') },
    });
    for (const output of outputs) {
        const entry = readFileSync(join(output, 'Catalog', 'UI', 'Controls', 'index.js'), 'utf8');
        assert.match(entry, /NewButton/);
        assert.doesNotMatch(entry, /OldButton/);
        assert.match(readFileSync(join(output, '__src', 'component.js'), 'utf8'), /NewButton = 2/);
    }
});

test('npm package metadata uses the default scoped name and updates version across destinations', async t => {
    const { build, outputs } = fixture(t);
    const options = { path: outputs, packageJson: true, npmName: '', manifest: false };
    const result = { npm: {}, npmsrc: {} };
    await build.writeBuildNpm(options, result);
    build.buildConfig.version = '3.2.2';
    await build.writeBuildNpm(options, result);
    for (const output of outputs) {
        const metadata = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
        assert.equal(metadata.name, '@catalog/web');
        assert.equal(metadata.version, '3.2.2');
        assert.equal(metadata.main, 'index.js');
        assert.equal(metadata.types, 'index.d.ts');
        assert.equal(metadata.type, 'module');
        assert.equal(existsSync(join(output, metadata.main)), true);
        assert.equal(existsSync(join(output, metadata.types)), true);
    }
});

test('npm rebuild removes a retired namespace entry point but preserves user files', async t => {
    const { build, outputs } = fixture(t);
    const options = { path: outputs, packageJson: false, manifest: false };
    await build.writeBuildNpm(options, {
        npm: { 'Catalog.Legacy': { content: [], imports: {} } },
        npmsrc: { 'entry.js': source('Catalog.Legacy.Item', '1') },
    });
    for (const output of outputs) {
        writeFileSync(join(output, 'Catalog', 'Legacy', 'notes.txt'), 'keep this');
    }
    await build.writeBuildNpm(options, {
        npm: { 'Catalog.Current': { content: [], imports: {} } },
        npmsrc: { 'entry.js': source('Catalog.Current.Item', '2') },
    });
    for (const output of outputs) {
        const parent = readFileSync(join(output, 'Catalog', 'index.js'), 'utf8');
        assert.match(parent, /Current/);
        assert.doesNotMatch(parent, /Legacy/);
        assert.equal(existsSync(join(output, 'Catalog', 'Legacy', 'index.js')), false);
        assert.equal(existsSync(join(output, 'Catalog', 'Legacy', 'index.d.ts')), false);
        assert.equal(readFileSync(join(output, 'Catalog', 'Legacy', 'notes.txt'), 'utf8'), 'keep this');
        assert.match(readFileSync(join(output, 'Catalog', 'Current', 'index.js'), 'utf8'), /Item/);
    }
});
