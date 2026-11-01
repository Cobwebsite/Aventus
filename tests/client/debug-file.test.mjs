import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['client/src/file-system/DebugFile.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
class EventEmitter { event = () => {}; }
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? { EventEmitter } : require(name));
const { DebugFile } = module.exports;

test('debug content provider replaces, isolates and removes virtual documents', () => {
  const provider = new DebugFile();
  const first = { path: 'one' };
  const second = { path: 'two' };
  assert.equal(DebugFile.schema, 'avdebug');
  assert.equal(provider.provideTextDocumentContent(first), undefined);
  provider.register('one', 'initial');
  provider.register('two', 'other');
  provider.register('one', 'updated');
  assert.equal(provider.provideTextDocumentContent(first), 'updated');
  assert.equal(provider.provideTextDocumentContent(second), 'other');
  provider.remove('one');
  assert.equal(provider.provideTextDocumentContent(first), undefined);
  assert.equal(provider.provideTextDocumentContent(second), 'other');
});
