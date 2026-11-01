import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const writes = [];
const listeners = [];
let updateBarrier;
let aventus = { liveserver: { port: 9000 }, readDirs: ['src'] };
let html = { customData: ['first.json'] };
const workspace = {
  getConfiguration(section) {
    if (section === 'aventus') return { ...aventus, async update(key, value, target) { if (updateBarrier) await updateBarrier; writes.push([key, value, target]); } };
    if (section === 'html') return html;
    return {};
  },
  onDidChangeConfiguration(callback) { listeners.push(callback); return { dispose() {} }; },
};
const vscode = { workspace, ExtensionMode: { Production: 1 }, ConfigurationTarget: { Global: 1, Workspace: 2 } };
const source = `export { SettingsManager } from './client/src/Settings.ts'; export { SetSettings } from './client/src/notification/SetSettings.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'settings-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'singleton-double', setup(build) {
    build.onResolve({ filter: /\.\/Singleton$/ }, () => ({ path: 'singleton', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Singleton = { client: { context: undefined } };', loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const manager = module.exports.SettingsManager.getInstance();
const { SetSettings } = module.exports;

test('settings merge nested defaults and reload fresh values on configuration change', () => {
  assert.equal(listeners.length, 1);
  assert.equal(manager.settings.liveserver.port, 9000);
  assert.equal(manager.settings.liveserver.host, '0.0.0.0');
  assert.deepEqual(manager.settings.readDirs, ['src']);
  assert.deepEqual(manager.settingsHtml.customData, ['first.json']);
  let changed = 0;
  let htmlChanged = 0;
  manager.onSettingsChange(() => changed++);
  manager.onSettingsChangeHtml(() => htmlChanged++);
  aventus = { liveserver: { delay: 25 } };
  html = { customData: ['second.json'] };
  listeners[0]();
  assert.equal(manager.settings.liveserver.port, 8080);
  assert.equal(manager.settings.liveserver.delay, 25);
  assert.deepEqual(manager.settings.readDirs, []);
  assert.deepEqual(manager.settingsHtml.customData, ['second.json']);
  assert.equal(changed, 1);
  assert.equal(htmlChanged, 1);
});

test('setting updates use the requested VS Code configuration target', async () => {
  await manager.setSettings({ debug: true, readDirs: ['app'] }, false);
  await manager.setSettings({ debug: false }, true);
  assert.deepEqual(writes, [
    ['debug', true, 2], ['readDirs', ['app'], 2], ['debug', false, 1],
  ]);
});

test('successive configuration changes rebuild defaults without retaining prior values', () => {
  const snapshots = [];
  manager.onSettingsChange(() => snapshots.push({ ...manager.settings.liveserver }));
  aventus = { liveserver: { port: 7001, delay: 10 } };
  listeners[0]();
  aventus = { liveserver: { port: 7002 } };
  listeners[0]();
  assert.equal(snapshots.length, 2);
  assert.deepEqual(snapshots.map(value => [value.port, value.delay]), [[7001, 10], [7002, 200]]);
  assert.equal(manager.settings.liveserver.port, 7002);
});

test('settings callbacks currently remain registered after their consumer is done', () => {
  let calls = 0;
  manager.onSettingsChange(() => calls++);
  listeners[0]();
  listeners[0]();
  assert.equal(calls, 2);
  assert.equal(typeof manager.onSettingsChange(() => {}), 'undefined');
});

test('invalid configuration values currently pass through the defaults merge', () => {
  aventus = { liveserver: null, readDirs: 'src' };
  html = { customData: null };
  listeners[0]();
  assert.equal(manager.settings.liveserver, null);
  assert.equal(manager.settings.readDirs, 'src');
  assert.equal(manager.settingsHtml.customData, null);
  aventus = {};
  html = {};
  listeners[0]();
  assert.equal(manager.settings.liveserver.port, 8080);
  assert.deepEqual(manager.settings.readDirs, []);
  assert.deepEqual(manager.settingsHtml.customData, []);
});

test('setsettings notification forwards settings but finishes before the write completes', async () => {
  const before = writes.length;
  let release;
  updateBarrier = new Promise(resolve => { release = resolve; });
  try {
    const response = await SetSettings.action({ debug: true }, false);
    assert.equal(response, undefined);
    assert.equal(writes.length, before);
  } finally {
    updateBarrier = undefined;
    release();
  }
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(writes.slice(before), [['debug', true, 2]]);
});
