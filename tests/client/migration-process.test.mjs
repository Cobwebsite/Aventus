import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const state = { tools: { dotnet: true, 'db-query': true }, response: '', exitCode: 0, payloads: [], errors: [], spawned: [], installs: [], installError: null };
globalThis.__aventusMigrationProcess = state;
const result = await build({ entryPoints: ['client/src/webview/migration.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'migration-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/tool$|\.\.\/customEditors\/_Communication$|^command-exists$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('tool')
      ? 'export const getNonce = () => "nonce"; export const pathToUri = path => path; export const uriToPath = uri => uri;'
      : args.path === 'command-exists'
        ? 'export const sync = name => globalThis.__aventusMigrationProcess.tools[name];'
        : 'export class Communication {}', loader: 'js' }));
  } }],
});
function spawn(command) {
  state.spawned.push(command);
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = {
    write(value) { state.payloads.push(JSON.parse(value)); },
    end() {
      setImmediate(() => {
        if (state.exitCode) child.stderr.emit('data', 'process failed');
        else child.stdout.emit('data', state.response);
        child.emit('close', state.exitCode);
      });
    },
  };
  return child;
}
const vscode = { window: {
  showErrorMessage(message) { state.errors.push(message); },
  async showInformationMessage() { return { title: 'No' }; },
  withProgress(options, callback) { state.installs.push(options); return callback({}); },
}, ProgressLocation: { Notification: 1 } };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => {
  if (name === 'vscode') return vscode;
  if (name === 'child_process') return { spawn, exec(_command, callback) { setImmediate(() => { if (!state.installError) state.tools['db-query'] = true; callback(state.installError, '', ''); }); } };
  return require(name);
});
const { AventusMigration } = module.exports;
const migration = new AventusMigration();
const query = { Type: 'sqlite', Database: 'demo', Host: '', Username: '', Password: '', Query: 'SELECT 1' };

test('migration process sends JSON payload and resolves a successful response', async () => {
  state.response = JSON.stringify({ Success: true, Result: [{ result: 1 }], Errors: [] });
  const result = await migration.executeDbQuery(query);
  assert.deepEqual(result, [{ result: 1 }]);
  assert.deepEqual(state.payloads.at(-1), query);
  assert.equal(state.spawned.at(-1), 'db-query');
});

test('migration process rejects tool errors, exit failures and invalid JSON', async () => {
  state.response = JSON.stringify({ Success: false, Result: [], Errors: ['bad query'] });
  await assert.rejects(migration.executeDbQuery(query), /bad query/);
  state.exitCode = 2;
  await assert.rejects(migration.executeDbQuery(query), /code 2: process failed/);
  state.exitCode = 0;
  state.response = '{invalid';
  await assert.rejects(migration.executeDbQuery(query), /parser la réponse JSON/);
});

test('migration process reports missing dotnet before spawning', async () => {
  state.tools.dotnet = false;
  const before = state.spawned.length;
  try {
    await assert.rejects(migration.executeDbQuery(query), /Dotnet isn't installed/);
    assert.equal(state.spawned.length, before);
    assert.match(state.errors.at(-1), /Dotnet isn't installed/);
  } finally { state.tools.dotnet = true; }
});

test('migration process reports missing db-query after declining installation', async () => {
  state.tools['db-query'] = false;
  const before = state.spawned.length;
  try {
    await assert.rejects(migration.executeDbQuery(query), /Can't find the db-query/);
    assert.equal(state.spawned.length, before);
    assert.match(state.errors.at(-1), /Can't find the db-query/);
  } finally { state.tools['db-query'] = true; }
});

test('accepted db-query installation completes before the query resumes', async () => {
  state.tools['db-query'] = false;
  state.response = JSON.stringify({ Success: true, Result: [{ result: 1 }], Errors: [] });
  const originalPrompt = vscode.window.showInformationMessage;
  vscode.window.showInformationMessage = async () => ({ title: 'Yes' });
  try {
    const before = state.spawned.length;
    assert.deepEqual(await migration.executeDbQuery(query), [{ result: 1 }]);
    assert.equal(state.installs.at(-1).title, 'Installing AventusSharp.DatabaseQuery');
    assert.equal(state.tools['db-query'], true);
    assert.equal(state.spawned.length, before + 1);
  } finally {
    vscode.window.showInformationMessage = originalPrompt;
    state.tools['db-query'] = true;
  }
});

test('failed db-query installation reports the installation error without running the query', async () => {
  state.tools['db-query'] = false;
  state.installError = new Error('installation failed');
  const originalPrompt = vscode.window.showInformationMessage;
  vscode.window.showInformationMessage = async () => ({ title: 'Yes' });
  const before = state.spawned.length;
  try {
    await assert.rejects(migration.executeDbQuery(query), /installation failed/);
    assert.match(state.errors.at(-1), /installation failed/);
    assert.equal(state.spawned.length, before);
  } finally {
    vscode.window.showInformationMessage = originalPrompt;
    state.installError = null;
    state.tools['db-query'] = true;
  }
});
