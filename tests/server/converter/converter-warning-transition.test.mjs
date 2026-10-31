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
const outputs = [];
const calls = [];
const fakeExecFile = () => { throw new Error('Unexpected callback invocation'); };
fakeExecFile[promisify.custom] = async (command, args) => {
    calls.push([command, args]);
    return outputs.shift();
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

test('Sharp and PHP report non-error stderr as warnings and replace it with clean success', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-converter-warning-'));
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
        showWarningMessage: message => events.push(['warning', message]),
        showErrorMessage: message => events.push(['error', message]),
    } };
    t.after(() => { GenericServer.instance = previousServer; });
    calls.length = 0;
    outputs.length = 0;
    outputs.push(
        { stdout: 'Sharp complete', stderr: '  Sharp warning\n' },
        { stdout: 'PHP complete', stderr: '  PHP warning\n' },
        { stdout: 'Sharp complete', stderr: '' },
        { stdout: 'PHP complete', stderr: '' },
    );

    for (const candidate of [sharp, php, sharp, php]) {
        const command = candidate === sharp ? 'aventus.sharp.export' : 'aventus.php.export';
        await Commands.allCommandes[command].run(uri(candidate));
    }

    assert.deepEqual(calls.map(([command]) => command),
        ['csharp-converter', 'php-converter', 'csharp-converter', 'php-converter']);
    assert.deepEqual(events.filter(([name]) => name === 'warning'), [
        ['warning', 'Sharp warning'], ['warning', 'PHP warning'],
    ]);
    assert.deepEqual(events.filter(([name]) => name === 'error' || name === 'aventus/addDebugFile'), []);
    assert.deepEqual(events.filter(([name]) => name === 'aventus/sharp/compiling').map(([, value]) => value), [
        ['Example.csproj', 'compiling', undefined], ['Example.csproj', 'success', undefined],
        ['vendor/example', 'compiling', undefined], ['vendor/example', 'success', undefined],
        ['Example.csproj', 'compiling', undefined], ['Example.csproj', 'success', undefined],
        ['vendor/example', 'compiling', undefined], ['vendor/example', 'success', undefined],
    ]);
});
