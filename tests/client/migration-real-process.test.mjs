import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const commandExists = require('command-exists');
const available = commandExists.sync('dotnet') && commandExists.sync('db-query');
const routes = new Map();
globalThis.__aventusRealMigrationRoutes = routes;
const result = await build({
  entryPoints: ['client/src/webview/migration.ts'], absWorkingDir: process.cwd(),
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'migration-view-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/tool$|\.\.\/customEditors\/_Communication$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('tool')
      ? 'export const getNonce = () => "nonce"; export const pathToUri = path => path; export const uriToPath = uri => uri;'
      : 'export class Communication { addRouteWithResponse(route) { globalThis.__aventusRealMigrationRoutes.set(route.channel, route.callback); } addRoute(route) { globalThis.__aventusRealMigrationRoutes.set(route.channel, route.callback); } }', loader: 'js' }));
  } }],
});
const messages = [];
const vscode = {
  ViewColumn: { Active: 1 },
  Uri: { joinPath(base, ...parts) { return { path: [base.path, ...parts].join('/') }; } },
  window: {
    showErrorMessage(message) { messages.push(message); },
    createWebviewPanel() { return { webview: {} }; },
  },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AventusMigration } = module.exports;
const migration = new AventusMigration();
const payload = Query => ({ Type: 'sqlite', Host: '', Username: '', Password: '', Database: ':memory:', Query });

test('real db-query process executes SQLite in memory and returns an application error', { skip: !available, timeout: 15000 }, async () => {
  const rows = await migration.executeDbQuery(payload('SELECT 1 as result'));
  assert.deepEqual(rows, [{ result: '1' }]);
  await assert.rejects(migration.executeDbQuery(payload('SELECT * FROM missing_table')), /missing_table/);
  assert.deepEqual(messages, []);
});

test('migration testConnection route accepts the real SQLite query response', { skip: !available, timeout: 15000 }, async () => {
  migration.setHtmlForWebview = () => {};
  migration.getPreview({ extensionUri: { path: 'D:/extension' } });
  const connected = await routes.get('testConnection')({
    Type: 'sqlite', Host: '', Username: '', Password: '', Database: ':memory:',
  });
  assert.equal(connected, true);
});
