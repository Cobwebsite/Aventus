import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const handles = [], statusItems = new Map(), events = [];
globalThis.__aventusIntegrated = { client: undefined, settings: { settings: { ideBuild: true }, onSettingsChange() {} } };
const virtual = {
  './cmds': 'export const Commands = { allCommandes: {} };',
  './file-system/FileSystem': 'export class FileSystem { stop() {} }',
  './file-system/DebugFile': 'export class DebugFile { static schema = "avdebug"; }',
  './cmds-internal': 'export const CommandsInternal = { allCommandes: {} };',
  './cmds/ReloadSettings': 'export const ReloadSettings = { execute() {} };',
  './manifest/AutoLoader': 'export const AutoLoader = { getInstance() { return {}; } };',
  './customEditors/AventusI18nEditor': 'export const AventusI18nEditor = { register() { return { dispose() {} }; }, filtersByUri: {} };',
  './customEditors/AventusDBEditor': 'export const AventusDBEditor = { register() { return { dispose() {} }; } };',
  './communication/i18n/GetKeyFromPosition': 'export const GetKeyFromPosition = { execute: async () => null };',
  './Settings': 'export const SettingsManager = { getInstance: () => globalThis.__aventusIntegrated.settings };',
  './ProtocolHandler': 'export class ProtocolHandler { dispose() {} }',
};
const result = await build({
  entryPoints: ['client/src/Client.ts'], absWorkingDir: process.cwd(),
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'integrated-client-dependencies', setup(build) {
    build.onResolve({ filter: /^\.\// }, args => {
      if (!args.importer.endsWith('Client.ts')) return;
      if (args.path === './notification') return { path: 'selected-notifications', namespace: 'test' };
      if (virtual[args.path]) return { path: args.path, namespace: 'test' };
    });
    build.onResolve({ filter: /(?:^|\/)Singleton$|(?:^|\/)InitStep$|(?:^|\/)file-system\/DebugFile$|(?:^|\/)Settings$/ }, args => {
      if (args.path.endsWith('Singleton')) return { path: 'singleton', namespace: 'test' };
      if (args.path.endsWith('InitStep')) return { path: 'init-step', namespace: 'test' };
      if (args.path.endsWith('DebugFile')) return { path: './file-system/DebugFile', namespace: 'test' };
      if (args.path.endsWith('Settings')) return { path: './Settings', namespace: 'test' };
    });
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({
      contents: args.path === 'selected-notifications'
        ? "import { Compiled } from './client/src/notification/Compiled.ts'; import { ServerStart } from './client/src/notification/httpServer/ServerStart.ts'; import { ServerStop } from './client/src/notification/httpServer/ServerStop.ts'; export const Notifications = { allNotifications: { [Compiled.cmd]: Compiled, [ServerStart.cmd]: ServerStart, [ServerStop.cmd]: ServerStop } };"
        : args.path === 'singleton'
          ? 'export const Singleton = { get client() { return globalThis.__aventusIntegrated.client; } };'
          : args.path === 'init-step'
            ? 'export const InitStep = { isDone: true };'
            : virtual[args.path],
      loader: 'js', resolveDir: process.cwd(),
    }));
  } }],
});
const vscode = {
  StatusBarAlignment: { Right: 2 },
  ThemeColor: class { constructor(id) { this.id = id; } },
  window: { createStatusBarItem(name) {
    const item = { name, visible: false, show() { this.visible = true; }, hide() { this.visible = false; } };
    statusItems.set(name, item); return item;
  } },
  workspace: {
    registerTextDocumentContentProvider() { return { dispose() {} }; },
    onDidChangeConfiguration() { return { dispose() {} }; },
  },
  commands: { registerCommand() { return { dispose() {} }; } },
};
class LanguageClient {
  handleFailedRequest(_type, _token, _error, fallback) { return fallback; }
  onNotification(name, callback) { const handle = { name, callback, disposed: false, dispose() { this.disposed = true; } }; handles.push(handle); return handle; }
  async start() { events.push('start'); }
  async stop() { events.push('stop'); }
}
const languageClient = { LanguageClient, TransportKind: { ipc: 1 }, LocationLink: { is: value => 'targetUri' in value } };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => {
  if (name === 'vscode') return vscode;
  if (name === 'vscode-languageclient/node') return languageClient;
  return require(name);
});
const { Client } = module.exports;

test('one client routes successive LSP notifications to its status items through shutdown', async () => {
  const client = new Client();
  globalThis.__aventusIntegrated.client = client;
  const context = { subscriptions: [], extensionPath: 'D:/extension', globalStorageUri: { fsPath: 'D:/storage' }, asAbsolutePath: path => `D:/extension/${path}` };
  await client.init(context);
  const notify = (name, ...args) => handles.find(handle => handle.name === name).callback(args);
  const compilation = statusItems.get('last-compiled-info');
  const server = statusItems.get('running-server');
  notify('aventus/compiled', 'web', [{ file: 'web/error', title: 'Broken' }]);
  assert.equal(compilation.command, 'aventus.openfile.debug');
  assert.equal(server.visible, true);
  notify('aventus/server/start', 'http://localhost:8080');
  assert.equal(server.command, 'aventus.liveserver.stop');
  notify('aventus/compiled', 'web', []);
  assert.match(compilation.text, /web compiled at/);
  notify('aventus/server/stop');
  assert.equal(server.command, 'aventus.liveserver.start');
  await client.stop();
  assert.deepEqual(events, ['start', 'stop']);
  assert.ok(handles.every(handle => handle.disposed));
});
