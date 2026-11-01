import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = `export { ServerStart } from './client/src/notification/httpServer/ServerStart.ts'; export { ServerStop } from './client/src/notification/httpServer/ServerStop.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'live-server-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'singleton-double', setup(build) {
    build.onResolve({ filter: /\.\.\/\.\.\/Singleton$/ }, () => ({ path: 'singleton', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Singleton = globalThis.__aventusLiveServer;', loader: 'js' }));
  } }],
});
const state = { client: { components: { runningServer: {} } } };
globalThis.__aventusLiveServer = state;
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { ServerStart, ServerStop } = module.exports;

test('live server status changes between start and stop actions', () => {
  const item = state.client.components.runningServer;
  ServerStop.action();
  assert.equal(item.command, 'aventus.liveserver.start');
  assert.equal(item.text, '$(notebook-execute)');
  ServerStart.action('http://localhost:8080');
  assert.equal(item.command, 'aventus.liveserver.stop');
  assert.match(item.tooltip, /http:\/\/localhost:8080/);
  ServerStop.action();
  assert.equal(item.command, 'aventus.liveserver.start');
  assert.equal(item.tooltip, 'Aventus : Start live reload');
});

test('repeated HTTP starts replace the address and repeated stops remain idle', () => {
  const item = state.client.components.runningServer;
  ServerStart.action('http://localhost:8080');
  ServerStart.action('http://localhost:8081');
  assert.match(item.tooltip, /localhost:8081/);
  assert.doesNotMatch(item.tooltip, /localhost:8080/);
  ServerStop.action();
  const stopped = { text: item.text, tooltip: item.tooltip, command: item.command };
  ServerStop.action();
  assert.deepEqual({ text: item.text, tooltip: item.tooltip, command: item.command }, stopped);
});
