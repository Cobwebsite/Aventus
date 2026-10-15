import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const commandExistsPath = require.resolve('command-exists');
const previousCache = require.cache[commandExistsPath];
const previousExec = childProcess.exec;
const available = new Set(['dotnet', 'csharp-converter', 'db-query']);
const calls = [];
let failDatabase = true;
const fakeExec = () => { throw new Error('callback execution is not expected'); };
fakeExec[promisify.custom] = async command => {
    calls.push(command);
    return command.includes('DatabaseQuery') && failDatabase
        ? { stdout: '', stderr: 'database update failed' }
        : { stdout: 'updated', stderr: '' };
};
require.cache[commandExistsPath] = {
    id: commandExistsPath, filename: commandExistsPath, loaded: true,
    exports: { sync: name => available.has(name) },
};
childProcess.exec = fakeExec;
let modules;
try {
    modules = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);
} finally {
    childProcess.exec = previousExec;
    if (previousCache) require.cache[commandExistsPath] = previousCache;
    else delete require.cache[commandExistsPath];
}
const [{ Commands }, { GenericServer }] = modules;

test('Sharp tool update reports partial success, then retries both tools successfully', async t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    const events = [];
    GenericServer.instance = { connection: {
        showLoadingMessage: async (message, action) => {
            events.push(['loading', message]);
            return action();
        },
        showErrorMessage: message => events.push(['error', message]),
        showInformationMessage: message => events.push(['info', message]),
    } };

    await Commands.allCommandes['aventus.sharp.update_tools'].run();
    assert.deepEqual(calls, [
        'dotnet tool update --global AventusSharp.Converter',
        'dotnet tool update --global AventusSharp.DatabaseQuery',
    ]);
    assert.deepEqual(events, [
        ['loading', 'Updating csharp-converter'],
        ['loading', 'Updating db-query'],
        ['error', 'database update failed'],
        ['info', 'Update done for : csharp-converter'],
    ]);

    failDatabase = false;
    calls.length = 0;
    events.length = 0;
    await Commands.allCommandes['aventus.sharp.update_tools'].run();
    assert.deepEqual(calls, [
        'dotnet tool update --global AventusSharp.Converter',
        'dotnet tool update --global AventusSharp.DatabaseQuery',
    ]);
    assert.deepEqual(events, [
        ['loading', 'Updating csharp-converter'],
        ['loading', 'Updating db-query'],
        ['info', 'Update done for : csharp-converter, db-query'],
    ]);
});
