import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const existsPath = require.resolve('command-exists');
const previousCache = require.cache[existsPath];
const previousExec = childProcess.exec;
const available = new Set();
const executions = [];
const fakeExec = () => { throw new Error('external command must not run'); };
fakeExec[promisify.custom] = async command => { executions.push(command); return { stdout: 'OK', stderr: '' }; };
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

async function withFixture(run) {
    const previous = {
        server: GenericServer.instance,
        sharp: CSharpManager.getInstance,
        php: PhpManager.getInstance,
    };
    const events = [];
    const sharpFiles = {};
    const phpFiles = {};
    CSharpManager.getInstance = () => ({ files: sharpFiles });
    PhpManager.getInstance = () => ({ files: phpFiles });
    GenericServer.instance = { logLevel: 4, _extensionPath: 'D:\\extension', connection: {
        ask: async () => false,
        showErrorMessage: value => events.push(['error', value]),
        sendNotification: (...args) => events.push(['notification', ...args]),
    } };
    available.clear();
    executions.length = 0;
    try {
        await run({ events, sharpFiles, phpFiles });
    } finally {
        CSharpManager.getInstance = previous.sharp;
        PhpManager.getInstance = previous.php;
        GenericServer.instance = previous.server;
    }
}

test('Sharp export without a config explains the absence and avoids converter execution', async () => {
    await withFixture(async ({ events }) => {
        available.add('dotnet');
        available.add('csharp-converter');
        await commands['aventus.sharp.export'].run();
        assert.deepEqual(events, [['error', 'No aventus.sharp.avt found']]);
        assert.deepEqual(executions, []);
    });
});

test('missing Sharp converter and declined installation report actionable error', async () => {
    await withFixture(async ({ events }) => {
        available.add('dotnet');
        await commands['aventus.sharp.export'].run();
        assert.match(events[0][1], /Can't find the converter/);
        assert.deepEqual(executions, []);
    });
});

test('PHP converter missing with no Composer stops before any install or export', async () => {
    await withFixture(async ({ events }) => {
        available.add('php');
        await commands['aventus.php.export'].run();
        assert.deepEqual(events, [['error', "composer isn't installed on your system"]]);
        assert.deepEqual(executions, []);
    });
});

test('PHP export without a config explains the absence and avoids converter execution', async () => {
    await withFixture(async ({ events }) => {
        available.add('php');
        available.add('php-converter');
        await commands['aventus.php.export'].run();
        assert.deepEqual(events, [['error', 'No aventus.php.avt found']]);
        assert.deepEqual(executions, []);
    });
});
