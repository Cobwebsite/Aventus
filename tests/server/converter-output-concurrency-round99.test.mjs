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
const previousExecFile = childProcess.execFile;
const available = new Set();
const executions = [];
let nextResult = async () => ({ stdout: 'OK', stderr: '' });
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = (command, options) => {
    executions.push([command, options]);
    return nextResult(command);
};
const fakeExecFile = () => { throw new Error('Unexpected callback invocation'); };
fakeExecFile[promisify.custom] = (command, args, options) => {
    executions.push([command, args, options]);
    return nextResult(command);
};
require.cache[existsPath] = { id: existsPath, filename: existsPath, loaded: true,
    exports: { sync: name => available.has(name) } };
childProcess.exec = fakeExec;
childProcess.execFile = fakeExecFile;
let modules;
try {
    modules = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);
} finally {
    childProcess.exec = previousExec;
    childProcess.execFile = previousExecFile;
    if (previousCache) require.cache[existsPath] = previousCache;
    else delete require.cache[existsPath];
}
const [commandModule, serverModule] = modules;
const commands = commandModule.Commands.allCommandes;
const { GenericServer } = serverModule;
const uri = path => `file:///${path.replaceAll('\\', '/')}`;

async function fixture(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-round99-'));
    const previousServer = GenericServer.instance;
    const events = [];
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        sendNotification: (...args) => events.push(['notification', ...args]),
        showErrorMessage: message => events.push(['error', message]),
        showWarningMessage: message => events.push(['warning', message]),
        showInformationMessage: message => events.push(['info', message]),
        showLoadingMessage: async (_message, action) => action(),
    } };
    available.clear();
    executions.length = 0;
    nextResult = async () => ({ stdout: 'OK', stderr: '' });
    try {
        await run({ root, events, result: callback => { nextResult = callback; } });
    } finally {
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
}

test('Sharp and PHP concurrent exports suppress duplicates independently and accept later requests', async () => {
    await fixture(async ({ root, events, result }) => {
        for (const executable of ['dotnet', 'csharp-converter', 'php', 'php-converter']) available.add(executable);
        const sharp = join(root, 'aventus.sharp.avt');
        const php = join(root, 'aventus.php.avt');
        writeFileSync(sharp, JSON.stringify({ csProj: 'Demo.csproj' }));
        writeFileSync(php, '{}');
        let releaseSharp;
        let releasePhp;
        result(command => new Promise(resolve => {
            if (command.startsWith('csharp-converter')) releaseSharp = resolve;
            else releasePhp = resolve;
        }));
        const firstSharp = commands['aventus.sharp.export'].run(uri(sharp));
        const firstPhp = commands['aventus.php.export'].run(uri(php));
        assert.equal(executions.length, 2);
        await commands['aventus.sharp.export'].run(uri(sharp));
        await commands['aventus.php.export'].run(uri(php));
        assert.equal(executions.length, 2);
        releaseSharp({ stdout: 'OK', stderr: '' });
        releasePhp({ stdout: 'OK', stderr: '' });
        await Promise.all([firstSharp, firstPhp]);
        result(async () => ({ stdout: 'OK', stderr: '' }));
        await commands['aventus.sharp.export'].run(uri(sharp));
        await commands['aventus.php.export'].run(uri(php));
        assert.equal(executions.length, 4);
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2][1]),
            ['compiling', 'compiling', 'success', 'success', 'compiling', 'success', 'compiling', 'success']);
    });
});

test('converter stderr without an Error marker is reported as a warning', async () => {
    await fixture(async ({ root, events, result }) => {
        for (const executable of ['dotnet', 'csharp-converter', 'php', 'php-converter']) available.add(executable);
        const sharp = join(root, 'aventus.sharp.avt');
        const php = join(root, 'aventus.php.avt');
        writeFileSync(sharp, JSON.stringify({ csProj: 'Demo.csproj' }));
        writeFileSync(php, '{}');
        result(async () => ({ stdout: 'conversion complete', stderr: 'conversion warning' }));
        await commands['aventus.sharp.export'].run(uri(sharp));
        await commands['aventus.php.export'].run(uri(php));
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2][1]),
            ['compiling', 'success', 'compiling', 'success']);
        assert.deepEqual(events.filter(e => e[0] === 'error'), []);
        assert.deepEqual(events.filter(e => e[0] === 'warning').map(e => e[1]),
            ['conversion warning', 'conversion warning']);
    });
});

test('converter stderr with an Error marker produces an error state', async () => {
    await fixture(async ({ root, events, result }) => {
        for (const executable of ['dotnet', 'csharp-converter', 'php', 'php-converter']) available.add(executable);
        const sharp = join(root, 'aventus.sharp.avt');
        const php = join(root, 'aventus.php.avt');
        writeFileSync(sharp, JSON.stringify({ csProj: 'Demo.csproj' }));
        writeFileSync(php, '{}');
        result(async () => ({ stdout: 'conversion complete', stderr: 'Error : conversion failed' }));
        const previousClear = console.clear;
        const previousError = GenericServer.error;
        console.clear = () => {};
        GenericServer.error = () => {};
        try {
            await commands['aventus.sharp.export'].run(uri(sharp));
            await commands['aventus.php.export'].run(uri(php));
        } finally {
            console.clear = previousClear;
            GenericServer.error = previousError;
        }
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2][1]),
            ['compiling', 'error', 'compiling', 'error']);
        assert.deepEqual(events.filter(e => e[1] === 'aventus/addDebugFile').map(e => e[2][1]),
            ['Error : conversion failed', 'Error : conversion failed']);
        assert.deepEqual(events.filter(e => e[0] === 'warning'), []);
    });
});

test('converter process failures notify an error but leave both projects in compiling state until retry', async () => {
    await fixture(async ({ root, events, result }) => {
        for (const executable of ['dotnet', 'csharp-converter', 'php', 'php-converter']) available.add(executable);
        const sharp = join(root, 'aventus.sharp.avt');
        const php = join(root, 'aventus.php.avt');
        writeFileSync(sharp, JSON.stringify({ csProj: 'Demo.csproj' }));
        writeFileSync(php, '{}');
        result(async () => { throw new Error('converter exited 1'); });
        await commands['aventus.sharp.export'].run(uri(sharp));
        await commands['aventus.php.export'].run(uri(php));
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2][1]),
            ['compiling', 'compiling']);
        assert.deepEqual(events.filter(e => e[0] === 'error').map(e => e[1]),
            ['Error: converter exited 1', 'Error: converter exited 1']);
        result(async () => ({ stdout: 'OK', stderr: '' }));
        await commands['aventus.sharp.export'].run(uri(sharp));
        await commands['aventus.php.export'].run(uri(php));
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2][1]),
            ['compiling', 'compiling', 'compiling', 'success', 'compiling', 'success']);
    });
});
