import assert from 'node:assert/strict';
import test from 'node:test';
import { sep } from 'node:path';
import { createRequire } from 'node:module';
import { loadServerModule } from '../server/helpers/load-ts.mjs';

// Compile the CLI source independently of its generated out/ directory.
const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['cli/src/tools.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const tools = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(tools, tools.exports, require);
const { DiagnosticSeverity } = await loadServerModule('tools.ts');

test('CLI path and URI conversion preserves escaped names and existing URI', () => {
  const path = sep === '\\' ? 'D:\\Aventus\\a b@c.avt' : '/tmp/a b@c.avt';
  const uri = tools.exports.pathToUri(path);
  assert.match(uri, /a%20b%40c\.avt$/);
  assert.equal(tools.exports.pathToUri(uri), uri);
  assert.equal(tools.exports.uriToPath(uri), sep === '\\' ? 'd:/Aventus/a b@c.avt' : path);
  assert.equal(tools.exports.normalizePath('a%3Ab%40c'), 'a:b@c');
});

test('CLI size formatting crosses binary thresholds', () => {
  assert.equal(tools.exports.parseSize(0), '0 Bytes');
  assert.equal(tools.exports.parseSize(1023), '1023 Bytes');
  assert.equal(tools.exports.parseSize(1024), '1 KiB');
  assert.equal(tools.exports.parseSize(1536), '1.5 KiB');
  assert.equal(tools.exports.parseSize(1024 ** 2), '1 MiB');
});

test('CLI diagnostic severity mapping matches protocol values', () => {
  assert.deepEqual(tools.exports.DiagnosticSeverity, { Error: 1, Warning: 2, Information: 3, Hint: 4 });
});
