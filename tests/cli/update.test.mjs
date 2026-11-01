import assert from 'node:assert/strict';
import test from 'node:test';
import Module, { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { version } = require('../../cli/package.json');
const entry = resolve('cli/src/commands/Update.ts');
const result = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', packages: 'external', external: ['../../package.json'], write: false });
const filename = `${entry}.test-bundle.cjs`;
const bundled = new Module(filename);
bundled.filename = filename;
bundled.paths = Module._nodeModulePaths(dirname(filename));
bundled._compile(result.outputFiles[0].text, filename);
const { Update } = bundled.exports;

test('update skips installation when npm reports the current version', async () => {
  const calls = [];
  const update = new Update();
  update.runNpm = async (args, inherit) => { calls.push([args, inherit]); return ` ${version}\n`; };
  const originalLog = console.log;
  const output = [];
  console.log = message => output.push(message);
  try { await update.run([], {}); }
  finally { console.log = originalLog; }
  assert.deepEqual(calls, [[['view', '@aventusjs/cli', 'version'], undefined]]);
  assert.match(output[0], /already up to date/);
});

test('update installs locally when global package is absent', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-update-'));
  const calls = [];
  const update = new Update();
  update.runNpm = async (args, inherit) => {
    calls.push([args, inherit]);
    if (args[0] === 'view') return '99.0.0\n';
    if (args[0] === 'root') return `${directory}\n`;
    return '';
  };
  const originalLog = console.log;
  console.log = () => {};
  try { await update.run([], {}); }
  finally { console.log = originalLog; rmSync(directory, { recursive: true, force: true }); }
  assert.deepEqual(calls, [
    [['view', '@aventusjs/cli', 'version'], undefined],
    [['root', '--global'], undefined],
    [['install', '--save-dev', '@aventusjs/cli@99.0.0'], true],
  ]);
});

test('update rejects empty registry versions without attempting installation', async () => {
  const calls = [];
  const update = new Update();
  update.runNpm = async args => { calls.push(args); return '  '; };
  await assert.rejects(update.run([], {}), /npm did not return a version/);
  assert.deepEqual(calls, [['view', '@aventusjs/cli', 'version']]);
});
