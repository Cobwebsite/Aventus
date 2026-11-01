import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const registered = [];
const events = [];
const virtual = {
  './cmds': 'export const Commands = { allCommandes: { "aventus.test": { middleware: async args => args.map(value => value + "-mapped") }, "aventus.cancel": { middleware: async () => null } } };',
  './component': 'export class AvenutsVsComponent {}',
  './file-system/FileSystem': 'export class FileSystem { constructor() { this.id = ++globalThis.__aventusLifecycle.nextFileSystemId; globalThis.__aventusLifecycle.events.push(["fileSystem.create", this.id]); } stop() { globalThis.__aventusLifecycle.events.push(["fileSystem.stop", this.id]); } }',
  './notification': 'export const Notifications = { allNotifications: { "aventus/sample": { action(value) { globalThis.__aventusLifecycle.events.push(["notification", value]); } } } };',
  './file-system/DebugFile': 'export class DebugFile { static schema = "avdebug"; }',
  './cmds-internal': 'export const CommandsInternal = { allCommandes: { "aventus.internal": { middleware(...args) { globalThis.__aventusLifecycle.events.push(["internal", args]); } } } };',
  './cmds/ReloadSettings': 'export const ReloadSettings = { execute() { globalThis.__aventusLifecycle.events.push("settings.reload"); } };',
  './manifest/AutoLoader': 'export const AutoLoader = { getInstance() { return {}; } };',
  './customEditors/AventusI18nEditor': 'export const AventusI18nEditor = { register() { return { dispose() {} }; }, filtersByUri: globalThis.__aventusLifecycle.filters };',
  './customEditors/AventusDBEditor': 'export const AventusDBEditor = { register() { return { dispose() {} }; } };',
  './communication/i18n/GetKeyFromPosition': 'export const GetKeyFromPosition = { execute: async () => "greeting" };',
  './Settings': 'export const SettingsManager = { getInstance() { return {}; } };',
  './ProtocolHandler': 'export class ProtocolHandler { dispose() {} }',
};
globalThis.__aventusLifecycle = { events, filters: {}, nextFileSystemId: 0 };
const result = await build({ entryPoints: ['client/src/Client.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'client-dependencies', setup(build) {
    build.onResolve({ filter: /^\.\// }, args => args.importer.endsWith('Client.ts') ? { path: args.path, namespace: 'test' } : undefined);
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: virtual[args.path], loader: 'js' }));
  } }],
});
const vscode = {
  Uri: { parse: value => ({ value }) },
  Position: class { constructor(line, character) { Object.assign(this, { line, character }); } },
  Range: class { constructor(start, end) { Object.assign(this, { start, end }); } },
  Location: class { constructor(uri, range) { Object.assign(this, { uri, range }); } },
  workspace: {
    registerTextDocumentContentProvider(schema) { registered.push(['provider', schema]); return { dispose() {} }; },
    onDidChangeConfiguration(callback) { const handle = { kind: 'config', callback, disposed: false, dispose() { this.disposed = true; } }; registered.push(handle); return handle; },
  },
  commands: { registerCommand(name, callback) { const handle = { kind: 'command', name, callback, disposed: false, dispose() { this.disposed = true; } }; registered.push(handle); return handle; } },
};
class LanguageClient {
  constructor(id, name, serverOptions, clientOptions) { this.serverOptions = serverOptions; this.clientOptions = clientOptions; }
  handleFailedRequest(_type, _token, _error, defaultValue) { return defaultValue; }
  onNotification(name, callback) { const handle = { kind: 'notification', name, callback, disposed: false, dispose() { this.disposed = true; } }; registered.push(handle); return handle; }
  async start() { events.push('languageClient.start'); }
  async stop() { events.push('languageClient.stop'); }
}
const languageClient = { LanguageClient, TransportKind: { ipc: 9 }, LocationLink: { is: value => 'targetUri' in value } };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => {
  if (name === 'vscode') return vscode;
  if (name === 'vscode-languageclient/node') return languageClient;
  return require(name);
});
const { Client } = module.exports;

test('client initialization registers providers, notifications and command before starting LSP', async () => {
  const client = new Client();
  const context = { subscriptions: [], extensionPath: 'D:/extension', globalStorageUri: { fsPath: 'D:/storage' }, asAbsolutePath: path => `D:/extension/${path}` };
  await client.init(context);
  assert.equal(context.subscriptions.length, 4);
  assert.ok(registered.some(item => item.kind === 'command' && item.name === 'aventus.internal'));
  const notification = registered.find(item => item.kind === 'notification' && item.name === 'aventus/sample');
  assert.ok(notification);
  notification.callback(['payload']);
  assert.deepEqual(events.at(-1), ['notification', 'payload']);
  assert.equal(client.client.clientOptions.initializationOptions.savePath, 'D:/storage');
  assert.ok(events.includes('languageClient.start'));
  client.startFileSystem();
  await client.stop();
  assert.equal(events.at(-2)[0], 'fileSystem.stop');
  assert.equal(events.at(-1), 'languageClient.stop');
});

test('LSP middleware maps commands, suppresses cancelled commands and stores i18n navigation filter', async () => {
  const client = new Client();
  const options = client.createClientOption({ globalStorageUri: { fsPath: 'D:/storage' }, extensionPath: 'D:/extension' });
  const sent = [];
  await options.middleware.executeCommand('aventus.test', ['value'], (command, args) => sent.push([command, args]));
  await options.middleware.executeCommand('aventus.cancel', ['value'], (command, args) => sent.push([command, args]));
  assert.deepEqual(sent, [['aventus.test', ['value-mapped']]]);
  const location = { uri: { toString: () => 'file:///labels.i18n.avt' }, range: { start: { line: 0, character: 0 } } };
  const result = await options.middleware.provideDefinition({}, {}, {}, async () => location);
  assert.equal(result, location);
  assert.equal(globalThis.__aventusLifecycle.filters['file:///labels.i18n.avt'], 'greeting');
});

test('definition middleware filters each i18n target in mixed location arrays', async () => {
  const client = new Client();
  const options = client.createClientOption({ globalStorageUri: { fsPath: 'D:/storage' }, extensionPath: 'D:/extension' });
  const uri = value => ({ toString: () => value });
  const locations = [
    { uri: uri('file:///first.i18n.avt'), range: { start: { line: 1, character: 2 } } },
    { targetUri: uri('file:///second.i18n.avt'), targetRange: { start: { line: 3, character: 4 } } },
    { uri: uri('file:///plain.avt'), range: { start: { line: 5, character: 6 } } },
  ];
  const result = await options.middleware.provideDefinition({}, {}, {}, async () => locations);
  assert.equal(result, locations);
  assert.equal(globalThis.__aventusLifecycle.filters['file:///first.i18n.avt'], 'greeting');
  assert.equal(globalThis.__aventusLifecycle.filters['file:///second.i18n.avt'], 'greeting');
  assert.equal(globalThis.__aventusLifecycle.filters['file:///plain.avt'], undefined);
});

test('client stop leaves command and configuration listener registrations active', () => {
  const command = registered.find(item => item.kind === 'command');
  const configuration = registered.find(item => item.kind === 'config');
  assert.equal(command.disposed, false);
  assert.equal(configuration.disposed, false);
  configuration.callback();
  assert.equal(events.at(-1), 'settings.reload');
});

test('registered internal command forwards its arguments to the selected middleware', () => {
  const command = registered.find(item => item.kind === 'command' && item.name === 'aventus.internal');
  command.callback('first', { id: 2 });
  assert.deepEqual(events.at(-1), ['internal', ['first', { id: 2 }]]);
});

test('initialization callbacks currently run again if initDone is called twice', async () => {
  const client = new Client();
  let calls = 0;
  client.onInit(() => calls++);
  const waiting = client.waitInit();
  client.initDone();
  await waiting;
  assert.equal(calls, 1);
  client.onInit(() => calls++);
  assert.equal(calls, 2);
  client.initDone();
  assert.equal(calls, 3);
});

test('starting file system twice replaces the watcher without stopping the first one', async () => {
  const client = new Client();
  events.length = 0;
  client.startFileSystem();
  client.startFileSystem();
  assert.deepEqual(events.map(event => event[0]), ['fileSystem.create', 'fileSystem.create']);
  await client.stop();
  assert.deepEqual(events.map(event => event[0]), ['fileSystem.create', 'fileSystem.create', 'fileSystem.stop']);
  assert.equal(events[2][1], events[1][1]);
});

test('client intercepts code action resolve failures and delegates other failures', async () => {
  const client = new Client();
  const context = { subscriptions: [], extensionPath: 'D:/extension', globalStorageUri: { fsPath: 'D:/storage' }, asAbsolutePath: path => `D:/extension/${path}` };
  await client.init(context);
  const fallback = { title: 'Keep action' };
  assert.equal(client.client.handleFailedRequest({ method: 'codeAction/resolve' }, undefined, new Error('failed'), fallback), fallback);
  assert.equal(client.client.handleFailedRequest({ method: 'textDocument/hover' }, undefined, new Error('failed'), fallback), fallback);
  await client.stop();
});

test('activation routes notification and internal command through the same client before shutdown', async () => {
  const client = new Client();
  const context = { subscriptions: [], extensionPath: 'D:/extension', globalStorageUri: { fsPath: 'D:/storage' }, asAbsolutePath: path => `D:/extension/${path}` };
  const start = registered.length;
  events.length = 0;
  await client.init(context);
  const newRegistrations = registered.slice(start);
  const notification = newRegistrations.find(item => item.kind === 'notification');
  const command = newRegistrations.find(item => item.kind === 'command');
  notification.callback(['ready']);
  command.callback('manual');
  client.startFileSystem();
  await client.stop();
  assert.deepEqual(events, [
    'languageClient.start', ['notification', 'ready'], ['internal', ['manual']],
    ['fileSystem.create', globalThis.__aventusLifecycle.nextFileSystemId],
    ['fileSystem.stop', globalThis.__aventusLifecycle.nextFileSystemId], 'languageClient.stop',
  ]);
  assert.equal(context.subscriptions.length, 4);
});

test('client stop leaves LSP notification registrations active', async () => {
  const client = new Client();
  const context = { subscriptions: [], extensionPath: 'D:/extension', globalStorageUri: { fsPath: 'D:/storage' }, asAbsolutePath: path => `D:/extension/${path}` };
  const start = registered.length;
  await client.init(context);
  const notification = registered.slice(start).find(item => item.kind === 'notification');
  await client.stop();
  assert.equal(notification.disposed, false);
  notification.callback(['after-stop']);
  assert.deepEqual(events.at(-1), ['notification', 'after-stop']);
});

test('code lens middleware converts reference command URI, position and locations', async () => {
  const client = new Client();
  const options = client.createClientOption({ globalStorageUri: { fsPath: 'D:/storage' }, extensionPath: 'D:/extension' });
  const lenses = [
    { command: { command: 'editor.action.showReferences', arguments: [
      'file:///source.avt', { line: 2, character: 3 },
      [{ uri: 'file:///target.avt', range: { start: { line: 4, character: 5 }, end: { line: 4, character: 8 } } }],
    ] } },
    { command: { command: 'other.command', arguments: ['untouched'] } },
  ];
  const result = await options.middleware.provideCodeLenses({}, {}, async () => lenses);
  assert.equal(result, lenses);
  assert.deepEqual(lenses[0].command.arguments, [
    { value: 'file:///source.avt' },
    new vscode.Position(2, 3),
    [new vscode.Location({ value: 'file:///target.avt' }, new vscode.Range({ line: 4, character: 5 }, { line: 4, character: 8 }))],
  ]);
  assert.deepEqual(lenses[1].command.arguments, ['untouched']);
});
