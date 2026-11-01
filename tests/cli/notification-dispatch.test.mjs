import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({
  stdin: { contents: "export { CliConnection } from './cli/src/server/Connection.ts'; export { ServerStart } from './cli/src/server/notification/httpServer/ServerStart.ts'; export { Statistics } from './cli/src/server/notification/Statistics.ts';", resolveDir: process.cwd(), sourcefile: 'notification-dispatch-entry.ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'real-server-double', setup(build) {
    build.onResolve({ filter: /(?:^|\/)RealServer$/ }, () => ({ path: 'real-server', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const RealServer = { started() {}, interaction: {} };', loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { CliConnection, ServerStart, Statistics } = module.exports;

test('connection dispatches HTTP and statistics notifications through the actual registry in order', () => {
  const connection = new CliConnection({});
  const seen = [];
  const first = url => seen.push(['first', url]);
  const second = url => seen.push(['second', url]);
  ServerStart.callbacks.push(first, second);
  try {
    connection.sendNotification('aventus/server/start', ['http://localhost:8080']);
    connection.sendNotification('aventus/statistics/loadFileTime', [12]);
    connection.sendNotification('aventus/server/start', ['http://localhost:8081']);
    connection.sendNotification('aventus/server/stop', []);
    assert.deepEqual(seen, [
      ['first', 'http://localhost:8080'], ['second', 'http://localhost:8080'],
      ['first', 'http://localhost:8081'], ['second', 'http://localhost:8081'],
    ]);
    assert.equal(Statistics.info.loadFileTime, 12);
  } finally {
    ServerStart.callbacks.splice(ServerStart.callbacks.indexOf(first), 1);
    ServerStart.callbacks.splice(ServerStart.callbacks.indexOf(second), 1);
  }
});
