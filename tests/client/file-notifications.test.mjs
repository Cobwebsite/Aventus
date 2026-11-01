import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = ['OpenFile', 'CloseFile', 'EditFile', 'DebugFileAdd', 'DebugFileRemove']
  .map(name => `export * as ${name} from './client/src/notification/${name}.ts';`).join('\n');
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'file-notifications-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'singleton-double', setup(build) {
    build.onResolve({ filter: /\.\.\/Singleton$/ }, () => ({ path: 'singleton', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Singleton = globalThis.__aventusFileTestSingleton;', loader: 'js' }));
  } }],
});
const shown = [];
const commands = [];
const applied = [];
const debug = [];
class WorkspaceEdit {
  replacements = [];
  replace(uri, range, text) { this.replacements.push({ uri, range, text }); }
}
class Range {
  constructor(start, end) { this.start = start; this.end = end; }
}
const vscode = {
  Uri: { parse: value => ({ value }) }, Range, WorkspaceEdit,
  window: { async showTextDocument(uri, options) { shown.push([uri, options]); } },
  commands: { executeCommand(name) { commands.push(name); } },
  workspace: { async applyEdit(edit) { applied.push(edit.replacements); return true; } },
};
globalThis.__aventusFileTestSingleton = { client: { debugFile: {
  register: (uri, content) => debug.push(['register', uri, content]),
  remove: uri => debug.push(['remove', uri]),
} } };
const module = { exports: {} };
try { new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name)); }
finally { delete globalThis.__aventusFileTestSingleton; }
const notifications = module.exports;

test('open and close notifications address the requested URI and close after the editor opens', async () => {
  notifications.OpenFile.OpenFile.action('file:///one.avt');
  notifications.CloseFile.CloseFile.action('file:///two.avt');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(shown, [
    [{ value: 'file:///one.avt' }, undefined],
    [{ value: 'file:///two.avt' }, { preview: true, preserveFocus: false }],
  ]);
  assert.deepEqual(commands, ['workbench.action.closeActiveEditor']);
});

test('file edits apply ordered transformation groups as separate workspace edits', async () => {
  const first = { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };
  const second = { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } };
  await notifications.EditFile.EditFile.action({ uri: 'file:///one.avt', transformations: [
    [{ range: first, newText: 'A' }, { range: second, newText: 'B' }],
    [{ range: first, newText: 'C' }],
  ] });
  assert.deepEqual(applied.map(group => group.map(item => item.text)), [['A', 'B'], ['C']]);
  assert.ok(applied.every(group => group.every(item => item.uri.value === 'file:///one.avt')));
  assert.deepEqual(applied[0][0].range, new Range(first.start, first.end));
});

test('debug file notifications register and remove the same URI', () => {
  notifications.DebugFileAdd.DebugFileAdd.action('debug:one', 'content');
  notifications.DebugFileRemove.DebugFileAdd.action('debug:one');
  assert.deepEqual(debug, [['register', 'debug:one', 'content'], ['remove', 'debug:one']]);
});
