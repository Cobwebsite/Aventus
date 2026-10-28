import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

function result(name, value) {
    return {
        npm: { Demo: { content: [], imports: {} } },
        npmsrc: {
            'entry.js': {
                names: [`Demo.${name}`],
                content: [`export const ${name} = ${value};`],
                imports: {},
                forcedDependencies: [],
                sourceUri: [],
            },
        },
    };
}

test('disabling npm package metadata removes only an unchanged generated package', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-toggle-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} }, workspaces: [pathToFileURL(root).href], _savePath: root };
    t.after(() => { GenericServer.instance = previous; });

    const outputs = [join(root, 'first'), join(root, 'second')];
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = { filesUri: [], getByUri: () => undefined };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = { path: outputs, packageJson: true, npmName: '@demo/first', manifest: false };

    await build.writeBuildNpm(options, result('Old', 1));
    for (const output of outputs) {
        assert.equal(JSON.parse(readFileSync(join(output, 'package.json'), 'utf8')).name, '@demo/first');
        assert.match(readFileSync(join(output, 'Demo', 'index.js'), 'utf8'), /Old/);
    }
    const modifiedPackage = join(outputs[1], 'package.json');
    writeFileSync(modifiedPackage, readFileSync(modifiedPackage, 'utf8') + '\n');

    options.packageJson = false;
    options.npmName = '@demo/second';
    build.buildConfig.version = '2.0.0';
    await build.writeBuildNpm(options, result('New', 2));
    for (const output of outputs) {
        const entry = readFileSync(join(output, 'Demo', 'index.js'), 'utf8');
        assert.match(entry, /New/);
        assert.doesNotMatch(entry, /Old/);
        assert.match(readFileSync(join(output, '__src', 'entry.js'), 'utf8'), /New = 2/);
    }
    assert.equal(existsSync(join(outputs[0], 'package.json')), false);
    assert.equal(existsSync(modifiedPackage), true);
    assert.equal(JSON.parse(readFileSync(modifiedPackage, 'utf8')).name, '@demo/first');

    options.packageJson = true;
    await build.writeBuildNpm(options, result('Newest', 3));
    for (const output of outputs) {
        const metadata = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
        assert.equal(metadata.name, '@demo/second');
        assert.equal(metadata.version, '2.0.0');
        const entry = readFileSync(join(output, 'Demo', 'index.js'), 'utf8');
        assert.match(entry, /Newest/);
        assert.doesNotMatch(entry, /Old|\bNew\b/);
        assert.match(readFileSync(join(output, '__src', 'entry.js'), 'utf8'), /Newest = 3/);
    }
});
