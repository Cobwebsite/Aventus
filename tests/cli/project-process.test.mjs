import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cli = resolve('cli/out/cli.js');

test('packaged check returns JSON for a temporary minimal project', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-project-'));
  const config = join(directory, 'aventus.conf.avt');
  writeFileSync(config, JSON.stringify({ module: 'Test' }));
  let result;
  try {
    result = spawnSync(process.execPath, [cli, 'check', config, '--json'], {
      cwd: directory, encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(typeof output.success, 'boolean');
    assert.equal(typeof output.builds, 'object');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  assert.equal(existsSync(directory), false);
});

test('packaged check returns JSON for the Empty template project shape', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-template-'));
  const config = join(directory, 'aventus.conf.avt');
  mkdirSync(join(directory, 'src'));
  writeFileSync(config, JSON.stringify({
    module: 'Demo', componentPrefix: 'd',
    build: [{ name: 'Main', src: ['./src/*'], compile: [{ output: './dist/Demo.js' }] }],
  }));
  try {
    const result = spawnSync(process.execPath, [cli, 'check', config, '--json'], {
      cwd: directory, encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(typeof output.success, 'boolean');
    assert.equal(typeof output.builds, 'object');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  assert.equal(existsSync(directory), false);
});

test('packaged build returns JSON for a temporary project', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-build-'));
  const config = join(directory, 'aventus.conf.avt');
  mkdirSync(join(directory, 'src'));
  writeFileSync(config, JSON.stringify({
    module: 'Demo', componentPrefix: 'd',
    build: [{ name: 'Main', src: ['./src/*'], compile: [{ output: './dist/Demo.js' }] }],
  }));
  try {
    const result = spawnSync(process.execPath, [cli, 'build', config, '--json'], {
      cwd: directory, encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(typeof output.success, 'boolean');
    assert.equal(typeof output.builds, 'object');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  assert.equal(existsSync(directory), false);
});
