import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['client/src/notification/ShowLoadingMessage.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const calls = [];
const pending = [];
const vscode = { ProgressLocation: { Notification: 10 }, window: { withProgress(options, callback) {
  calls.push(options);
  const promise = callback();
  pending.push(promise);
  return promise;
} } };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { ShowLoadingMessage, HideLoadingMessage } = module.exports;

test('loading message resolves the matching progress and leaves another pending', async () => {
  const originalLog = console.log;
  console.log = () => {};
  try {
    await ShowLoadingMessage.action('first', { message: 'Compiling', cancellable: true });
    await ShowLoadingMessage.action('second', { message: 'Publishing' });
    assert.deepEqual(calls, [
      { location: 10, title: 'Compiling', cancellable: true },
      { location: 10, title: 'Publishing', cancellable: undefined },
    ]);
    assert.deepEqual(Object.keys(ShowLoadingMessage.waitings), ['first', 'second']);
    await HideLoadingMessage.action('first');
    await pending[0];
    assert.deepEqual(Object.keys(ShowLoadingMessage.waitings), ['second']);
    await HideLoadingMessage.action('second');
    await pending[1];
    assert.deepEqual(Object.keys(ShowLoadingMessage.waitings), []);
  } finally { console.log = originalLog; }
});

test('early hide is consumed when the same loading message starts', async () => {
  const originalLog = console.log;
  console.log = () => {};
  try {
    await HideLoadingMessage.action('early');
    assert.deepEqual(ShowLoadingMessage.alreadyCancelled, ['early']);
    await ShowLoadingMessage.action('early', { message: 'Late' });
    await pending.at(-1);
    assert.deepEqual(ShowLoadingMessage.alreadyCancelled, []);
    assert.equal(ShowLoadingMessage.waitings.early, undefined);
  } finally { console.log = originalLog; }
});
