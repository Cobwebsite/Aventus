import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({
  stdin: { contents: "export { default as Select } from './cli/src/interaction/action/Select.ts'; export { default as Input } from './cli/src/interaction/action/Input.ts'; export { default as Checkbox } from './cli/src/interaction/action/Checkbox.ts'; export { default as FileTree } from './cli/src/interaction/action/FileTree.ts';", resolveDir: process.cwd(), sourcefile: 'terminal-prompts-entry.ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
});
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { Select, Input, Checkbox, FileTree } = module.exports;

async function runPrompt(prompt, config, keys) {
  const input = new PassThrough();
  const output = new PassThrough();
  input.isTTY = true;
  output.isTTY = true;
  output.columns = 80;
  const chunks = [];
  output.on('data', chunk => chunks.push(chunk.toString()));
  const response = prompt(config, { input, output, clearPromptOnDone: true });
  try {
    for (const key of keys) {
      await new Promise(resolve => setTimeout(resolve, 15));
      input.write(key);
    }
    return { value: await response, output: chunks.join('') };
  } finally {
    input.destroy();
    output.destroy();
  }
}

test('terminal selection skips a disabled choice and closes with the chosen value', { timeout: 3000 }, async () => {
  const result = await runPrompt(Select, { message: 'Build', choices: [
    { name: 'Web', value: 'web' }, { name: 'Disabled', value: 'disabled', disabled: true }, { name: 'API', value: 'api' },
  ] }, ['\x1b[B', '\r']);
  assert.equal(result.value, 'api');
  assert.match(result.output, /Build/);
  assert.match(result.output, /API/);
});

test('terminal input rejects an invalid answer, accepts correction, and supports cancellation', { timeout: 3000 }, async () => {
  const config = { message: 'Name', validate: value => value.length >= 3 || 'Too short' };
  const valid = await runPrompt(Input, config, ['ab', '\r', 'c', '\r']);
  assert.equal(valid.value, 'abc');
  assert.match(valid.output, /Too short/);
  const cancelled = await runPrompt(Input, config, ['\x0c']);
  assert.equal(cancelled.value, null);
});

test('terminal checkbox selects multiple choices and closes on Ctrl+L', { timeout: 3000 }, async () => {
  const config = { message: 'Targets', choices: [
    { name: 'Web', value: 'web' }, { name: 'API', value: 'api' },
  ] };
  const selected = await runPrompt(Checkbox, config, [' ', '\x1b[B', ' ', '\r']);
  assert.deepEqual(selected.value, ['web', 'api']);
  const cancelled = await runPrompt(Checkbox, config, ['\x0c']);
  assert.equal(cancelled.value, null);
});

test('terminal file tree navigates a temporary directory and closes on selection or cancellation', { timeout: 3000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'aventus-tree-'));
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args);
  try {
    const child = join(root, 'child');
    const file = join(child, 'sample.avt');
    await mkdir(child);
    await writeFile(file, 'sample');
    const directory = await runPrompt(FileTree, { message: 'Directory', basePath: root, type: 'directory' }, ['\r']);
    assert.equal(directory.value, child);
    const selected = await runPrompt(FileTree, { message: 'File', basePath: root, type: 'file' }, [' ', '\r']);
    assert.equal(selected.value, file);
    assert.match(selected.output, /sample\.avt/);
    const cancelled = await runPrompt(FileTree, { message: 'File', basePath: root, type: 'file' }, ['\x0c']);
    assert.equal(cancelled.value, null);
    assert.deepEqual(logs, []);
  } finally {
    console.log = originalLog;
    await rm(root, { recursive: true, force: true });
  }
});
