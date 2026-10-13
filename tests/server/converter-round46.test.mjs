import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const existsPath = require.resolve('command-exists');
const previousCache = require.cache[existsPath];
const previousExec = childProcess.exec;
const available = new Set();
const executions = [];
let execResults = [];
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = async (command, options) => {
    executions.push([command, options]);
    const result = execResults.shift();
    if (result instanceof Error) throw result;
    return result ?? { stdout: 'OK', stderr: '' };
};
require.cache[existsPath] = { id: existsPath, filename: existsPath, loaded: true,
    exports: { sync: name => available.has(name) } };
childProcess.exec = fakeExec;
let modules;
try {
    modules = await loadServerModules(['cmds/index.ts', 'GenericServer.ts',
        'language-services/json/CSharpManager.ts', 'language-services/json/PhpManager.ts']);
} finally {
    childProcess.exec = previousExec;
    if (previousCache) require.cache[existsPath] = previousCache;
    else delete require.cache[existsPath];
}
const [commandModule, serverModule, sharpModule, phpModule] = modules;
const commands = commandModule.Commands.allCommandes;
const { GenericServer } = serverModule;
const { CSharpManager } = sharpModule;
const { PhpManager } = phpModule;

async function fixture(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-round46-'));
    const previous = { server: GenericServer.instance,
        sharp: CSharpManager.getInstance, php: PhpManager.getInstance };
    const events = [];
    const sharpFiles = {};
    const phpFiles = {};
    let selection;
    CSharpManager.getInstance = () => ({ files: sharpFiles });
    PhpManager.getInstance = () => ({ files: phpFiles });
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        sendNotification: (...args) => events.push(['notification', ...args]),
        showErrorMessage: message => events.push(['error', message]),
        showInformationMessage: message => events.push(['info', message]),
        showLoadingMessage: async (_message, action) => action(),
        ask: async () => false,
        Select: async items => { events.push(['select', items]); return selection; },
    } };
    available.clear(); executions.length = 0; execResults = [];
    try {
        await run({ root, events, sharpFiles, phpFiles,
            select: item => { selection = item; }, results: items => { execResults = items; } });
    } finally {
        GenericServer.instance = previous.server;
        CSharpManager.getInstance = previous.sharp;
        PhpManager.getInstance = previous.php;
        rmSync(root, { recursive: true, force: true });
    }
}

const uri = path => `file:///${path.replaceAll('\\', '/')}`;

test('Sharp selection among two configs uses selected project name and permits another export', async () => {
    await fixture(async ({ root, events, sharpFiles, select }) => {
        available.add('dotnet'); available.add('csharp-converter');
        const first = join(root, 'first', 'aventus.sharp.avt');
        const second = join(root, 'second', 'aventus.sharp.avt');
        mkdirSync(join(root, 'first')); mkdirSync(join(root, 'second'));
        writeFileSync(first, JSON.stringify({ csProj: 'First.csproj' }));
        writeFileSync(second, JSON.stringify({ csProj: 'Second.csproj' }));
        sharpFiles[uri(first)] = {}; sharpFiles[uri(second)] = {};
        select({ label: uri(second) });
        await commands['aventus.sharp.export'].run();
        await commands['aventus.sharp.export'].run(uri(first));
        assert.deepEqual(events.find(e => e[0] === 'select')[1].map(e => e.label), [uri(first), uri(second)]);
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2]), [
            ['Second.csproj', 'compiling', undefined], ['Second.csproj', 'success', undefined],
            ['First.csproj', 'compiling', undefined], ['First.csproj', 'success', undefined],
        ]);
        assert.equal(executions.length, 2);
        assert.match(executions[0][0], /second.*aventus\.sharp\.avt/);
        assert.match(executions[1][0], /first.*aventus\.sharp\.avt/);
    });
});

test('Sharp update tools continues after first tool writes stderr and reports only successful tool', async () => {
    await fixture(async ({ events, results }) => {
        available.add('dotnet'); available.add('csharp-converter'); available.add('db-query');
        results([{ stdout: '', stderr: 'converter failed' }, { stdout: 'updated', stderr: '' }]);
        await commands['aventus.sharp.update_tools'].run();
        assert.deepEqual(executions.map(e => e[0]), [
            'dotnet tool update --global AventusSharp.Converter',
            'dotnet tool update --global AventusSharp.DatabaseQuery',
        ]);
        assert.deepEqual(events.filter(e => e[0] === 'error').map(e => e[1]), ['converter failed']);
        assert.deepEqual(events.filter(e => e[0] === 'info').map(e => e[1]), ['Update done for : db-query']);
    });
});

test('PHP export uses composer project name and recovers after a failed conversion', async () => {
    await fixture(async ({ root, events, results }) => {
        available.add('php'); available.add('php-converter');
        const config = join(root, 'aventus.php.avt');
        writeFileSync(config, '{}');
        writeFileSync(join(root, 'composer.json'), JSON.stringify({ name: 'vendor/demo' }));
        results([new Error('conversion failed'), { stdout: 'OK', stderr: '' }]);
        await commands['aventus.php.export'].run(uri(config));
        await commands['aventus.php.export'].run(uri(config));
        assert.equal(executions.length, 2);
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2]), [
            ['vendor/demo', 'compiling', undefined], ['vendor/demo', 'compiling', undefined],
            ['vendor/demo', 'success', undefined],
        ]);
        assert.match(events.find(e => e[0] === 'error')[1], /conversion failed/);
    });
});

test('PHP converter error output publishes the debug file and error state for its composer project', async () => {
    await fixture(async ({ root, events, results }) => {
        available.add('php'); available.add('php-converter');
        const config = join(root, 'aventus.php.avt');
        writeFileSync(config, '{}');
        writeFileSync(join(root, 'composer.json'), JSON.stringify({ name: 'vendor/demo' }));
        results([{ stdout: 'Error : invalid declaration', stderr: '' }]);
        const previousClear = console.clear;
        const previousError = GenericServer.error;
        console.clear = () => {};
        GenericServer.error = () => {};
        try {
            await commands['aventus.php.export'].run(uri(config));
        } finally {
            console.clear = previousClear;
            GenericServer.error = previousError;
        }
        assert.deepEqual(events.filter(e => e[0] === 'notification').map(e => [e[1], e[2]]), [
            ['aventus/sharp/compiling', ['vendor/demo', 'compiling', undefined]],
            ['aventus/addDebugFile', ['php_errors', 'Error : invalid declaration']],
            ['aventus/sharp/compiling', ['vendor/demo', 'error', [{ title: 'PHP error', file: 'php_errors' }]]],
        ]);
    });
});

test('converter process failure releases the Sharp compilation guard for a later retry', async () => {
    await fixture(async ({ root, events, results }) => {
        available.add('dotnet'); available.add('csharp-converter');
        const config = join(root, 'aventus.sharp.avt');
        writeFileSync(config, JSON.stringify({ csProj: 'Demo.csproj' }));
        results([new Error('process exited 1'), { stdout: 'OK', stderr: '' }]);
        await commands['aventus.sharp.export'].run(uri(config));
        await commands['aventus.sharp.export'].run(uri(config));
        assert.equal(executions.length, 2);
        assert.deepEqual(events.filter(e => e[1] === 'aventus/sharp/compiling').map(e => e[2]), [
            ['Demo.csproj', 'compiling', undefined],
            ['Demo.csproj', 'compiling', undefined],
            ['Demo.csproj', 'success', undefined],
        ]);
        assert.match(events.find(e => e[0] === 'error')[1], /process exited 1/);
    });
});

test('converter commands receive the exact config and phar paths, including spaces', async () => {
    await fixture(async ({ root }) => {
        available.add('dotnet'); available.add('csharp-converter');
        available.add('php'); available.add('php-converter');
        const configRoot = join(root, 'space in directory');
        mkdirSync(configRoot);
        const sharpConfig = join(configRoot, 'aventus.sharp.avt');
        const phpConfig = join(configRoot, 'aventus.php.avt');
        writeFileSync(sharpConfig, '{}');
        writeFileSync(phpConfig, '{}');
        await commands['aventus.sharp.export'].run(uri(sharpConfig));
        await commands['aventus.php.export'].run(uri(phpConfig));
        assert.equal(executions.length, 2);
        assert.equal(executions[0][0], `csharp-converter ${sharpConfig.replaceAll('\\', '/')}`);
        assert.equal(executions[1][0], `php-converter ${phpConfig.replaceAll('\\', '/')} 2>&1`);
    });
});

test('tool update process rejection stops later tools and a later invocation can retry', async () => {
    await fixture(async ({ events, results }) => {
        available.add('dotnet'); available.add('csharp-converter'); available.add('db-query');
        results([new Error('update process exited 1')]);
        await assert.rejects(commands['aventus.sharp.update_tools'].run(), /update process exited 1/);
        assert.deepEqual(executions.map(e => e[0]), ['dotnet tool update --global AventusSharp.Converter']);
        assert.deepEqual(events.filter(e => e[0] === 'info' || e[0] === 'error'), []);
        results([{ stdout: 'updated converter', stderr: '' }, { stdout: 'updated db', stderr: '' }]);
        await commands['aventus.sharp.update_tools'].run();
        assert.deepEqual(executions.slice(1).map(e => e[0]), [
            'dotnet tool update --global AventusSharp.Converter',
            'dotnet tool update --global AventusSharp.DatabaseQuery',
        ]);
        assert.deepEqual(events.filter(e => e[0] === 'info').map(e => e[1]), [
            'Update done for : csharp-converter, db-query',
        ]);
    });
});
