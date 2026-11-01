import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = `export { CreateProperty } from './client/src/cmds/webcomponent/CreateProperty.ts'; export { CreateAttribute } from './client/src/cmds/webcomponent/CreateAttribute.ts'; export { CreateWatch } from './client/src/cmds/webcomponent/CreateWatch.ts'; export { CreateCSSVariable } from './client/src/cmds/webcomponent/CreateCSSVariable.ts'; export { ImportViewMethod } from './client/src/cmds/webcomponent/ImportViewMethod.ts'; export { ImportViewElement } from './client/src/cmds/webcomponent/ImportViewElement.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'webcomponent-commands-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'quick-pick-double', setup(build) {
    build.onResolve({ filter: /\.\.\/\.\.\/quickPick$/ }, () => ({ path: 'quickPick', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const BuildQuickPick = {};', loader: 'js' }));
  } }],
});
const window = { activeTextEditor: undefined };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? { window } : require(name));
const { CreateProperty, CreateAttribute, CreateWatch, CreateCSSVariable, ImportViewMethod, ImportViewElement } = module.exports;
const commands = [CreateProperty, CreateAttribute, CreateWatch, CreateCSSVariable, ImportViewMethod, ImportViewElement];

test('webcomponent middlewares return no file arguments without an active editor', async () => {
  for (const command of commands) assert.deepEqual(await command.middleware([]), []);
});

test('webcomponent middlewares use the active URI and cursor offset', async () => {
  window.activeTextEditor = {
    document: { uri: { toString: () => 'file:///component.wc.avt' }, offsetAt: position => position.offset },
    selection: { active: { offset: 42 } },
  };
  assert.deepEqual(await CreateProperty.middleware([]), ['file:///component.wc.avt', 42, '']);
  assert.deepEqual(await CreateAttribute.middleware([]), ['file:///component.wc.avt', 42]);
  assert.deepEqual(await CreateWatch.middleware([]), ['file:///component.wc.avt', 42, '']);
  assert.deepEqual(await CreateCSSVariable.middleware([]), ['file:///component.wc.avt', 42]);
  assert.deepEqual(await ImportViewMethod.middleware([]), ['file:///component.wc.avt', 42]);
  assert.deepEqual(await ImportViewElement.middleware([]), ['file:///component.wc.avt', 42]);
});

test('prefill and matching explicit URI use the active document position', async () => {
  assert.deepEqual(await CreateProperty.middleware(['prefill:count']), ['file:///component.wc.avt', 42, 'count']);
  assert.deepEqual(await CreateWatch.middleware(['prefill:ready']), ['file:///component.wc.avt', 42, 'ready']);
  for (const command of commands) {
    const args = await command.middleware([{ toString: () => 'file:///component.wc.avt' }]);
    assert.equal(args[0], 'file:///component.wc.avt');
    assert.equal(args[1], 42);
  }
});

test('webcomponent middlewares reject an explicit URI different from the active document', async () => {
  for (const command of commands) {
    assert.deepEqual(await command.middleware([{ toString: () => 'file:///other.wc.avt' }]), []);
  }
});
