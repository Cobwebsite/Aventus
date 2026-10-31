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
const results = [];
const calls = [];
const fakeExecFile = () => { throw new Error('Unexpected callback invocation'); };
fakeExecFile[promisify.custom] = async (command, args) => {
    calls.push([command, args]);
    const result = results.shift();
    if (result instanceof Error) throw result;
    return result;
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

test('Sharp and PHP prefer rejected process stderr for diagnostics and allow a later export', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-stderr-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const sharp = join(root, 'aventus.sharp.avt');
    const php = join(root, 'aventus.php.avt');
    writeFileSync(sharp, JSON.stringify({ csProj: 'Example.csproj' }));
    writeFileSync(php, '{}');
    writeFileSync(join(root, 'composer.json'), JSON.stringify({ name: 'vendor/example' }));
    const previousServer = GenericServer.instance;
    const events = [];
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        sendNotification: (...args) => events.push(args),
        showErrorMessage: message => events.push(['error', message]),
    } };
    t.after(() => { GenericServer.instance = previousServer; });
    calls.length = 0;
    results.length = 0;
    const sharpFailure = Object.assign(new Error('exit code 1'), { stderr: '  C# compiler detail\n' });
    const phpFailure = Object.assign(new Error('exit code 2'), { stderr: '  PHP compiler detail\n' });
    results.push(sharpFailure, phpFailure, { stdout: 'OK', stderr: '' }, { stdout: 'OK', stderr: '' });

    await Commands.allCommandes['aventus.sharp.export'].run(uri(sharp));
    await Commands.allCommandes['aventus.php.export'].run(uri(php));
    await Commands.allCommandes['aventus.sharp.export'].run(uri(sharp));
    await Commands.allCommandes['aventus.php.export'].run(uri(php));

    assert.deepEqual(calls.map(([command, args]) => [command, args[0].replaceAll('\\', '/')]), [
        ['csharp-converter', sharp.replaceAll('\\', '/')], ['php-converter', php.replaceAll('\\', '/')],
        ['csharp-converter', sharp.replaceAll('\\', '/')], ['php-converter', php.replaceAll('\\', '/')],
    ]);
    assert.deepEqual(events.filter(([name]) => name === 'error').map(([, message]) => message),
        ['C# compiler detail', 'PHP compiler detail']);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/addDebugFile').map(([, value]) => value), [
        ['csharp_errors', 'C# compiler detail'], ['php_errors', 'PHP compiler detail'],
    ]);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/sharp/compiling').map(([, value]) => value), [
        ['Example.csproj', 'compiling', undefined],
        ['Example.csproj', 'error', [{ title: 'C# error', file: 'csharp_errors' }]],
        ['vendor/example', 'compiling', undefined],
        ['vendor/example', 'error', [{ title: 'PHP error', file: 'php_errors' }]],
        ['Example.csproj', 'compiling', undefined], ['Example.csproj', 'success', undefined],
        ['vendor/example', 'compiling', undefined], ['vendor/example', 'success', undefined],
    ]);
});
