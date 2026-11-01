import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const events = [];
let failStart = false;
let failExecute = false;
let executeError = new Error('request failed');
const server = {
  async load() { events.push(['server.load']); },
  async start(options) { events.push(['server.start', options]); if (failStart) throw new Error('start failed'); },
  async executeCommand(...args) { events.push(['execute', ...args]); if (failExecute) throw executeError; },
};
const interaction = { async load() { events.push(['interaction.load']); } };
globalThis.__aventusServiceCommands = { server, interaction };
const entries = [
  ['ImportTemplate', 'template/InstallTemplate'], ['UninstallTemplate', 'template/UninstallTemplate'],
  ['InstallProject', 'project/InstallProject'], ['UninstallProject', 'project/UninstallProject'],
  ['StoreLogin', 'store/StoreLogin'], ['StoreLogout', 'store/StoreLogout'], ['StorePublish', 'store/StorePublish'],
  ['Create', 'Create'], ['HelpLLM', 'dependencies/HelpLLM'], ['Prepare', 'ai/Prepare'],
];
const source = entries.map(([name, path]) => `export { ${name} } from './cli/src/commands/${path}.ts';`).join('\n');
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'service-commands-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'service-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/(?:\.\.\/)?server\/Server$|\.\.\/(?:\.\.\/)?interaction\/Interaction$/ }, args => ({ path: args.path.endsWith('Server') ? 'server' : 'interaction', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: `export const ${args.path === 'server' ? 'Server' : 'Interaction'} = globalThis.__aventusServiceCommands.${args.path};`, loader: 'js' }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);

test('template and project commands enable templates and route to the matching server action', async () => {
  const commands = [
    ['ImportTemplate', 'aventus.template.import'], ['UninstallTemplate', 'aventus.template.uninstall'],
    ['InstallProject', 'aventus.template.import_project'], ['UninstallProject', 'aventus.template.uninstall_project'],
  ];
  for (const [name, command] of commands) {
    events.length = 0;
    await new module.exports[name]().run([], {});
    assert.deepEqual(events, [
      ['interaction.load'], ['server.load'],
      ['server.start', { noBuild: true, useTemplates: true }],
      ['execute', command],
    ]);
  }
});

test('Store commands use noStart and login forwards explicit credentials', async () => {
  const cases = [
    ['StoreLogin', { username: 'alice', password: 'secret' }, ['aventus.store.connect', 'alice', 'secret']],
    ['StoreLogout', {}, ['aventus.store.disconnect']],
    ['StorePublish', {}, ['aventus.store.publish_package']],
  ];
  for (const [name, options, command] of cases) {
    events.length = 0;
    await new module.exports[name]().run([], options);
    assert.deepEqual(events, [
      ['interaction.load'], ['server.load'], ['server.start', { noStart: true }], ['execute', ...command],
    ]);
  }
});

test('service commands exit with failure when server start rejects', async () => {
  events.length = 0;
  failStart = true;
  const originalLog = console.log;
  const originalExit = process.exit;
  const logged = [], exits = [];
  console.log = value => logged.push(value);
  process.exit = code => exits.push(code);
  try {
    for (const name of ['ImportTemplate', 'UninstallTemplate', 'InstallProject', 'UninstallProject', 'StoreLogin', 'StoreLogout', 'StorePublish']) {
      events.length = 0;
      await new module.exports[name]().run([], {});
      assert.equal(events.at(-1)[0], 'server.start');
    }
  }
  finally { console.log = originalLog; process.exit = originalExit; failStart = false; }
  assert.deepEqual(events, [
    ['interaction.load'], ['server.load'], ['server.start', { noStart: true }],
  ]);
  assert.equal(logged[0].message, 'start failed');
  assert.deepEqual(exits, Array(7).fill(1));
});

test('Store command exits with failure after a failed server request', async () => {
  events.length = 0;
  failExecute = true;
  const originalLog = console.log;
  const originalExit = process.exit;
  const logged = [], exits = [];
  console.log = value => logged.push(value);
  process.exit = code => exits.push(code);
  try { await new module.exports.StorePublish().run([], {}); }
  finally { console.log = originalLog; process.exit = originalExit; failExecute = false; }
  assert.deepEqual(events, [
    ['interaction.load'], ['server.load'], ['server.start', { noStart: true }],
    ['execute', 'aventus.store.publish_package'],
  ]);
  assert.equal(logged[0].message, 'request failed');
  assert.deepEqual(exits, [1]);
});

test('a rejected prompt remains a failure for template, project and Store commands', async () => {
  const originalLog = console.log;
  const originalExit = process.exit;
  const logged = [], exits = [];
  console.log = value => logged.push(value);
  process.exit = code => exits.push(code);
  executeError = new Error('prompt cancelled');
  failExecute = true;
  try {
    for (const name of ['ImportTemplate', 'InstallProject', 'StorePublish']) {
      events.length = 0;
      await new module.exports[name]().run([], {});
      assert.equal(events.at(-1)[0], 'execute');
      assert.equal(logged.at(-1), executeError);
    }
  } finally {
    console.log = originalLog;
    process.exit = originalExit;
    executeError = new Error('request failed');
    failExecute = false;
  }
  assert.deepEqual(exits, [1, 1, 1]);
});

test('create passes the current directory URI after template-aware startup', async () => {
  events.length = 0;
  await new module.exports.Create().run([], {});
  assert.deepEqual(events.slice(0, 3), [
    ['interaction.load'], ['server.load'],
    ['server.start', { noBuild: true, useTemplates: true, loadFiles: true }],
  ]);
  assert.equal(events[3][0], 'execute');
  assert.equal(events[3][1], 'aventus.create');
  assert.match(events[3][2], /^file:\/\/\//);
  assert.match(events[3][2], /Aventus/);
});

test('dependency help and AI preparation request the expected server commands', async () => {
  events.length = 0;
  await new module.exports.HelpLLM().run([], {});
  assert.deepEqual(events, [
    ['server.load'], ['server.start', { noBuild: true, loadFiles: false, configPath: undefined }],
    ['execute', 'aventus.ai.dependencies'],
  ]);
  events.length = 0;
  await new module.exports.Prepare().run([], {});
  assert.deepEqual(events, [
    ['server.load'], ['server.start', { noBuild: true, loadFiles: false, configPath: undefined }],
    ['execute', 'aventus.ai.dependencies'], ['execute', 'aventus.ai.rules'],
  ]);
});

test('AI preparation stops before rules when dependency generation fails', async () => {
  events.length = 0;
  failExecute = true;
  const originalLog = console.log;
  const logged = [];
  console.log = value => logged.push(value);
  try { await new module.exports.Prepare().run([], {}); }
  finally { console.log = originalLog; failExecute = false; }
  assert.deepEqual(events, [
    ['server.load'], ['server.start', { noBuild: true, loadFiles: false, configPath: undefined }],
    ['execute', 'aventus.ai.dependencies'],
  ]);
  assert.equal(logged[0].message, 'request failed');
});
