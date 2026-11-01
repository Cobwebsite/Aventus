import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = `export { FileSystem } from './client/src/file-system/FileSystem.ts'; export { AutoLoader } from './client/src/manifest/AutoLoader.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'file-system-auto-loader-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'file-command-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/cmds\/file-system\/|\.\.\/cmds\/Rename$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => {
      const name = args.path.split('/').at(-1);
      return { contents: `export const ${name} = { execute: uri => globalThis.__aventusFileIntegration.notifications.push(['${name}', uri]) };`, loader: 'js' };
    });
  } }],
});
const notifications = [], writes = [], prompts = [], callbacks = {};
const values = { aventus: { preventCustomData: [] }, html: { customData: [] }, emmet: { extensionsPath: [] } };
globalThis.__aventusFileIntegration = { notifications };
const vscode = {
  ConfigurationTarget: { Workspace: 2 },
  window: { async showQuickPick(items, options) { prompts.push(options.title); return { label: 'Yes' }; } },
  workspace: {
    workspaceFolders: [{ uri: { toString: () => 'file:///project' } }],
    getConfiguration(section) { return {
      get(key) { return values[section][key]; },
      async update(key, value, target) { writes.push([section, key, [...value], target]); values[section][key] = [...value]; },
    }; },
    onDidChangeConfiguration() { return { dispose() {} }; },
    onWillRenameFiles(callback) { callbacks.rename = callback; return { dispose() {} }; },
    createFileSystemWatcher(pattern) { callbacks.pattern = pattern; return {
      onDidCreate(callback) { callbacks.create = callback; },
      onDidChange(callback) { callbacks.change = callback; },
      onDidDelete(callback) { callbacks.delete = callback; },
      dispose() {},
    }; },
  },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { FileSystem } = module.exports;
const uri = path => ({ toString: () => `file:///project/${path}` });

test('file watcher registers a created HTML manifest and sends .avt creation separately', async () => {
  const fileSystem = new FileSystem();
  assert.match(callbacks.pattern, /vscode\.html-custom-data\.json/);
  await callbacks.create(uri('app/vscode.html-custom-data.json'));
  assert.deepEqual(writes, [['html', 'customData', ['./app/vscode.html-custom-data.json'], 2]]);
  assert.equal(prompts.length, 1);
  assert.deepEqual(notifications, []);
  await callbacks.create(uri('app/component.avt'));
  await fileSystem.sendStack();
  assert.deepEqual(notifications, [['FileCreated', 'file:///project/app/component.avt']]);
  fileSystem.stop();
});
