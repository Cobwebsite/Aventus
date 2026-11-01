import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const opened = [];
const settings = [];
let builds = [];
let selection;
const picks = [];
const closed = [];
const previews = [];
globalThis.__aventusInternalCommands = { opened, closed, previews, client: { context: undefined }, get builds() { return builds; } };
const source = `export { OpenDebugFile } from './client/src/cmds-internal/OpenDebugFile.ts'; export { OpenDebugFileSharp } from './client/src/cmds-internal/sharp/OpenDebugFile.ts'; export { OpenDebugFilePhp } from './client/src/cmds-internal/php/OpenDebugFile.ts'; export { EnableBuild } from './client/src/cmds-internal/EnableBuild.ts'; export { OpenFile } from './client/src/cmds-internal/i18n/OpenFile.ts'; export { Migration } from './client/src/cmds-internal/Migration.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'internal-commands-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'notification-doubles', setup(build) {
    build.onResolve({ filter: /notification\/Compiled$|notification\/(?:sharp|php)\/Compiling$|customEditors\/AventusI18nEditor$|\.\.\/Singleton$|webview\/migration$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('Compiled')
      ? 'export const Compiled = { getBuilds: () => globalThis.__aventusInternalCommands.builds, openDebug: name => globalThis.__aventusInternalCommands.opened.push(name) };'
      : args.path.endsWith('Singleton')
        ? 'export const Singleton = { client: globalThis.__aventusInternalCommands.client };'
      : args.path.endsWith('migration')
        ? 'export class AventusMigration { getPreview(context) { globalThis.__aventusInternalCommands.previews.push(context); } }'
      : args.path.endsWith('AventusI18nEditor')
        ? 'export const AventusI18nEditor = { close: uri => globalThis.__aventusInternalCommands.closed.push(uri) };'
        : `export const Compiling = { openDebug: () => globalThis.__aventusInternalCommands.opened.push(${JSON.stringify(args.path.includes('/php/') ? 'php' : 'sharp')}) };`, loader: 'js' }));
  } }],
});
const vscode = {
  window: { activeTextEditor: undefined, async showQuickPick(items, options) { picks.push({ items, options }); return selection; } },
  Uri: { file: path => ({ fsPath: path }) },
  commands: { async executeCommand(...args) { settings.push(args); } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { OpenDebugFile, OpenDebugFileSharp, OpenDebugFilePhp, EnableBuild, OpenFile, Migration } = module.exports;

test('debug command skips empty builds and opens the only build directly', async () => {
  builds = [];
  await OpenDebugFile.middleware([]);
  assert.deepEqual(opened, []);
  assert.deepEqual(picks, []);
  builds = ['web'];
  await OpenDebugFile.middleware([]);
  assert.deepEqual(opened, ['web']);
  assert.deepEqual(picks, []);
});

test('debug command offers multiple builds and ignores cancellation', async () => {
  builds = ['web', 'api'];
  selection = undefined;
  await OpenDebugFile.middleware([]);
  assert.deepEqual(opened, ['web']);
  assert.deepEqual(picks.at(-1).items, [{ label: 'web', detail: '' }, { label: 'api', detail: '' }]);
  assert.deepEqual(picks.at(-1).options, { canPickMany: false, title: 'Choose a build to debug' });
  selection = { label: 'api' };
  await OpenDebugFile.middleware([]);
  assert.deepEqual(opened, ['web', 'api']);
});

test('Sharp and PHP debug commands dispatch to their own actions', async () => {
  await OpenDebugFileSharp.middleware([]);
  await OpenDebugFilePhp.middleware([]);
  await EnableBuild.middleware([]);
  assert.deepEqual(opened.slice(-2), ['sharp', 'php']);
  assert.deepEqual(settings, [['workbench.action.openSettings', 'aventus.ideBuild']]);
});

test('i18n open command switches between custom and default editors', async () => {
  const uri = { fsPath: 'D:/project/labels.i18n.avt', toString: () => 'file:///project/labels.i18n.avt' };
  vscode.window.activeTextEditor = {};
  await OpenFile.middleware(uri);
  assert.deepEqual(settings.slice(-2), [
    ['workbench.action.closeActiveEditor'],
    ['vscode.openWith', { fsPath: uri.fsPath }, 'aventus.i18n'],
  ]);
  vscode.window.activeTextEditor = undefined;
  await OpenFile.middleware(uri);
  assert.equal(closed.at(-1), uri.toString());
  assert.deepEqual(settings.at(-1), ['vscode.openWith', { fsPath: uri.fsPath }, 'default']);
});

test('migration command opens only with an extension context', async () => {
  await Migration.middleware([]);
  assert.deepEqual(previews, []);
  const context = { id: 'extension' };
  globalThis.__aventusInternalCommands.client.context = context;
  await Migration.middleware([]);
  assert.deepEqual(previews, [context]);
});
