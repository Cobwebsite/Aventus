import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

test('CLI watcher currently watches no paths with its glob pattern on a temporary directory', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'aventus-cli-watcher-'));
  const file = join(directory, 'sample.avt');
  const watcher = new FilesWatcher(directory);
  t.after(async () => {
    await watcher.watcher.close();
    rmSync(directory, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Watcher not ready')), 5000);
    watcher.watcher.once('ready', () => { clearTimeout(timeout); resolve(); });
  });
  assert.deepEqual(watcher.watcher.getWatched(), {});
  writeFileSync(file, 'one');
  await new Promise(resolve => setTimeout(resolve, 150));
  await watcher.sendStack();
  assert.deepEqual(notifications, []);
});
