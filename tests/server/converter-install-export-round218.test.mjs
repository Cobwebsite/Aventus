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
const available = new Set(['dotnet', 'php', 'composer']);
const executions = [];
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = async command => {
    executions.push(command);
    if (command.startsWith('dotnet tool install')) available.add('csharp-converter');
    if (command.startsWith('composer global require')) available.add('php-converter');
    return { stdout: 'Conversion complete', stderr: '' };
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
const [{ Commands }, { GenericServer }] = modules;
const uri = path => `file:///${path.replaceAll('\\', '/')}`;

test('Sharp and PHP install a missing converter after approval and export in the same request', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-install-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const previousError = GenericServer.error;
    t.after(() => {
        GenericServer.instance = previousServer;
        GenericServer.error = previousError;
    });
    const events = [];
    const prompts = [];
    GenericServer.instance = { logLevel: 4, _extensionPath: root, connection: {
        ask: async message => { prompts.push(message); return true; },
        showLoadingMessage: async (_message, action) => action(),
        sendNotification: (...args) => events.push(args),
        showErrorMessage: message => events.push(['error', message]),
    } };
    GenericServer.error = () => {};
    const sharp = join(root, 'aventus.sharp.avt');
    const php = join(root, 'aventus.php.avt');
    writeFileSync(sharp, JSON.stringify({ csProj: 'Demo.csproj' }));
    writeFileSync(php, '{}');
    writeFileSync(join(root, 'composer.json'), JSON.stringify({ name: 'vendor/demo' }));

    await Commands.allCommandes['aventus.sharp.export'].run(uri(sharp));
    await Commands.allCommandes['aventus.php.export'].run(uri(php));

    assert.equal(prompts.length, 2);
    assert.deepEqual(executions.map(command => command.split(' ')[0]), [
        'dotnet', 'csharp-converter', 'composer', 'php-converter',
    ]);
    assert.deepEqual(events.filter(([method]) => method === 'aventus/sharp/compiling').map(([, value]) => value), [
        ['Demo.csproj', 'compiling', undefined],
        ['Demo.csproj', 'success', undefined],
        ['vendor/demo', 'compiling', undefined],
        ['vendor/demo', 'success', undefined],
    ]);
    assert.deepEqual(events.filter(([method]) => method === 'error'), []);
});
