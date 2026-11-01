import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({
  entryPoints: ['client/src/file-system/FileSystem.ts'], absWorkingDir: process.cwd(),
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'auto-loader-double', setup(build) {
    build.onResolve({ filter: /^\.\.\/manifest\/AutoLoader$/ }, () => ({ path: 'auto-loader', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const AutoLoader = { htmlManifest: "vscode.html-custom-data.json", emmetManifest: "emmet.json", getInstance: () => ({ register: async () => {} }) };', loader: 'js' }));
  } }],
});
const callbacks = {};
const commands = [];
let disposed = false;
const vscode = {
  commands: { executeCommand(...args) { commands.push(args); } },
  workspace: {
    createFileSystemWatcher() { return {
      onDidCreate(callback) { callbacks.create = callback; },
      onDidChange(callback) { callbacks.change = callback; },
      onDidDelete(callback) { callbacks.delete = callback; },
      dispose() { disposed = true; },
    }; },
    onWillRenameFiles(callback, context) { callbacks.rename = event => callback.call(context, event); return { dispose() {} }; },
  },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { FileSystem } = module.exports;
const uri = path => ({ toString: () => pathToFileURL(path).href });

test('VS Code file events on temporary files reach the actual Aventus commands', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aventus-client-files-'));
  const fs = new FileSystem();
  try {
    const created = join(root, 'created.avt');
    const updated = join(root, 'updated.avt');
    const deleted = join(root, 'deleted.avt');
    await writeFile(created, 'new');
    await writeFile(updated, 'before');
    await writeFile(deleted, 'old');
    await callbacks.create(uri(created));
    await callbacks.change(uri(created));
    await writeFile(updated, 'after');
    await callbacks.change(uri(updated));
    await rm(deleted);
    await callbacks.delete(uri(deleted));
    await fs.sendStack();
    assert.deepEqual(commands, [
      ['aventus.filesystem.deleted', uri(deleted).toString()],
      ['aventus.filesystem.created', uri(created).toString()],
      ['aventus.filesystem.updated', uri(updated).toString()],
    ]);
    const renamed = join(root, 'renamed.avt');
    await rename(created, renamed);
    callbacks.rename({ files: [{ oldUri: uri(created), newUri: uri(renamed) }] });
    assert.deepEqual(commands.at(-1), ['aventus.rename', [{ oldUri: uri(created).toString(), newUri: uri(renamed).toString() }]]);
  } finally {
    fs.stop();
    await rm(root, { recursive: true, force: true });
  }
  assert.equal(disposed, true);
});

test('rename event still dispatches the actual command after FileSystem.stop', () => {
  commands.length = 0;
  const fs = new FileSystem();
  fs.stop();
  callbacks.rename({ files: [{ oldUri: { toString: () => 'file:///old.avt' }, newUri: { toString: () => 'file:///new.avt' } }] });
  assert.deepEqual(commands, [['aventus.rename', [{ oldUri: 'file:///old.avt', newUri: 'file:///new.avt' }]]]);
});
