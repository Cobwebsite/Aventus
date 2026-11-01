import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({
  stdin: { contents: "export { AskInput } from './client/src/notification/AskInput.ts'; export { ReceiveInput } from './client/src/cmds/ReceiveInput.ts'; export { AskSelect } from './client/src/notification/AskSelect.ts'; export { ReceiveSelect } from './client/src/cmds/ReceiveSelect.ts'; export { AskSelectMultiple } from './client/src/notification/AskSelectMultiple.ts'; export { ReceiveSelectMultiple } from './client/src/cmds/ReceiveSelectMultiple.ts'; export { Popup } from './client/src/notification/Popup.ts'; export { PopupResponse } from './client/src/cmds/PopupResponse.ts';", resolveDir: process.cwd(), sourcefile: 'prompt-roundtrip-entry.ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
});
let answer;
let selection;
const requests = [], optionsSeen = [];
const vscode = {
  window: {
    async showInputBox(options) { optionsSeen.push(options); return answer; },
    async showQuickPick() { return selection; },
    async showInformationMessage() { return answer; },
  },
  commands: { executeCommand(command, ...args) { requests.push([command, args]); } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AskInput, ReceiveInput, AskSelect, ReceiveSelect, AskSelectMultiple, ReceiveSelectMultiple, Popup, PopupResponse } = module.exports;

test('input notification and response command carry accepted text and cancellation back to the server', async () => {
  answer = 'component';
  await AskInput.action('request-1', { title: 'Name', validations: [{ regex: '^[a-z]+$', message: 'Letters only' }] });
  assert.equal(await optionsSeen.at(-1).validateInput('bad1'), 'Letters only');
  assert.equal(await optionsSeen.at(-1).validateInput('component'), null);
  assert.equal(requests.at(-1)[0], ReceiveInput.cmd);
  assert.deepEqual(await ReceiveInput.middleware(requests.at(-1)[1]), ['request-1', 'component']);

  answer = undefined;
  await AskInput.action('request-2', { title: 'Name' });
  assert.deepEqual(await ReceiveInput.middleware(requests.at(-1)[1]), ['request-2', null]);
});

test('selection and popup notifications return selected values through their response commands', async () => {
  const items = [{ label: 'Web', id: 'web' }, { label: 'API', id: 'api' }];
  selection = items[1];
  await AskSelect.action('pick-one', items, { title: 'Target' });
  assert.equal(requests.at(-1)[0], ReceiveSelect.cmd);
  assert.deepEqual(await ReceiveSelect.middleware(requests.at(-1)[1]), ['pick-one', items[1]]);

  selection = items;
  await AskSelectMultiple.action('pick-many', items, { title: 'Targets' });
  assert.equal(requests.at(-1)[0], ReceiveSelectMultiple.cmd);
  assert.deepEqual(await ReceiveSelectMultiple.middleware(requests.at(-1)[1]), ['pick-many', items]);

  answer = 'Continue';
  await Popup.action('confirm', 'Continue?', ['Continue', 'Cancel']);
  assert.equal(requests.at(-1)[0], PopupResponse.cmd);
  assert.deepEqual(await PopupResponse.middleware(requests.at(-1)[1]), ['confirm', 'Continue']);

  selection = undefined;
  answer = undefined;
  await AskSelect.action('cancel', items, {});
  assert.deepEqual(await ReceiveSelect.middleware(requests.at(-1)[1]), ['cancel', null]);
});
