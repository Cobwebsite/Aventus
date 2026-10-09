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
const commandExistsPath = require.resolve('command-exists');
const existingCacheEntry = require.cache[commandExistsPath];
const originalExec = childProcess.exec;
const available = new Set();
const executions = [];
let executionResult = { stdout: 'Conversion complete', stderr: '' };
const fakeExec = () => { throw new Error('callback execution is not expected'); };
fakeExec[promisify.custom] = async (command, options) => {
    executions.push([command, options]);
    if (executionResult instanceof Error) throw executionResult;
    return executionResult;
};
require.cache[commandExistsPath] = { id: commandExistsPath, filename: commandExistsPath,
    loaded: true, exports: { sync: name => available.has(name) } };
childProcess.exec = fakeExec;
let modules;
try {
    modules = await loadServerModules([
        'cmds/index.ts', 'GenericServer.ts', 'language-services/json/CSharpManager.ts',
        'language-services/json/PhpManager.ts',
    ]);
} finally {
    childProcess.exec = originalExec;
    if (existingCacheEntry) require.cache[commandExistsPath] = existingCacheEntry;
    else delete require.cache[commandExistsPath];
}

const [commandsModule, serverModule, sharpManagerModule, phpManagerModule] = modules;
const commands = commandsModule.Commands.allCommandes;
const { GenericServer } = serverModule;
const { CSharpManager } = sharpManagerModule;
const { PhpManager } = phpManagerModule;

async function withConverter(callback) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-'));
    const previous = {
        server: GenericServer.instance, sharpManager: CSharpManager.getInstance,
        phpManager: PhpManager.getInstance,
    };
    const events = [];
    const files = { sharp: {}, php: {} };
    const selects = [];
    let selection = null;
    CSharpManager.getInstance = () => ({ files: files.sharp });
    PhpManager.getInstance = () => ({ files: files.php });
    GenericServer.instance = {
        logLevel: 4, _extensionPath: root,
        connection: {
            sendNotification: (...args) => events.push(['notification', ...args]),
            showErrorMessage: message => events.push(['error', message]),
            showInformationMessage: message => events.push(['info', message]),
            showLoadingMessage: async (_message, action) => action(),
            ask: async () => false,
            Select: async (items, options) => { selects.push([items, options]); return selection; },
        },
    };
    available.clear();
    executions.length = 0;
    executionResult = { stdout: 'Conversion complete', stderr: '' };
    try {
        await callback({ root, events, files, selects, setSelection: value => { selection = value; }, setResult: value => { executionResult = value; } });
    } finally {
        GenericServer.instance = previous.server;
        CSharpManager.getInstance = previous.sharpManager;
        PhpManager.getInstance = previous.phpManager;
        rmSync(root, { recursive: true, force: true });
    }
}

test('Sharp export chooses its only config and reports conversion success', async () => {
    await withConverter(async ({ root, events, files }) => {
        available.add('dotnet');
        available.add('csharp-converter');
        const path = join(root, 'aventus.sharp.avt');
        writeFileSync(path, JSON.stringify({ csProj: 'Demo.csproj' }));
        files.sharp[`file:///${path.replaceAll('\\', '/')}`] = {};
        await commands['aventus.sharp.export'].run();
        assert.equal(executions.length, 1);
        assert.match(executions[0][0], /csharp-converter .*aventus\.sharp\.avt/);
        assert.deepEqual(events.filter(item => item[0] === 'notification').map(item => item[2]), [
            ['Demo.csproj', 'compiling', undefined], ['Demo.csproj', 'success', undefined],
        ]);
    });
});

test('PHP export honors a selected config and reports conversion success', async () => {
    await withConverter(async ({ root, events, files, selects, setSelection }) => {
        available.add('php');
        available.add('php-converter');
        const first = `file:///${join(root, 'one', 'aventus.php.avt').replaceAll('\\', '/')}`;
        const second = `file:///${join(root, 'two', 'aventus.php.avt').replaceAll('\\', '/')}`;
        files.php[first] = {};
        files.php[second] = {};
        setSelection({ label: second });
        await commands['aventus.php.export'].run();
        assert.equal(selects.length, 1);
        assert.deepEqual(selects[0][0].map(item => item.label), [first, second]);
        assert.match(executions[0][0], /php .*PhpToTypescript\.phar .*aventus\.php\.avt 2>&1/);
        assert.deepEqual(events.filter(item => item[0] === 'notification').map(item => item[2]), [
            ['', 'compiling', undefined], ['', 'success', undefined],
        ]);
    });
});

test('export commands explain missing runtimes without executing converters', async () => {
    await withConverter(async ({ events }) => {
        await commands['aventus.sharp.export'].run();
        await commands['aventus.php.export'].run();
        assert.deepEqual(events.filter(item => item[0] === 'error').map(item => item[1]), [
            "Dotnet isn't installed on your system", "Php isn't installed on your system",
        ]);
        assert.deepEqual(executions, []);
    });
});

test('Sharp update tools runs only installed tools and reports stderr', async () => {
    await withConverter(async ({ events, setResult }) => {
        available.add('dotnet');
        available.add('csharp-converter');
        setResult({ stdout: '', stderr: 'update failed' });
        await commands['aventus.sharp.update_tools'].run();
        assert.deepEqual(executions.map(([cmd]) => cmd), ['dotnet tool update --global AventusSharp.Converter']);
        assert.deepEqual(events.filter(item => item[0] === 'error').map(item => item[1]), ['update failed']);
    });
});

test('Sharp converter output with Error reports a debug file and error state', async () => {
    await withConverter(async ({ root, events, setResult }) => {
        available.add('dotnet');
        available.add('csharp-converter');
        const path = join(root, 'aventus.sharp.avt');
        writeFileSync(path, JSON.stringify({ csProj: 'Demo.csproj' }));
        setResult({ stdout: 'Error : invalid type', stderr: '' });
        const previousClear = console.clear;
        const previousError = GenericServer.error;
        console.clear = () => {};
        GenericServer.error = () => {};
        try {
            await commands['aventus.sharp.export'].run(`file:///${path.replaceAll('\\', '/')}`);
        } finally {
            console.clear = previousClear;
            GenericServer.error = previousError;
        }
        const notifications = events.filter(item => item[0] === 'notification');
        assert.deepEqual(notifications.map(item => item[1]), [
            'aventus/sharp/compiling', 'aventus/addDebugFile', 'aventus/sharp/compiling',
        ]);
        assert.equal(executions.length, 1);
    });
});

test('PHP export cancel and converter rejection avoid further execution and allow retry', async () => {
    await withConverter(async ({ root, files, events, setResult }) => {
        available.add('php');
        available.add('php-converter');
        const first = `file:///${join(root, 'one', 'aventus.php.avt').replaceAll('\\', '/')}`;
        const second = `file:///${join(root, 'two', 'aventus.php.avt').replaceAll('\\', '/')}`;
        files.php[first] = {};
        files.php[second] = {};
        await commands['aventus.php.export'].run();
        assert.deepEqual(executions, []);
        setResult(new Error('converter failed'));
        await commands['aventus.php.export'].run(first);
        assert.equal(executions.length, 1);
        assert.match(events.find(item => item[0] === 'error')[1], /converter failed/);
        setResult({ stdout: 'Conversion complete', stderr: '' });
        await commands['aventus.php.export'].run(first);
        assert.equal(executions.length, 2);
    });
});

test('Sharp update tools reports successful installed tools', async () => {
    await withConverter(async ({ events }) => {
        available.add('dotnet');
        available.add('csharp-converter');
        available.add('db-query');
        await commands['aventus.sharp.update_tools'].run();
        assert.deepEqual(executions.map(([cmd]) => cmd), [
            'dotnet tool update --global AventusSharp.Converter',
            'dotnet tool update --global AventusSharp.DatabaseQuery',
        ]);
        assert.deepEqual(events.filter(item => item[0] === 'info').map(item => item[1]), [
            'Update done for : csharp-converter, db-query',
        ]);
    });
});
