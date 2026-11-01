import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const calls = [];
const prompts = {
  Select: async options => { calls.push(['select', options]); return 'web'; },
  Checkbox: async options => { calls.push(['checkbox', options]); return ['web', 'api']; },
  Input: async options => { calls.push(['input', options]); return 'hello'; },
  Password: async options => { calls.push(['password', options]); return 'secret'; },
  FileTree: async options => { calls.push(['tree', options]); return 'D:/project'; },
  Log: async options => { calls.push(['log', options]); },
};
globalThis.__aventusInteractionPrompts = prompts;
const result = await build({ entryPoints: ['cli/src/interaction/RealInteraction.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'prompt-doubles', setup(build) {
    build.onResolve({ filter: /^\.\/action\/(Checkbox|FileTree|Input|Log|Select|Password)$|^\.\.\/logo$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => {
      if (args.path === '../logo') return { contents: 'export const printLogo = () => {};', loader: 'js' };
      const name = args.path.split('/').at(-1);
      return { contents: `export default options => globalThis.__aventusInteractionPrompts.${name}(options);`, loader: 'js' };
    });
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { RealInteraction } = module.exports;
RealInteraction.config = { clear: false, printLogo: false };

test('terminal selection rejects empty choices and forwards populated choices', async () => {
  const originalError = console.error;
  const errors = [];
  console.error = message => errors.push(message);
  try { assert.equal(await RealInteraction.select('Choose', []), null); }
  finally { console.error = originalError; }
  assert.deepEqual(errors, ['No choice available']);
  const choices = [{ name: 'Web', value: 'web' }];
  assert.equal(await RealInteraction.select('Choose', choices), 'web');
  assert.deepEqual(calls.at(-1), ['select', { message: 'Choose', choices }]);
  assert.deepEqual(await RealInteraction.selectMultiple('Choose many', choices), ['web', 'api']);
  assert.deepEqual(calls.at(-1), ['checkbox', { message: 'Choose many', choices }]);
});

test('terminal input and password use defaults and validation callbacks', async () => {
  assert.equal(await RealInteraction.input('Name'), 'hello');
  const input = calls.at(-1)[1];
  assert.equal(input.default, '');
  assert.equal(input.validate('anything'), true);
  const validate = value => value.length >= 3 || 'too short';
  assert.equal(await RealInteraction.password('Password', validate), 'secret');
  assert.equal(calls.at(-1)[1].validate, validate);
});

test('directory tree filters files while mixed tree leaves them available', async () => {
  assert.equal(await RealInteraction.tree('Directory', 'directory', 'D:/root'), 'D:/project');
  const directory = calls.at(-1)[1];
  assert.equal(directory.basePath, 'D:/root');
  assert.equal(directory.filter({ isDirectory: () => true }), true);
  assert.equal(directory.filter({ isDirectory: () => false }), false);
  await RealInteraction.tree('Anything', 'file+directory');
  assert.equal(calls.at(-1)[1].filter, undefined);
});

test('log prompt receives current errors and server refresh callbacks', async () => {
  const events = [];
  RealInteraction._server = {
    getErrors: () => ({ web: {} }),
    subscribeErrors: callback => events.push(['subscribe', callback]),
    unsubscribeErrors: callback => events.push(['unsubscribe', callback]),
  };
  await RealInteraction.log();
  const options = calls.at(-1)[1];
  assert.deepEqual(options.errors, { web: {} });
  const callback = () => {};
  options.refresh(callback);
  options.stopRefresh(callback);
  assert.deepEqual(events, [['subscribe', callback], ['unsubscribe', callback]]);
});

test('async input validation is passed through and prompt cancellation rejects without clearing', async () => {
  const validate = async value => value === 'accepted' || 'invalid';
  await RealInteraction.input('Name', 'default', validate);
  assert.equal(calls.at(-1)[1].default, 'default');
  assert.equal(await calls.at(-1)[1].validate('bad'), 'invalid');
  assert.equal(await calls.at(-1)[1].validate('accepted'), true);
  const originalSelect = prompts.Select;
  const originalClear = console.clear;
  const cancellation = new Error('prompt cancelled');
  let cleared = 0;
  RealInteraction.config = { clear: true, printLogo: false };
  prompts.Select = async () => { throw cancellation; };
  console.clear = () => cleared++;
  try {
    await assert.rejects(RealInteraction.select('Choose', [{ name: 'Web', value: 'web' }]), error => error === cancellation);
    assert.equal(cleared, 0);
  } finally {
    prompts.Select = originalSelect;
    console.clear = originalClear;
    RealInteraction.config = { clear: false, printLogo: false };
  }
});

test('null prompt selections and input cancellations clear the terminal view', async () => {
  const originals = { Select: prompts.Select, Checkbox: prompts.Checkbox, Input: prompts.Input, Password: prompts.Password, FileTree: prompts.FileTree };
  const originalClear = console.clear;
  let cleared = 0;
  for (const name of Object.keys(originals)) prompts[name] = async () => null;
  RealInteraction.config = { clear: true, printLogo: false };
  console.clear = () => cleared++;
  try {
    assert.equal(await RealInteraction.select('Choose', [{ name: 'Web', value: 'web' }]), null);
    assert.equal(await RealInteraction.selectMultiple('Choose', [{ name: 'Web', value: 'web' }]), null);
    assert.equal(await RealInteraction.input('Name'), null);
    assert.equal(await RealInteraction.password('Password'), null);
    assert.equal(await RealInteraction.tree('Directory', 'directory'), null);
    assert.equal(cleared, 5);
  } finally {
    Object.assign(prompts, originals);
    console.clear = originalClear;
    RealInteraction.config = { clear: false, printLogo: false };
  }
});
