import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const updates = [];
const errors = [];
const emmet = {
  extensionsPath: ['D:/old/lib/emmet/aventus.json', 'D:/other/tool.json'],
  async update(...args) { updates.push(args); },
};
const vscode = {
  window: { showErrorMessage(message) { errors.push(message); } },
  ConfigurationTarget: { Global: 1, Workspace: 2 },
  ExtensionMode: { Production: 1 },
  workspace: {
    getConfiguration(name) { return name === 'emmet' ? emmet : {}; },
    onDidChangeConfiguration() { return { dispose() {} }; },
  },
};
globalThis.__aventusEmmetClient = { context: { extensionMode: 1, extensionPath: 'D:/new' } };
const result = await build({ entryPoints: ['client/src/Settings.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'singleton-double', setup(build) {
    build.onResolve({ filter: /\.\/Singleton$/ }, () => ({ path: 'singleton', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Singleton = { client: globalThis.__aventusEmmetClient };', loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const manager = module.exports.SettingsManager.getInstance();

test('production settings replace stale Aventus Emmet path and preserve other extensions', async () => {
  // The constructor invokes applyDefault asynchronously; repeat explicitly to await the update.
  await manager.applyDefault();
  const current = join('D:/new', 'lib', 'emmet', 'aventus.json');
  assert.deepEqual(emmet.extensionsPath, ['D:/other/tool.json', current]);
  assert.ok(updates.length >= 1);
  assert.deepEqual(updates.at(-1), ['extensionsPath', emmet.extensionsPath, 1, undefined]);
  const before = updates.length;
  await manager.applyDefault();
  assert.equal(updates.length, before);
  assert.deepEqual(emmet.extensionsPath.filter(path => path === current), [current]);
});

test('failed Emmet update reports an error and keeps the in-memory path', async () => {
  const current = join('D:/new', 'lib', 'emmet', 'aventus.json');
  globalThis.__aventusEmmetClient.context.extensionPath = 'D:/next';
  const next = join('D:/next', 'lib', 'emmet', 'aventus.json');
  const originalUpdate = emmet.update;
  let attempts = 0;
  emmet.update = async () => { attempts++; throw new Error('configuration write failed'); };
  try {
    await manager.applyDefault();
    assert.deepEqual(emmet.extensionsPath, ['D:/other/tool.json', next]);
    assert.equal(attempts, 1);
    assert.deepEqual(errors, ['Error: configuration write failed']);
    await manager.applyDefault();
    assert.equal(attempts, 1);
    assert.ok(!emmet.extensionsPath.includes(current));
  } finally {
    emmet.update = originalUpdate;
    globalThis.__aventusEmmetClient.context.extensionPath = 'D:/new';
  }
});
