import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
const startNotification = { callbacks: [] };
const server = {
  notifications: { allNotifications: { 'aventus/server/start': startNotification } },
  async load() { events.push('server.load'); },
  async start(options) { events.push(['server.start', options]); },
  async executeCommand(command) { events.push(['server.execute', command]); },
  async Input(options) { events.push(['server.input', options]); },
};
const interaction = { async load() { events.push('interaction.load'); } };
globalThis.__aventusServeTest = { server, interaction };
const result = await build({ entryPoints: ['cli/src/commands/Serve.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'serve-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/server\/Server$/ }, () => ({ path: 'server', namespace: 'test' }));
    build.onResolve({ filter: /\.\.\/interaction\/Interaction$/ }, () => ({ path: 'interaction', namespace: 'test' }));
    build.onResolve({ filter: /ServerStart$/ }, () => ({ path: 'start', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: {
      server: 'export const Server = globalThis.__aventusServeTest.server;',
      interaction: 'export const Interaction = globalThis.__aventusServeTest.interaction;',
      start: "export const ServerStart = { cmd: 'aventus/server/start' };",
    }[args.path], loader: 'js' }));
  } }],
});
const module = { exports: {} };
try { new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require); }
finally { delete globalThis.__aventusServeTest; }
const { Serve } = module.exports;

test('serve waits for the start notification, then prompts and removes its callback', async () => {
  const originalLog = console.log;
  const output = [];
  console.log = message => output.push(message);
  try {
    const running = new Serve().run([], {});
    for (let i = 0; i < 10 && !startNotification.callbacks.length; i++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(startNotification.callbacks.length, 1);
    assert.deepEqual(events, [
      'interaction.load', 'server.load',
      ['server.start', { loadFiles: true, watchFiles: true }],
      ['server.execute', 'aventus.liveserver.start'],
    ]);
    startNotification.callbacks[0]('http://localhost:8080');
    await running;
    assert.deepEqual(output, ['Server started : http://localhost:8080']);
    assert.equal(startNotification.callbacks.length, 0);
    assert.deepEqual(events.at(-1), ['server.input', { title: 'Press enter to stop server' }]);
  } finally { console.log = originalLog; }
});
