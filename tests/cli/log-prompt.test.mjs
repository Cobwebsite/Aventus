import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({
  entryPoints: ['cli/src/interaction/action/Log.ts'],
  absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs',
  packages: 'external', write: false,
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const Log = module.exports.default;

test('log prompt subscribes, refreshes, and releases its server callback on exit', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  input.isTTY = true;
  output.isTTY = true;
  output.columns = 80;
  const chunks = [];
  output.on('data', chunk => chunks.push(chunk.toString()));
  const errors = { '': {} };
  const subscribers = new Set();
  const events = [];
  const prompt = Log({
    errors,
    refresh(callback) { subscribers.add(callback); events.push('subscribe'); },
    stopRefresh(callback) { subscribers.delete(callback); events.push('unsubscribe'); },
  }, { input, output, clearPromptOnDone: true });
  try {
    await new Promise(resolve => setTimeout(resolve, 360));
    assert.equal(subscribers.size, 1);
    errors['']['file:///test.avt'] = [{ severity: 1, range: { start: { line: 2 } }, message: 'broken' }];
    for (const callback of subscribers) callback();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.match(chunks.join(''), /file:\/\/\/test\.avt:3/);
    assert.match(chunks.join(''), /broken/);
    input.write('\x0c');
    await prompt;
    assert.equal(subscribers.size, 0);
    assert.deepEqual(events, ['subscribe', 'unsubscribe']);
  } finally {
    input.destroy();
    output.destroy();
  }
});
