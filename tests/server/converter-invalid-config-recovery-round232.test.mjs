import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const existsPath = require.resolve('command-exists');
const previousCache = require.cache[existsPath];
const previousExec = childProcess.exec;
const commandsRun = [];
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = async command => {
    commandsRun.push(command);
    return { stdout: 'Conversion complete', stderr: '' };
};
require.cache[existsPath] = { id: existsPath, filename: existsPath, loaded: true,
    exports: { sync: name => ['dotnet', 'csharp-converter', 'php', 'php-converter'].includes(name) } };
childProcess.exec = fakeExec;
let modules;
try {
    modules = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);
} finally {
    childProcess.exec = previousExec;
    if (previousCache) require.cache[existsPath] = previousCache;
    else delete require.cache[existsPath];
}
const [{ Commands }, { GenericServer }] = modules;

test('Sharp export continues after invalid config JSON and recovers its project name after correction', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-sharp-config-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.sharp.avt');
    const uri = `file:///${path.replaceAll('\\', '/')}`;
    const previousServer = GenericServer.instance;
    const previousError = GenericServer.error;
    const events = [];
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        sendNotification: (...args) => events.push(args),
        showErrorMessage: message => events.push(['error', message]),
    } };
    GenericServer.error = () => {};
    t.after(() => {
        GenericServer.instance = previousServer;
        GenericServer.error = previousError;
    });
    commandsRun.length = 0;

    writeFileSync(path, '{"csProj":');
    await Commands.allCommandes['aventus.sharp.export'].run(uri);
    assert.equal(commandsRun.length, 1);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/sharp/compiling').map(([, payload]) => payload), [
        ['', 'compiling', undefined], ['', 'success', undefined],
    ]);

    writeFileSync(path, '{"csProj":"Recovered.csproj"}');
    await Commands.allCommandes['aventus.sharp.export'].run(uri);
    assert.equal(commandsRun.length, 2);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/sharp/compiling').map(([, payload]) => payload).slice(2), [
        ['Recovered.csproj', 'compiling', undefined], ['Recovered.csproj', 'success', undefined],
    ]);
});

test('PHP export continues after invalid composer JSON and recovers its project name after correction', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-php-composer-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.php.avt');
    const uri = `file:///${path.replaceAll('\\', '/')}`;
    writeFileSync(path, '{}');
    const composer = join(root, 'composer.json');
    const previousServer = GenericServer.instance;
    const previousError = GenericServer.error;
    const events = [];
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        sendNotification: (...args) => events.push(args),
        showErrorMessage: message => events.push(['error', message]),
    } };
    GenericServer.error = () => {};
    t.after(() => {
        GenericServer.instance = previousServer;
        GenericServer.error = previousError;
    });
    commandsRun.length = 0;

    writeFileSync(composer, '{"name":');
    await Commands.allCommandes['aventus.php.export'].run(uri);
    assert.equal(commandsRun.length, 1);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/sharp/compiling').map(([, payload]) => payload), [
        ['', 'compiling', undefined], ['', 'success', undefined],
    ]);

    writeFileSync(composer, '{"name":"vendor/recovered"}');
    await Commands.allCommandes['aventus.php.export'].run(uri);
    assert.equal(commandsRun.length, 2);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/sharp/compiling').map(([, payload]) => payload).slice(2), [
        ['vendor/recovered', 'compiling', undefined], ['vendor/recovered', 'success', undefined],
    ]);
});
