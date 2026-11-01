import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const notifications = [];
globalThis.__aventusDiskWatcher = notifications;
const result = await build({ entryPoints: ['cli/src/file-system/FileSystem.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'command-doubles', setup(build) {
    build.onResolve({ filter: /^@server\// }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => {
      if (args.path === '@server/tools') return { contents: 'export const pathToUri = path => path;', loader: 'js' };
      const name = args.path.split('/').at(-1);
      return { contents: `export const ${name} = { run: path => globalThis.__aventusDiskWatcher.push(['${name}', path]) };`, loader: 'js' };
    });
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { FilesWatcher } = module.exports;

async function waitForNotification(count) {
  for (let attempt = 0; attempt < 60 && notifications.length < count; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(notifications.length, count);
}

test('CLI watcher reports .avt creation, changes, deletion and coalesced bursts from disk', async t => {
  notifications.length = 0;
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-watcher-'));
  const file = join(directory, 'sample.avt');
  const ignoredFile = join(directory, 'sample.txt');
  const watcher = new FilesWatcher(directory);
  t.after(async () => {
    await watcher.stop();
    rmSync(directory, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Watcher not ready')), 5000);
    watcher.watcher.once('ready', () => { clearTimeout(timeout); resolve(); });
  });
  assert.ok(Object.keys(watcher.watcher.getWatched()).length > 0);
  writeFileSync(ignoredFile, 'ignored');
  writeFileSync(file, 'one');
  await waitForNotification(1);
  assert.deepEqual(notifications, [['FileCreated', file]]);

  writeFileSync(file, 'two');
  await waitForNotification(2);
  assert.deepEqual(notifications.at(-1), ['FileUpdated', file]);

  unlinkSync(file);
  await waitForNotification(3);
  assert.deepEqual(notifications.at(-1), ['FileDeleted', file]);

  writeFileSync(file, 'three');
  await waitForNotification(4);
  writeFileSync(file, 'four');
  writeFileSync(file, 'five');
  await waitForNotification(5);
  assert.deepEqual(notifications.slice(3), [['FileCreated', file], ['FileUpdated', file]]);
});
