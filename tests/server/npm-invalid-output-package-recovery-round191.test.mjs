import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }] = await loadServerModules(['project/Build.ts']);

test('npm output recovers malformed destination metadata and retains later user fields', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-metadata-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'dist');
    mkdirSync(output);
    writeFileSync(join(output, 'package.json'), '{ invalid');

    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Catalog@web', module: 'Catalog', name: 'web', version: '1.0.0', organization: 'Example' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = { filesUri: [], getByUri: () => undefined };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = { path: [output], packageJson: true, manifest: false, npmName: '@catalog/web' };
    const result = { npm: {}, npmsrc: {} };

    await build.writeBuildNpm(options, result);
    let pkg = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
    assert.equal(pkg.name, '@catalog/web');
    assert.equal(pkg.version, '1.0.0');
    assert.equal(pkg.type, 'module');
    assert.equal(existsSync(join(output, pkg.main)), true);
    assert.equal(existsSync(join(output, pkg.types)), true);

    writeFileSync(join(output, 'package.json'), JSON.stringify({ ...pkg, private: true, scripts: { check: 'node --check index.js' } }));
    build.buildConfig.version = '1.1.0';
    await build.writeBuildNpm(options, result);
    pkg = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
    assert.equal(pkg.version, '1.1.0');
    assert.equal(pkg.private, true);
    assert.deepEqual(pkg.scripts, { check: 'node --check index.js' });

    writeFileSync(join(output, 'package.json'), '{ again invalid');
    build.buildConfig.version = '1.2.0';
    await build.writeBuildNpm(options, result);
    pkg = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
    assert.equal(pkg.name, '@catalog/web');
    assert.equal(pkg.version, '1.2.0');
    assert.equal(pkg.private, undefined);
    assert.equal(pkg.scripts, undefined);
    assert.equal(existsSync(join(output, 'index.js')), true);
    assert.equal(existsSync(join(output, 'index.d.ts')), true);
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(output, '.aventus-npm-generated.json'), 'utf8'))).sort(), ['index.d.ts', 'index.js']);
});
