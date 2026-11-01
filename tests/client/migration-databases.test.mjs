import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
let routes;
globalThis.__aventusMigrationRoutes = { set(value) { routes = value; } };
const result = await build({ entryPoints: ['client/src/webview/migration.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'migration-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/tool$|\.\.\/customEditors\/_Communication$|^command-exists$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('tool')
      ? 'export const getNonce = () => "nonce"; export const pathToUri = path => path; export const uriToPath = uri => uri;'
      : args.path === 'command-exists'
        ? 'export const sync = () => false;'
        : 'export class Communication { constructor() { this.routes = {}; globalThis.__aventusMigrationRoutes.set(this.routes); } addRoute(route) { this.routes[route.channel] = route.callback; } addRouteWithResponse(route) { this.routes[route.channel] = route.callback; } }', loader: 'js' }));
  } }],
});
const directory = mkdtempSync(join(tmpdir(), 'aventus-migration-test-'));
const databaseFile = join(directory, '.aventus', 'databases.json');
mkdirSync(join(directory, '.aventus'));
const original = { source: [{ UUID: 'old', Type: 'sqlite', SavePassword: true, Database: 'old' }], target: [] };
writeFileSync(databaseFile, JSON.stringify(original));
const secrets = new Map([['db_pass_old', 'old-password']]);
const secretEvents = [];
const opened = [];
const context = { extensionUri: { path: '/extension' }, secrets: {
  async get(key) { return secrets.get(key); },
  async store(key, value) { secretEvents.push(['store', key, value]); secrets.set(key, value); },
  async delete(key) { secretEvents.push(['delete', key]); secrets.delete(key); },
} };
const vscode = {
  ViewColumn: { Active: 1 }, Uri: { joinPath: () => ({}), parse: value => ({ value }) },
  window: {
    createWebviewPanel() { return { webview: {} }; },
    async showOpenDialog() { return [{ fsPath: directory }]; },
    showTextDocument(uri) { opened.push(uri); },
  },
  workspace: { workspaceFolders: [{ uri: { toString: () => directory } }] },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AventusMigration } = module.exports;

test('migration route reads saved credentials and persists changed database metadata', async t => {
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const migration = new AventusMigration();
  migration.setHtmlForWebview = () => {};
  migration.getPreview(context);
  const loaded = await routes.getDatabases();
  assert.equal(loaded.source[0].Password, 'old-password');
  const next = { source: [{ UUID: 'new', Type: 'sqlite', SavePassword: true, Password: 'new-password', Database: 'new' }], target: [] };
  await routes.setDatabases(next);
  const stored = JSON.parse(readFileSync(databaseFile, 'utf8'));
  assert.equal(stored.source[0].Password, undefined);
  assert.equal(stored.source[0].Database, 'new');
  assert.deepEqual(secretEvents, [['store', 'db_pass_new', 'new-password'], ['delete', 'db_pass_old']]);
  assert.equal(secrets.get('db_pass_new'), 'new-password');
  assert.equal(secrets.has('db_pass_old'), false);
  const queries = [];
  migration.executeDbQuery = async payload => {
    queries.push(payload);
    if (payload.Query === 'SELECT 1 as result') return [{ result: 1 }];
    return [{ metadata_json_to_import: '{"tables":[]}' }];
  };
  const db = { Type: 'sqlite', Database: 'demo', Host: 'localhost', Username: 'alice', Password: 'secret' };
  assert.equal(await routes.testConnection(db), true);
  assert.deepEqual(await routes.getSchema(db), { tables: [] });
  assert.equal(queries[0].Password, 'secret');
  assert.equal(queries[0].Query, 'SELECT 1 as result');
  assert.match(queries[1].Query, /sqlite/i);
  assert.equal(await routes.chooseFolder(), directory);
  await routes.writeFile({ folder: directory, filename: 'schema.json', content: '{"ok":true}' });
  assert.equal(readFileSync(join(directory, 'schema.json'), 'utf8'), '{"ok":true}');
  assert.deepEqual(opened, [{ value: join(directory, 'schema.json') }]);
  migration.executeDbQuery = async () => { throw new Error('database unavailable'); };
  assert.equal(await routes.testConnection(db), false);
  assert.equal(await routes.getSchema(db), undefined);
  vscode.window.showOpenDialog = async () => undefined;
  assert.equal(await routes.chooseFolder(), undefined);
});

test('migration replacement across source and target cleans old secrets and reports write failures', async t => {
  const secondDirectory = mkdtempSync(join(tmpdir(), 'aventus-migration-multiple-'));
  t.after(() => rmSync(secondDirectory, { recursive: true, force: true }));
  mkdirSync(join(secondDirectory, '.aventus'));
  const file = join(secondDirectory, '.aventus', 'databases.json');
  writeFileSync(file, JSON.stringify({
    source: [{ UUID: 'source-old', Type: 'sqlite', SavePassword: true }],
    target: [{ UUID: 'target-old', Type: 'sqlite', SavePassword: true }],
  }));
  vscode.workspace.workspaceFolders = [{ uri: { toString: () => secondDirectory } }];
  secrets.set('db_pass_source-old', 'source-secret');
  secrets.set('db_pass_target-old', 'target-secret');
  secretEvents.length = 0;
  const next = {
    source: [{ UUID: 'source-new', Type: 'sqlite', SavePassword: true, Password: 'new-source' }],
    target: [{ UUID: 'target-new', Type: 'sqlite', SavePassword: true, Password: 'new-target' }],
  };
  await routes.setDatabases(next);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).source.map(db => db.UUID), ['source-new']);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).target.map(db => db.UUID), ['target-new']);
  assert.deepEqual(secretEvents, [
    ['store', 'db_pass_source-new', 'new-source'], ['store', 'db_pass_target-new', 'new-target'],
    ['delete', 'db_pass_source-old'], ['delete', 'db_pass_target-old'],
  ]);
  assert.equal(secrets.get('db_pass_source-new'), 'new-source');
  assert.equal(secrets.get('db_pass_target-new'), 'new-target');
  assert.equal(secrets.has('db_pass_source-old'), false);
  assert.equal(secrets.has('db_pass_target-old'), false);
  const beforeOpened = opened.length;
  await assert.rejects(routes.writeFile({ folder: join(secondDirectory, 'missing'), filename: 'schema.json', content: '{}' }), /ENOENT/);
  assert.equal(opened.length, beforeOpened);
});
