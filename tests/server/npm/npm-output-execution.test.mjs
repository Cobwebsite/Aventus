import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

function source(names, content) {
    return { names, content: [content], imports: {}, forcedDependencies: [], sourceUri: [] };
}

function executeEntry(destination) {
    const url = pathToFileURL(join(destination, 'index.js')).href;
    const script = `const entry = await import(${JSON.stringify(url)}); console.log(JSON.stringify({ names: Object.keys(entry.Demo), one: entry.Demo.One?.(), two: entry.Demo.Two?.() }));`;
    return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' }));
}

test('npm entries in both destinations execute after rebuilding without a removed entry', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-executable-round52-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} }, workspaces: [pathToFileURL(root).href], _savePath: root };
    t.after(() => { GenericServer.instance = previousServer; });
    const destinations = [join(root, 'first'), join(root, 'second')];
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = { filesUri: [], getByUri: () => undefined };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = { path: destinations, packageJson: true, npmName: '@demo/web', manifest: false };
    const npm = { '': { content: [], imports: {} }, Demo: { content: [], imports: {} } };

    await build.writeBuildNpm(options, {
        npm,
        npmsrc: {
            'one.js': source(['Demo.One'], 'export const One = () => 1;'),
            'two.js': source(['Demo.Two'], 'export const Two = () => 2;'),
        },
    });
    for (const destination of destinations) {
        assert.deepEqual(executeEntry(destination), { names: ['One', 'Two'], one: 1, two: 2 });
    }

    await build.writeBuildNpm(options, {
        npm,
        npmsrc: { 'two.js': source(['Demo.Two'], 'export const Two = () => 22;') },
    });
    for (const destination of destinations) {
        const exported = readFileSync(join(destination, 'Demo', 'index.js'), 'utf8');
        assert.doesNotMatch(exported, /One/);
        assert.match(exported, /Two/);
        assert.equal(existsSync(join(destination, '__src', 'one.js')), false);
        assert.deepEqual(executeEntry(destination), { names: ['Two'], two: 22 });
    }
});
