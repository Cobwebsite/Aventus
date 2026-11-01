import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
let diagnostics = {};
let statistics = { loadFileTime: 1, files: {}, builds: {}, statics: {} };
const server = {
  async load() { events.push(['load']); },
  async start(options) { events.push(['start', options]); },
  async executeCommand(command) { events.push(['execute', command]); },
  getErrors() { return diagnostics; },
  getStatistics() { return statistics; },
};
globalThis.__aventusCliTestServer = server;
const source = `export { Build } from './cli/src/commands/Build.ts'; export { Check } from './cli/src/commands/Check.ts'; export { Format } from './cli/src/commands/Format.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'cli-commands-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'server-double', setup(build) {
    build.onResolve({ filter: /\.\.\/server\/Server$/ }, () => ({ path: 'server', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Server = globalThis.__aventusCliTestServer;', loader: 'js' }));
  } }],
});
const module = { exports: {} };
try {
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
} finally {
  delete globalThis.__aventusCliTestServer;
}
const { Build, Check, Format } = module.exports;

test('format loads, starts and sends its command in order with a resolved config path', async () => {
  events.length = 0;
  await new Format().run(['project/aventus.conf.avt'], {});
  assert.deepEqual(events, [
    ['load'],
    ['start', { noBuild: true, configPath: resolve('project/aventus.conf.avt') }],
    ['execute', 'aventus.format'],
  ]);
});

test('check normalizes a disabled build selection and requests diagnostics per build', async () => {
  events.length = 0;
  const originalLog = console.log;
  const output = [];
  console.log = (...args) => output.push(args.join(' '));
  try { await new Check().run([], { builds: false, json: true }); }
  finally { console.log = originalLog; }
  assert.equal(events[0][0], 'load');
  assert.deepEqual(events[1], ['start', { noBuild: true, loadFiles: true, buildOnly: true, configPath: undefined, builds: [], statics: undefined, logLevel: 3, errorByBuild: true, useStats: false }]);
  assert.deepEqual(JSON.parse(output.at(-1)), { success: true, builds: {} });
});

test('build forwards selection, output flags and verbosity to the server', async () => {
  events.length = 0;
  const originalLog = console.log;
  console.log = () => {};
  try { await new Build().run([], { builds: false, statics: false, 'no-builds': true, 'no-statics': true, verbose: true, silent: true }); }
  finally { console.log = originalLog; }
  assert.equal(events[0][0], 'load');
  assert.deepEqual(events[1], ['start', { configPath: undefined, loadFiles: true, buildOnly: true, noBuild: true, builds: [], statics: [], logLevel: 0, errorByBuild: true, useStats: false }]);
});

test('check text output prints an error diagnostic but currently leaves the process successful', async () => {
  diagnostics = { web: { 'file:///broken.wcl.avt': [{ severity: 1, message: 'broken', range: { start: { line: 2, character: 0 }, end: { line: 2, character: 6 } } }] } };
  const originalLog = console.log;
  const originalError = console.error;
  const originalExit = process.exit;
  const errors = [];
  const exits = [];
  console.log = () => {};
  console.error = message => errors.push(message);
  process.exit = code => { exits.push(code); };
  try { await new Check().run([], {}); }
  finally {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
    diagnostics = {};
  }
  assert.equal(errors.length, 1);
  assert.match(errors[0], /\[error\].*broken\.wcl\.avt:3 : broken/);
  assert.deepEqual(exits, []);
});

test('check JSON distinguishes warnings from errors and exits on an error', async () => {
  diagnostics = {
    web: { 'file:///web.avt': [
      { severity: 2, message: 'warning', range: { start: { line: 0, character: 1 }, end: { line: 0, character: 4 } } },
      { severity: 1, message: 'error', range: { start: { line: 2, character: 0 }, end: { line: 2, character: 5 } } },
    ] },
    api: { 'file:///api.avt': [{ severity: 3, message: 'info', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }] },
  };
  const originalLog = console.log;
  const originalExit = process.exit;
  const output = [];
  const exits = [];
  console.log = value => output.push(value);
  process.exit = code => exits.push(code);
  try { await new Check().run([], { json: true }); }
  finally { console.log = originalLog; process.exit = originalExit; diagnostics = {}; }
  const result = JSON.parse(output.at(-1));
  assert.equal(result.success, false);
  assert.equal(result.builds.web.success, false);
  assert.equal(result.builds.api.success, true);
  assert.deepEqual(Object.values(result.builds.web.diagnostics)[0].map(item => item.type), ['warning', 'error']);
  assert.deepEqual(Object.values(result.builds.web.diagnostics)[0][1], { content: 'error', type: 'error', start: '3:0', end: '3:5' });
  assert.deepEqual(exits, [1]);
});

test('build JSON associates output sizes with builds and statics and exits on diagnostics', async () => {
  statistics = {
    loadFileTime: 2,
    builds: { web: { buildTime: 8 }, api: { buildTime: 6 } },
    statics: { assets: { buildTime: 3 } },
    files: {
      script: { path: 'file:///dist/app.js', size: 1536, type: 'build', typeName: 'web' },
      stylesheet: { path: 'file:///dist/site.css', size: 1024, type: 'static', typeName: 'assets' },
    },
  };
  diagnostics = { web: { 'file:///source.avt': [{ severity: 1, message: 'compile error', range: { start: { line: 1, character: 2 }, end: { line: 1, character: 4 } } }] } };
  const originalLog = console.log;
  const originalExit = process.exit;
  const output = [];
  const exits = [];
  console.log = value => output.push(value);
  process.exit = code => exits.push(code);
  try { await new Build().run([], { json: true }); }
  finally {
    console.log = originalLog;
    process.exit = originalExit;
    statistics = { loadFileTime: 1, files: {}, builds: {}, statics: {} };
    diagnostics = {};
  }
  const result = JSON.parse(output.at(-1));
  assert.equal(result.success, false);
  assert.equal(result.builds.web.success, false);
  assert.equal(result.builds.api.success, true);
  assert.deepEqual(Object.values(result.builds.web.outputSize), ['1.5 KiB']);
  assert.deepEqual(Object.values(result.statics.assets.outputSize), ['1 KiB']);
  assert.deepEqual(exits, [1]);
});

test('check text sends warning and information to their channels and ignores hints', async () => {
  const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };
  diagnostics = { web: { 'file:///source.avt': [
    { severity: 2, message: 'warn', range },
    { severity: 3, message: 'note', range },
    { severity: 4, message: 'hint', range },
  ] } };
  const originals = [console.log, console.warn, console.info, process.exit];
  const warnings = [], information = [], logs = [], exits = [];
  console.log = value => logs.push(value);
  console.warn = value => warnings.push(value);
  console.info = value => information.push(value);
  process.exit = code => exits.push(code);
  try { await new Check().run([], {}); }
  finally {
    [console.log, console.warn, console.info, process.exit] = originals;
    diagnostics = {};
  }
  assert.match(warnings[0], /\[warning\].*warn/);
  assert.match(information[0], /\[info\].*note/);
  assert.equal(warnings.length, 1);
  assert.equal(information.length, 1);
  assert.ok(logs.includes('    Build has no error'));
  assert.deepEqual(exits, []);
});

test('build silent suppresses text but still exits on an error and recovers on the next run', async () => {
  const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };
  statistics = { loadFileTime: 1, files: {}, builds: { web: { buildTime: 4 } }, statics: {} };
  diagnostics = { web: { 'file:///source.avt': [{ severity: 1, message: 'broken', range }] } };
  const originals = [console.log, console.warn, console.info, console.error, process.exit];
  const output = [], exits = [];
  for (const name of ['log', 'warn', 'info', 'error']) console[name] = value => output.push(value);
  process.exit = code => exits.push(code);
  try {
    await new Build().run([], { silent: true });
    diagnostics = {};
    await new Build().run([], { silent: true });
  } finally {
    [console.log, console.warn, console.info, console.error, process.exit] = originals;
    statistics = { loadFileTime: 1, files: {}, builds: {}, statics: {} };
    diagnostics = {};
  }
  assert.deepEqual(output, []);
  assert.deepEqual(exits, [1]);
});

test('build text lists files for separate builds and static exports', async () => {
  statistics = {
    loadFileTime: 3,
    builds: { web: { buildTime: 4 }, api: { buildTime: 5 } },
    statics: { assets: { buildTime: 6 } },
    files: {
      web: { path: 'file:///dist/web.js', size: 1024, type: 'build', typeName: 'web' },
      api: { path: 'file:///dist/api.js', size: 2048, type: 'build', typeName: 'api' },
      assets: { path: 'file:///dist/logo.svg', size: 512, type: 'static', typeName: 'assets' },
    },
  };
  const originalLog = console.log;
  const output = [];
  console.log = value => output.push(value);
  try { await new Build().run([], {}); }
  finally {
    console.log = originalLog;
    statistics = { loadFileTime: 1, files: {}, builds: {}, statics: {} };
  }
  assert.ok(output.includes('Building web'));
  assert.ok(output.includes('Building api'));
  assert.ok(output.includes('Export static assets'));
  assert.ok(output.some(line => /web\.js - 1 KiB/.test(line ?? '')));
  assert.ok(output.some(line => /api\.js - 2 KiB/.test(line ?? '')));
  assert.ok(output.some(line => /logo\.svg - 512 B/.test(line ?? '')));
});
