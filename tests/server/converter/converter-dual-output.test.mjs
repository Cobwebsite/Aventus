import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const existsPath = require.resolve('command-exists');
const previousCache = require.cache[existsPath];
const previousExecFile = childProcess.execFile;
const calls = [];
const fakeExecFile = () => { throw new Error('Unexpected callback invocation'); };
fakeExecFile[promisify.custom] = async (command, args) => {
    calls.push([command, args]);
    return { stdout: 'Error : main converter failure', stderr: 'Error : secondary converter failure' };
};
require.cache[existsPath] = { id: existsPath, filename: existsPath, loaded: true,
    exports: { sync: name => ['dotnet', 'csharp-converter', 'php', 'php-converter'].includes(name) } };
childProcess.execFile = fakeExecFile;
let modules;
try {
    modules = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);
} finally {
    childProcess.execFile = previousExecFile;
    if (previousCache) require.cache[existsPath] = previousCache;
    else delete require.cache[existsPath];
}
const [{ Commands }, { GenericServer }] = modules;
const uri = path => `file:///${path.replaceAll('\\', '/')}`;

test('Sharp and PHP publish stdout diagnostic once when both process streams report errors', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-dual-output-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const sharp = join(root, 'aventus.sharp.avt');
    const php = join(root, 'aventus.php.avt');
    writeFileSync(sharp, JSON.stringify({ csProj: 'Example.csproj' }));
    writeFileSync(php, '{}');
    writeFileSync(join(root, 'composer.json'), JSON.stringify({ name: 'vendor/example' }));
    const previousServer = GenericServer.instance;
    const previousError = GenericServer.error;
    const previousClear = console.clear;
    const events = [];
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        sendNotification: (...args) => events.push(args),
        showWarningMessage: message => events.push(['warning', message]),
    } };
    GenericServer.error = () => {};
    console.clear = () => {};
    t.after(() => {
        GenericServer.instance = previousServer;
        GenericServer.error = previousError;
        console.clear = previousClear;
    });
    calls.length = 0;

    await Commands.allCommandes['aventus.sharp.export'].run(uri(sharp));
    await Commands.allCommandes['aventus.php.export'].run(uri(php));

    assert.deepEqual(calls.map(([command]) => command), ['csharp-converter', 'php-converter']);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/addDebugFile').map(([, value]) => value), [
        ['csharp_errors', 'Error : main converter failure'],
        ['php_errors', 'Error : main converter failure'],
    ]);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/sharp/compiling').map(([, value]) => value), [
        ['Example.csproj', 'compiling', undefined],
        ['Example.csproj', 'error', [{ title: 'C# error', file: 'csharp_errors' }]],
        ['vendor/example', 'compiling', undefined],
        ['vendor/example', 'error', [{ title: 'PHP error', file: 'php_errors' }]],
    ]);
    assert.deepEqual(events.filter(([name]) => name === 'warning'), []);
});
