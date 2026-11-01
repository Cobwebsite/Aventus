import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
globalThis.__aventusNotificationsTest = { events };
const result = await build({ stdin: { contents: "export { Notifications } from './cli/src/server/notification/index.ts'; export { Statistics } from './cli/src/server/notification/Statistics.ts';", resolveDir: process.cwd(), sourcefile: 'notifications-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'server-double', setup(build) {
    build.onResolve({ filter: /\.\.\/RealServer$/ }, () => ({ path: 'server', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const RealServer = { started: () => globalThis.__aventusNotificationsTest.events.push("initialized") };', loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const registry = module.exports.Notifications.allNotifications;

test('CLI notification registry exposes init, HTTP and statistics channels', () => {
  for (const command of [
    'aventus/initStep', 'aventus/server/start', 'aventus/server/stop',
    'aventus/statistics/loadFileTime', 'aventus/statistics/buildTime',
    'aventus/statistics/staticTime', 'aventus/statistics/fileSize',
    'aventus/registerBuild', 'aventus/unregisterBuild', 'aventus/editFile',
  ]) assert.equal(typeof registry[command]?.action, 'function', command);
});

test('editor notifications are accepted without CLI side effects', async () => {
  const payloads = [
    ['aventus/registerBuild', { pathConfig: 'config.avt', buildName: 'web' }],
    ['aventus/unregisterBuild', { pathConfig: 'config.avt', buildName: 'web' }],
    ['aventus/registerData', [['data.avt'], 'web']],
    ['aventus/unregisterData', 'data.avt'],
    ['aventus/registerStatic', [['static.avt'], 'web']],
    ['aventus/unregisterStatic', 'static.avt'],
    ['aventus/openfile', 'file:///source.avt'],
    ['aventus/closefile', 'file:///source.avt'],
    ['aventus/editFile', { uri: 'file:///source.avt', transformations: [] }],
  ];
  for (const [command, payload] of payloads) {
    assert.equal(typeof registry[command]?.action, 'function', command);
    assert.equal(await registry[command].action(payload), undefined, command);
  }
});

test('init notification starts the server only on the final message', () => {
  registry['aventus/initStep'].action('$(loading~spin) Aventus : Loading');
  assert.deepEqual(events, []);
  registry['aventus/initStep'].action('Aventus : Done');
  assert.deepEqual(events, ['initialized']);
});

test('HTTP start sends callbacks from a snapshot and supports callback removal', () => {
  const handler = registry['aventus/server/start'];
  const received = [];
  const first = value => { received.push(['first', value]); handler.callbacks.splice(handler.callbacks.indexOf(first), 1); };
  const second = value => received.push(['second', value]);
  handler.callbacks.push(first, second);
  handler.action('http://localhost:8080');
  handler.action('http://localhost:8081');
  assert.deepEqual(received, [
    ['first', 'http://localhost:8080'], ['second', 'http://localhost:8080'],
    ['second', 'http://localhost:8081'],
  ]);
  handler.callbacks.length = 0;
});

test('statistics channels update one shared snapshot through the registry', () => {
  registry['aventus/statistics/loadFileTime'].action(12);
  registry['aventus/statistics/buildTime'].action('web', 8);
  registry['aventus/statistics/staticTime'].action('assets', 4);
  registry['aventus/statistics/fileSize'].action('dist/app.js', 1024, 'build', 'web');
  assert.equal(module.exports.Statistics.info.loadFileTime, 12);
  assert.deepEqual(module.exports.Statistics.info.builds, { web: { buildTime: 8 } });
  assert.deepEqual(module.exports.Statistics.info.statics, { assets: { buildTime: 4 } });
  assert.deepEqual(module.exports.Statistics.info.files['dist/app.js'], { path: 'dist/app.js', size: 1024, type: 'build', typeName: 'web' });
});
