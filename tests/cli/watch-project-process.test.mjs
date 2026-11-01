import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cli = resolve('cli/out/cli.js');

test('packaged watch reports a real source error and its correction', { timeout: 20000 }, async () => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-real-watch-'));
  const config = join(directory, 'aventus.conf.avt');
  const source = join(directory, 'src', 'Widget.lib.avt');
  let child;
  try {
    mkdirSync(join(directory, 'src'));
    writeFileSync(config, JSON.stringify({
      module: 'Demo', componentPrefix: 'dm',
      build: [{ name: 'Main', src: ['./src/*'], compile: [{ output: './dist/Demo.js' }] }],
    }));
    writeFileSync(source, 'export class Widget {}');
    child = spawn(process.execPath, [cli, 'watch', config, '--json'], {
      cwd: directory, env: { ...process.env, APPDATA: directory }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const snapshots = [];
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      let end;
      while ((end = stdout.indexOf('\n}\n')) !== -1) {
        const candidate = stdout.slice(0, end + 2);
        stdout = stdout.slice(end + 3);
        snapshots.push(JSON.parse(candidate));
      }
    });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const waitFor = async predicate => {
      for (let attempt = 0; attempt < 160; attempt++) {
        if (snapshots.some(predicate)) return;
        if (child.exitCode !== null) throw new Error(`watch exited early: ${child.exitCode} ${stderr}`);
        await new Promise(resolve => setTimeout(resolve, 75));
      }
      throw new Error(`watch result timed out: ${JSON.stringify(snapshots)} ${stderr}`);
    };
    await waitFor(value => value.success === true);
    writeFileSync(source, 'export class Widget {');
    await waitFor(value => value.success === false);
    writeFileSync(source, 'export class Widget {}');
    await waitFor((value, index) => value.success === true && index > snapshots.findIndex(snapshot => !snapshot.success));
    assert.equal(stderr, '');
  } finally {
    if (child && child.exitCode === null) {
      child.kill('SIGINT');
      await new Promise(resolve => { child.once('exit', resolve); setTimeout(() => { child.kill(); resolve(); }, 2000).unref(); });
    }
    rmSync(directory, { recursive: true, force: true });
  }
  assert.equal(existsSync(directory), false);
});
