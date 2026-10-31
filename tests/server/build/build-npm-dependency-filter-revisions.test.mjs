import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

test('npm manifests filter self and unresolved packages, then renew dependencies across two destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-dependency-filter-'));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { ...(previousServer ?? {}), workspaces: [pathToFileURL(root).href] };
    t.after(() => { GenericServer.instance = previousServer; });
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputs = [join(root, 'first'), join(root, 'second')];
    const write = (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const readPackages = () => outputs.map(output => JSON.parse(readFileSync(join(output, 'package.json'), 'utf8')));

    write(join(root, 'package.json'), JSON.stringify({
        dependencies: { '@example/alpha': 'workspace:*', '@example/unused': '9.0.0' },
    }));
    write(join(outputs[0], 'package.json'), '{invalid json');
    write(join(outputs[1], 'package.json'), JSON.stringify({ scripts: { check: 'node --check index.js' } }));

    const packages = {
        self: { name: 'Demo@web', npmUri: '@example/demo', versionTxt: '1.0.0' },
        alpha: { name: 'Alpha@web', npmUri: '@example/alpha', versionTxt: '1.2.3' },
        noNpm: { name: 'NoNpm@web', versionTxt: '2.0.0' },
    };
    let filesUri = ['self', 'missing', 'alpha', 'noNpm'];
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
    const initial = readPackages();
    for (const pkg of initial) {
        assert.deepEqual(pkg.dependencies, { '@example/alpha': 'workspace:*' });
        assert.equal(pkg.name, '@example/demo');
    }
    assert.deepEqual(initial[1].scripts, { check: 'node --check index.js' });

    filesUri = ['self', 'noNpm'];
    build.buildConfig.version = '1.1.0';
    await build.writeBuildNpm(options, result);
    for (const pkg of readPackages()) {
        assert.deepEqual(pkg.dependencies, {});
        assert.equal(pkg.version, '1.1.0');
    }

    packages.beta = { name: 'Beta@web', npmUri: '@example/beta', versionTxt: '3.4.5' };
    filesUri = ['beta', 'alpha'];
    await build.writeBuildNpm(options, result);
    for (const pkg of readPackages()) {
        assert.deepEqual(pkg.dependencies, {
            '@example/beta': '^3.4.5',
            '@example/alpha': 'workspace:*',
        });
        assert.equal(pkg.version, '1.1.0');
    }
});
