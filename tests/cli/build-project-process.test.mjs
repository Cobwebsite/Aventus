import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cli = resolve('cli/out/cli.js');

test('packaged build writes output, reports a source error, then succeeds after correction', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-real-build-'));
  const config = join(directory, 'aventus.conf.avt');
  const source = join(directory, 'src', 'Widget.lib.avt');
  const outputFile = join(directory, 'dist', 'Demo.js');
  const run = () => {
    const result = spawnSync(process.execPath, [cli, 'build', config, '--json'], {
      cwd: directory, env: { ...process.env, APPDATA: directory },
      encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.stderr, '');
    return { status: result.status, value: JSON.parse(result.stdout) };
  };
  try {
    mkdirSync(join(directory, 'src'));
    writeFileSync(config, JSON.stringify({
      module: 'Demo', componentPrefix: 'dm',
      build: [{ name: 'Main', src: ['./src/*'], compile: [{ output: './dist/Demo.js' }] }],
    }));
    writeFileSync(source, 'export class Widget {}');
    const first = run();
    assert.equal(first.status, 0);
    assert.equal(first.value.builds['Demo@Main'].success, true);
    assert.equal(existsSync(outputFile), true);
    assert.ok(readFileSync(outputFile, 'utf8').length > 0);
    assert.ok(Object.keys(first.value.builds['Demo@Main'].outputSize).some(path => path.endsWith('/dist/Demo.js')));

    writeFileSync(source, 'export class Widget {');
    const broken = run();
    assert.equal(broken.status, 1);
    assert.equal(broken.value.success, false);
    assert.ok(Object.values(broken.value.builds['Demo@Main'].diagnostics).flat().some(item => item.type === 'error'));

    writeFileSync(source, 'export class Widget {}');
    const corrected = run();
    assert.equal(corrected.status, 0);
    assert.equal(corrected.value.builds['Demo@Main'].success, true);
    assert.deepEqual(corrected.value.builds['Demo@Main'].diagnostics, {});
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  assert.equal(existsSync(directory), false);
});
