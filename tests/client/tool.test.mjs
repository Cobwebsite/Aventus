import assert from 'node:assert/strict';
import test from 'node:test';
import { sep } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['client/src/tool.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const lines = [];
let channels = 0;
const vscode = { window: { createOutputChannel(name) { channels++; assert.equal(name, 'Aventus Client'); return { appendLine(line) { lines.push(line); } }; } } };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const tools = module.exports;

test('client path and URI conversion handles spaces and round trips', () => {
  const path = sep === '\\' ? 'D:\\Aventus\\a b.avt' : '/tmp/a b.avt';
  const uri = tools.pathToUri(path);
  assert.match(uri, /a%20b\.avt$/);
  assert.equal(tools.pathToUri(uri), uri);
  assert.equal(tools.uriToPath(uri), sep === '\\' ? 'D:/Aventus/a b.avt' : path);
});

test('nonce has a fresh 32-character alphanumeric value', () => {
  const first = tools.getNonce();
  assert.match(first, /^[A-Za-z0-9]{32}$/);
  assert.notEqual(tools.getNonce(), first);
});

test('logging lazily creates and reuses one output channel', () => {
  assert.equal(channels, 0);
  tools.log('first');
  tools.log('second');
  assert.equal(channels, 1);
  assert.deepEqual(lines, ['first', 'second']);
});
