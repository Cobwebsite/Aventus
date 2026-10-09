import assert from 'node:assert/strict';
import Module from 'node:module';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

test('environment installer passes the extension bin path as data to a hidden PowerShell process',
    { skip: process.platform !== 'win32' }, async () => {
    const originalLoad = Module._load;
    const calls = [];
    Module._load = function (request, parent, isMain) {
        const loaded = originalLoad.call(this, request, parent, isMain);
        if (request !== 'child_process') return loaded;
        return {
            ...loaded,
            execFile(file, args, options, callback) {
                calls.push({ file, args, options });
                callback(null, '', '');
            },
        };
    };
    let environment;
    try {
        environment = await loadServerModule('environment.ts');
    } finally {
        Module._load = originalLoad;
    }

    const extension = join(process.cwd(), "extension' with spaces");
    await environment.initEnvironnment(extension);
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(calls.length, 1);
    const { file, args, options } = calls[0];
    assert.match(file.toLowerCase(), /powershell\.exe$/);
    assert.deepEqual(args.slice(0, 5), [
        '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    ]);
    assert.equal(options.windowsHide, true);
    assert.equal(options.env.AVENTUS_VARIABLE_NAME, 'AVENTUS_BIN');
    assert.equal(options.env.AVENTUS_BIN_PATH, resolve(extension, 'lib', 'bin'));
    assert.equal(args[5], '-Command');
    assert.ok(!args[6].includes(extension));
    assert.match(args[6], /\$env:AVENTUS_BIN_PATH/);
});
