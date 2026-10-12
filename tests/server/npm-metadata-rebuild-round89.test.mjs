import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

test('npm metadata rebuild retains stale dependencies after a dependency is removed', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-metadata-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} }, _savePath: root };
    t.after(() => { GenericServer.instance = previous; });

    const output = join(root, 'dist');
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = {
        filesUri: ['first', 'second'],
        getByUri: uri => ({
            first: { name: 'First', npmUri: '@demo/first', versionTxt: '1.2.0' },
            second: { name: 'Second', npmUri: '@demo/second', versionTxt: '2.0.0' },
        })[uri],
    };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { '@demo/first': '~1.2.0' } }));
    const options = { path: [output], packageJson: true, npmName: '@demo/web', manifest: false };
    const result = { npm: {}, npmsrc: {} };

    await build.writeBuildNpm(options, result);
    assert.deepEqual(JSON.parse(readFileSync(join(output, 'package.json'), 'utf8')).dependencies,
        { '@demo/first': '~1.2.0', '@demo/second': '^2.0.0' });

    build.externalPackageInformation.filesUri = ['second'];
    build.externalPackageInformation.getByUri = uri => uri === 'second'
        ? { name: 'Second', npmUri: '@demo/second', versionTxt: '3.0.0' } : undefined;
    await build.writeBuildNpm(options, result);
    const metadata = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
    assert.equal(metadata.name, '@demo/web');
    assert.deepEqual(metadata.dependencies, { '@demo/first': '~1.2.0', '@demo/second': '^2.0.0' });
});
