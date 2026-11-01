import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const notificationEvents = [];
const interactionEvents = [];
globalThis.__aventusConnectionTest = { notificationEvents, interactionEvents };
const result = await build({ entryPoints: ['cli/src/server/Connection.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'connection-doubles', setup(build) {
    build.onResolve({ filter: /^\.\/notification\/index$|^\.\/RealServer$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.includes('notification')
      ? 'export const Notifications = { allNotifications: { "aventus/known": { action: (...args) => globalThis.__aventusConnectionTest.notificationEvents.push(args) } } };'
      : 'export const RealServer = { interaction: globalThis.__aventusConnectionTest.interaction };', loader: 'js' }));
  } }],
});
globalThis.__aventusConnectionTest.interaction = {
  async input(...args) { interactionEvents.push(['input', ...args]); return 'entered'; },
  async password(...args) { interactionEvents.push(['password', ...args]); return 'secret'; },
  async select(...args) { interactionEvents.push(['select', ...args]); return '1'; },
  async selectMultiple(...args) { interactionEvents.push(['multiple', ...args]); return ['0', '2']; },
  async tree(...args) { interactionEvents.push(['tree', ...args]); return 'D:/chosen'; },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { CliConnection } = module.exports;

test('CLI connection dispatches known notifications and ignores unknown commands', () => {
  const connection = new CliConnection({});
  connection.sendNotification('aventus/unknown', ['ignored']);
  connection.sendNotification('aventus/known', ['first', 2]);
  assert.deepEqual(notificationEvents, [['first', 2]]);
});

test('diagnostics replace and clear per-build files while subscribed listeners observe transitions', () => {
  const connection = new CliConnection({ errorByBuild: true });
  const seen = [];
  const listener = (errors, build) => seen.push([build, structuredClone(errors)]);
  connection.subscribeErrors(listener);
  const diagnostic = { severity: 1, message: 'broken' };
  connection.sendDiagnostics({ uri: 'file:///one.avt', diagnostics: [diagnostic] }, 'web');
  connection.sendDiagnostics({ uri: 'file:///two.avt', diagnostics: [{ severity: 2, message: 'warn' }] }, 'api');
  connection.sendDiagnostics({ uri: 'file:///one.avt', diagnostics: [] }, 'web');
  assert.deepEqual(connection.errorsByBuildByFile, {
    web: {}, api: { 'file:///two.avt': [{ severity: 2, message: 'warn' }] },
  });
  assert.deepEqual(seen[0], ['web', { 'file:///one.avt': [diagnostic] }]);
  assert.equal(seen.at(-1)[0], 'api');
  connection.unsubscribeErrors(listener);
  const before = seen.length;
  connection.sendDiagnostics({ uri: 'file:///two.avt', diagnostics: [] }, 'api');
  assert.equal(seen.length, before);
});

test('CLI connection maps settings and interactive selections to terminal prompts', async () => {
  const connection = new CliConnection({ watchFiles: true, useTemplates: true, builds: ['web'], errorByBuild: true });
  assert.deepEqual(await connection.getSettings(), {
    watchFiles: true, useCompilators: false, useTemplates: true, buildOnly: true,
    loadFiles: false, builds: ['web'], statics: undefined, configPath: undefined,
    logLevel: undefined, errorByBuild: true, useStats: undefined,
  });
  const items = [{ label: 'A', detail: 'alpha' }, { label: 'B' }, { label: 'C' }];
  assert.equal(await connection.Select(items, { title: 'Choose', placeHolder: 'item' }), items[1]);
  assert.deepEqual(interactionEvents.at(-1), ['select', 'Choose - item', [
    { value: '0', name: 'A - alpha', checked: false },
    { value: '1', name: 'B', checked: false },
    { value: '2', name: 'C', checked: false },
  ]]);
  assert.deepEqual(await connection.SelectMultiple(items, { title: 'Many' }), [items[0], items[2]]);
  assert.equal(await connection.SelectFolder('Folder', 'D:/root'), 'D:/chosen');
  assert.deepEqual(interactionEvents.at(-1), ['tree', 'Folder', 'directory', 'D:/root']);
});

test('CLI input combines title and placeholder and applies regex validation', async () => {
  const connection = new CliConnection({});
  assert.equal(await connection.Input({ title: 'Name', placeHolder: 'letters', value: 'abc', validations: [{ regex: '^[a-z]+$', message: 'letters only' }] }), 'entered');
  const input = interactionEvents.at(-1);
  assert.deepEqual(input.slice(0, 3), ['input', 'Name - letters', 'abc']);
  assert.equal(await input[3]('abc'), true);
  assert.equal(await input[3]('abc1'), 'letters only');
  assert.equal(await connection.Input({ title: 'Password', password: true }), 'secret');
  assert.equal(interactionEvents.at(-1)[0], 'password');
});
