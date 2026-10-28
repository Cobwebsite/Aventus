import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

test('npm package manifests retain user fields across dependency and version revisions in two destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-package-revision-'));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { ...(previousServer ?? {}), workspaces: [pathToFileURL(root).href] };
    t.after(() => { GenericServer.instance = previousServer; });
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputs = [join(root, 'first'), join(root, 'second')];
    const write = (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    write(join(root, 'package.json'), JSON.stringify({ dependencies: { '@example/alpha': '~1.2.0' } }));
    for (const output of outputs) {
        write(join(output, 'package.json'), JSON.stringify({ scripts: { check: 'node --check index.js' }, private: true }));
    }

    const packages = {
        alpha: { name: 'Alpha@web', npmUri: '@example/alpha', versionTxt: '1.2.3' },
        beta: { name: 'Beta@web', npmUri: '@example/beta', versionTxt: '2.0.0' },
    };
    let filesUri = ['alpha', 'beta'];
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', organization: 'Example' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = {
        get filesUri() { return filesUri; },
        getByUri: uri => packages[uri],
    };
    build.writeFile = async (path, content) => write(path, content);
    const options = { path: outputs, packageJson: true, manifest: false, npmName: '@example/demo' };
    const result = { npm: {}, npmsrc: {} };

    await build.writeBuildNpm(options, result);
    for (const output of outputs) {
        const pkg = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
        assert.equal(pkg.name, '@example/demo');
        assert.equal(pkg.version, '1.0.0');
        assert.deepEqual(pkg.dependencies, { '@example/alpha': '~1.2.0', '@example/beta': '^2.0.0' });
        assert.deepEqual(pkg.scripts, { check: 'node --check index.js' });
        assert.equal(pkg.private, true);
    }

    filesUri = ['alpha'];
    packages.alpha.versionTxt = '1.3.0';
    build.buildConfig.version = '1.1.0';
    write(join(root, 'package.json'), JSON.stringify({ dependencies: { '@example/alpha': '~1.3.0' } }));
    await build.writeBuildNpm(options, result);
    for (const output of outputs) {
        const pkg = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
        assert.equal(pkg.version, '1.1.0');
        assert.deepEqual(pkg.scripts, { check: 'node --check index.js' });
        assert.equal(pkg.private, true);
        assert.deepEqual(pkg.dependencies, { '@example/alpha': '~1.3.0' });
    }
});
