import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const existsPath = require.resolve('command-exists');
const previousCache = require.cache[existsPath];
const previousExec = childProcess.exec;
const available = new Set(['dotnet', 'csharp-converter', 'php', 'php-converter']);
const executions = [];
const outputs = [];
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = async (command, options) => {
    executions.push([command, options]);
    return outputs.shift() ?? { stdout: 'OK', stderr: '' };
};
require.cache[existsPath] = { id: existsPath, filename: existsPath, loaded: true,
    exports: { sync: name => available.has(name) } };
childProcess.exec = fakeExec;
let modules;
try {
    modules = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);
} finally {
    childProcess.exec = previousExec;
    if (previousCache) require.cache[existsPath] = previousCache;
    else delete require.cache[existsPath];
}
const [commandModule, serverModule] = modules;
const commands = commandModule.Commands.allCommandes;
const { GenericServer } = serverModule;
const uri = path => `file:///${path.replaceAll('\\', '/')}`;

test('Sharp and PHP replace a converter diagnostic with success on a later export', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-round203-'));
    const previousServer = GenericServer.instance;
    const previousClear = console.clear;
    const previousError = GenericServer.error;
    const events = [];
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        sendNotification: (...args) => events.push(args),
        showErrorMessage: message => events.push(['error', message]),
    } };
    GenericServer.error = () => {};
    console.clear = () => {};
    executions.length = 0;
    outputs.length = 0;
    try {
        const sharp = join(root, 'aventus.sharp.avt');
        const php = join(root, 'aventus.php.avt');
        writeFileSync(sharp, JSON.stringify({ csProj: 'Demo.csproj' }));
        writeFileSync(php, '{}');
        writeFileSync(join(root, 'composer.json'), JSON.stringify({ name: 'vendor/demo' }));
        outputs.push(
            { stdout: 'Error : invalid C# declaration', stderr: '' },
            { stdout: 'Error : invalid PHP declaration', stderr: '' },
            { stdout: 'Sharp conversion complete', stderr: '' },
            { stdout: 'PHP conversion complete', stderr: '' },
        );
        await commands['aventus.sharp.export'].run(uri(sharp));
        await commands['aventus.php.export'].run(uri(php));
        await commands['aventus.sharp.export'].run(uri(sharp));
        await commands['aventus.php.export'].run(uri(php));

        assert.equal(executions.length, 4);
        assert.deepEqual(executions.map(([command]) => command.split(' ')[0]),
            ['csharp-converter', 'php-converter', 'csharp-converter', 'php-converter']);
        assert.deepEqual(events.filter(([method]) => method === 'aventus/addDebugFile'), [
            ['aventus/addDebugFile', ['csharp_errors', 'Error : invalid C# declaration']],
            ['aventus/addDebugFile', ['php_errors', 'Error : invalid PHP declaration']],
        ]);
        assert.deepEqual(events.filter(([method]) => method === 'aventus/sharp/compiling').map(([, value]) => value), [
            ['Demo.csproj', 'compiling', undefined],
            ['Demo.csproj', 'error', [{ title: 'C# error', file: 'csharp_errors' }]],
            ['vendor/demo', 'compiling', undefined],
            ['vendor/demo', 'error', [{ title: 'PHP error', file: 'php_errors' }]],
            ['Demo.csproj', 'compiling', undefined],
            ['Demo.csproj', 'success', undefined],
            ['vendor/demo', 'compiling', undefined],
            ['vendor/demo', 'success', undefined],
        ]);
    } finally {
        GenericServer.instance = previousServer;
        GenericServer.error = previousError;
        console.clear = previousClear;
        rmSync(root, { recursive: true, force: true });
    }
});
