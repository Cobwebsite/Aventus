import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = ['AskSelect', 'AskSelectMultiple', 'AskInput', 'Popup']
  .map(name => `export { ${name} } from './client/src/notification/${name}.ts';`).join('\n');
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'prompts-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const responses = [];
const calls = [];
let quickPickResult;
let inputResult;
let popupResult;
const vscode = {
  commands: { executeCommand(...args) { responses.push(args); } },
  window: {
    async showQuickPick(items, options) { calls.push(['quick', items, options]); return quickPickResult; },
    async showInputBox(options) { calls.push(['input', options]); return inputResult; },
    async showInformationMessage(...args) { calls.push(['popup', ...args]); return popupResult; },
  },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AskSelect, AskSelectMultiple, AskInput, Popup } = module.exports;

test('single and multiple choices return selected items with distinct pick modes', async () => {
  const items = [{ label: 'A', detail: 'first', id: 'a' }, { label: 'B', detail: 'second', id: 'b' }];
  quickPickResult = items[1];
  await AskSelect.action('one', items, { title: 'Choose' });
  assert.equal(calls.at(-1)[2].canPickMany, false);
  assert.deepEqual(responses.at(-1), ['aventus.receiveselect', 'one', items[1]]);
  quickPickResult = items;
  await AskSelectMultiple.action('two', items, { title: 'Choose many' });
  assert.equal(calls.at(-1)[2].canPickMany, true);
  assert.deepEqual(responses.at(-1), ['aventus.receiveselectmultiple', 'two', items]);
});

test('cancelled selections and popup send null responses', async () => {
  quickPickResult = undefined;
  popupResult = undefined;
  await AskSelect.action('single', [], {});
  await AskSelectMultiple.action('multiple', [], {});
  await Popup.action('popup', 'Continue?', ['Yes', 'No']);
  assert.deepEqual(responses.slice(-3), [
    ['aventus.receiveselect', 'single', null],
    ['aventus.receiveselectmultiple', 'multiple', null],
    ['aventus.popupresponse', 'popup', null],
  ]);
  assert.deepEqual(calls.at(-1), ['popup', 'Continue?', 'Yes', 'No']);
});

test('input validates in order and forwards accepted text or cancellation', async () => {
  inputResult = 'ok';
  await AskInput.action('input', { title: 'Name', value: '', validations: [
    { regex: '^.{3,}$', message: 'too short' },
    { regex: '^[a-z]+$', message: 'letters only' },
  ] });
  const inputOptions = calls.at(-1)[1];
  assert.equal(await inputOptions.validateInput('ab'), 'too short');
  assert.equal(await inputOptions.validateInput('abc1'), 'letters only');
  assert.equal(await inputOptions.validateInput('abc'), null);
  assert.deepEqual(responses.at(-1), ['aventus.receiveinput', 'input', 'ok']);
  inputResult = undefined;
  await AskInput.action('cancel', { password: true });
  assert.equal(calls.at(-1)[1].password, true);
  assert.deepEqual(responses.at(-1), ['aventus.receiveinput', 'cancel', null]);
});
