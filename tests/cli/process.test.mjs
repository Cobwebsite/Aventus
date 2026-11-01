import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { version } = require('../../cli/package.json');
const entry = resolve('cli/out/cli.js');
function run(...args) {
  return spawnSync(process.execPath, [entry, ...args], { cwd: process.cwd(), encoding: 'utf8', timeout: 10000 });
}

test('packaged CLI prints help and version as a child process', () => {
  const help = run('--help');
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Usage: aventus/);
  assert.match(help.stdout, /build \[options\]/);
  assert.match(help.stdout, /check \[options\]/);
  const versionResult = run('--version');
  assert.equal(versionResult.status, 0, versionResult.stderr);
  assert.equal(versionResult.stdout.trim(), version);
});

test('packaged CLI rejects unknown command and missing option value', () => {
  const unknown = run('unknown-command');
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /unknown command/);
  const missing = run('build', '--builds');
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /argument missing/);
});

test('packaged CLI exposes nested template, dependency and AI commands', () => {
  for (const [group, child] of [
    ['template', 'install'], ['dependencies', 'help-llm'], ['ai', 'prepare'],
  ]) {
    const help = run(group, '--help');
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, new RegExp(`\\b${child}\\b`));
    const childHelp = run(group, child, '--help');
    assert.equal(childHelp.status, 0, childHelp.stderr);
    assert.match(childHelp.stdout, new RegExp(`Usage: aventus ${group} ${child}`));
  }
});
