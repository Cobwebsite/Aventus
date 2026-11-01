import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const calls = [];
const pending = [];
const source = `export { ProgressStart } from './client/src/notification/ProgressStart.ts'; export { ProgressStop } from './client/src/notification/ProgressStop.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'progress-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const vscode = { ProgressLocation: { Notification: 15 }, window: { withProgress(options, callback) {
  calls.push(options);
  const promise = callback();
  pending.push(promise);
  return promise;
} } };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { ProgressStart, ProgressStop } = module.exports;

test('progress notifications keep independent IDs and resolve only the stopped operation', async () => {
  ProgressStart.action('first', 'Compile');
  ProgressStart.action('second', 'Publish');
  assert.deepEqual(calls, [
    { location: 15, title: 'Compile', cancellable: false },
    { location: 15, title: 'Publish', cancellable: false },
  ]);
  assert.deepEqual(Object.keys(ProgressStart.progress), ['first', 'second']);
  ProgressStop.action('missing');
  ProgressStop.action('first');
  await pending[0];
  assert.deepEqual(Object.keys(ProgressStart.progress), ['second']);
  ProgressStop.action('first');
  ProgressStop.action('second');
  await pending[1];
  assert.deepEqual(Object.keys(ProgressStart.progress), []);
});
