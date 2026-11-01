import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
let watchErrors = { web: {} };
let errorSubscriber;
const server = {
  async load() { events.push('server.load'); },
  async start(options) { events.push(['server.start', options]); },
  async create() { events.push('server.create'); },
  getErrors() { return watchErrors; },
  subscribeErrors(callback) { errorSubscriber = callback; events.push(['server.subscribeErrors']); },
};
const selections = ['create', 'log', 'quit'];
const interaction = {
  async load(options) { events.push(['interaction.load', options]); },
  async init() { events.push('interaction.init'); },
  clear() { events.push('interaction.clear'); },
  async select(question, choices) { events.push(['interaction.select', question, choices.map(choice => choice.value)]); return selections.shift(); },
  async log() { events.push('interaction.log'); },
};
globalThis.__aventusWatchDevTest = { server, interaction };
const source = `export { Watch } from './cli/src/commands/Watch.ts'; export { Dev } from './cli/src/commands/Dev.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'watch-dev-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'watch-dev-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/server\/Server$/ }, () => ({ path: 'server', namespace: 'test' }));
    build.onResolve({ filter: /\.\.\/interaction\/Interaction$/ }, () => ({ path: 'interaction', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path === 'server'
      ? 'export const Server = globalThis.__aventusWatchDevTest.server;'
      : 'export const Interaction = globalThis.__aventusWatchDevTest.interaction;', loader: 'js' }));
  } }],
});
const module = { exports: {} };
try { new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require); }
finally { delete globalThis.__aventusWatchDevTest; }
const { Watch, Dev } = module.exports;

test('watch JSON output tracks diagnostics by build and omits hint-only files', () => {
  const output = [];
  const originalLog = console.log;
  const originalClear = console.clear;
  console.log = message => output.push(message);
  console.clear = () => {};
  try {
    new Watch().renderLogJson({
      web: {
        'file:///broken.wcl.avt': [{ severity: 1, message: 'broken', range: { start: { line: 1, character: 2 }, end: { line: 1, character: 8 } } }],
        'file:///hint.wcl.avt': [{ severity: 4, message: 'hint', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }],
      },
      api: { 'file:///warn.wcl.avt': [{ severity: 2, message: 'warning', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } } }] },
    });
  } finally { console.log = originalLog; console.clear = originalClear; }
  const value = JSON.parse(output.at(-1));
  assert.equal(value.success, false);
  assert.equal(value.builds.web.success, false);
  assert.equal(value.builds.api.success, true);
  assert.deepEqual(Object.values(value.builds.web.diagnostics)[0], [{ content: 'broken', type: 'error', start: '2:2', end: '2:8' }]);
  assert.equal(Object.keys(value.builds.web.diagnostics).length, 1);
});

test('dev launches compiler, handles create and log, then quits', async () => {
  events.length = 0;
  const originalClear = console.clear;
  const originalLog = console.log;
  const originalExit = process.exit;
  const done = new Error('quit');
  console.clear = () => {};
  console.log = () => {};
  process.exit = code => { assert.equal(code, 0); throw done; };
  try { await assert.rejects(new Dev().run([], {}), error => error === done); }
  finally { console.clear = originalClear; console.log = originalLog; process.exit = originalExit; }
  assert.deepEqual(events.slice(0, 5), [
    ['interaction.load', { clear: true, printLogo: true }],
    'server.load', 'interaction.init',
    ['server.start', { loadFiles: true, watchFiles: true, useCompilators: true, useTemplates: true }],
    'interaction.clear',
  ]);
  assert.ok(events.includes('server.create'));
  assert.ok(events.includes('interaction.log'));
  assert.equal(events.filter(item => Array.isArray(item) && item[0] === 'interaction.select').length, 3);
});

test('watch publishes initial JSON and refreshes it after an error and correction', async () => {
  events.length = 0;
  watchErrors = { web: {} };
  errorSubscriber = undefined;
  const originalLog = console.log;
  const originalClear = console.clear;
  const previousListeners = new Set(process.listeners('SIGINT'));
  const output = [];
  console.log = value => output.push(value);
  console.clear = () => {};
  const watch = new Watch();
  watch.sleep = async () => {};
  try {
    void watch.run([], { json: true, builds: false });
    for (let index = 0; index < 20 && !errorSubscriber; index++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(typeof errorSubscriber, 'function');
    assert.deepEqual(events.slice(0, 3), [
      'server.load', ['server.start', { loadFiles: true, watchFiles: true, useCompilators: true, useTemplates: false, configPath: undefined, builds: [], useStats: false }],
      ['server.subscribeErrors'],
    ]);
    assert.equal(JSON.parse(output.at(-1)).success, true);
    const error = { severity: 1, message: 'broken', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 6 } } };
    errorSubscriber({ 'file:///web.avt': [error] }, 'web');
    assert.equal(JSON.parse(output.at(-1)).success, false);
    errorSubscriber({}, 'web');
    assert.equal(JSON.parse(output.at(-1)).success, true);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
    for (const listener of process.listeners('SIGINT')) if (!previousListeners.has(listener)) process.removeListener('SIGINT', listener);
  }
});

test('watch SIGINT exits but leaves the server diagnostics subscription registered', async () => {
  events.length = 0;
  errorSubscriber = undefined;
  const previousListeners = new Set(process.listeners('SIGINT'));
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalClear = console.clear;
  const exitCodes = [];
  process.exit = code => exitCodes.push(code);
  console.log = () => {};
  console.clear = () => {};
  const watch = new Watch();
  watch.sleep = async () => {};
  try {
    void watch.run([], { json: true });
    for (let index = 0; index < 20 && !errorSubscriber; index++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(typeof errorSubscriber, 'function');
    const listener = process.listeners('SIGINT').find(value => !previousListeners.has(value));
    assert.equal(typeof listener, 'function');
    listener();
    assert.deepEqual(exitCodes, [0]);
    assert.equal(typeof errorSubscriber, 'function');
    assert.ok(process.listeners('SIGINT').includes(listener));
  } finally {
    process.exit = originalExit;
    console.log = originalLog;
    console.clear = originalClear;
    for (const listener of process.listeners('SIGINT')) if (!previousListeners.has(listener)) process.removeListener('SIGINT', listener);
  }
});
