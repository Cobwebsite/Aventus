import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['client/src/manifest/AutoLoader.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const values = { aventus: { preventCustomData: [] }, html: { customData: [] }, emmet: { extensionsPath: [] } };
const writes = [], prompts = [], listeners = [];
let answer = 'Yes';
let promptBarrier;
const vscode = {
  ConfigurationTarget: { Workspace: 2 },
  workspace: {
    workspaceFolders: [{ uri: { toString: () => 'file:///project' } }],
    getWorkspaceFolder(uri) { return uri.toString().startsWith('file:///project/') ? this.workspaceFolders[0] : undefined; },
    asRelativePath(uri) { return uri.toString().slice('file:///project/'.length); },
    getConfiguration(section) { return {
      get(key) { return values[section][key]; },
      async update(key, value, target) { writes.push([section, key, [...value], target]); values[section][key] = [...value]; },
    }; },
    onDidChangeConfiguration(callback) { listeners.push(callback); return { dispose() {} }; },
  },
  window: { async showQuickPick(items, options) { prompts.push([items, options]); if (promptBarrier) await promptBarrier; return answer ? { label: answer } : undefined; } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AutoLoader } = module.exports;
const loader = AutoLoader.getInstance();
const uri = path => ({ toString: () => `file:///project/${path}` });

test('AutoLoader registers accepted HTML and Emmet manifests once', async () => {
  await loader.register(uri('app/vscode.html-custom-data.json'));
  await loader.register(uri('app/vscode.html-custom-data.json'));
  await loader.register(uri('app/snippets.json'));
  await loader.register(uri('app/snippets.json'));
  assert.equal(prompts.length, 2);
  assert.deepEqual(writes, [
    ['html', 'customData', ['./app/vscode.html-custom-data.json'], 2],
    ['emmet', 'extensionsPath', ['./app'], 2],
  ]);
});

test('AutoLoader remembers declined manifests and reloads configuration changes', async () => {
  answer = 'No';
  await loader.register(uri('other/snippets.json'));
  await loader.register(uri('other/snippets.json'));
  assert.deepEqual(writes.at(-1), ['aventus', 'preventCustomData', ['./other/snippets.json'], 2]);
  assert.equal(prompts.length, 3);
  values.aventus.preventCustomData = [];
  listeners[0]();
  answer = undefined;
  await loader.register(uri('other/snippets.json'));
  assert.equal(prompts.length, 4);
  assert.deepEqual(writes.at(-1), ['aventus', 'preventCustomData', ['./other/snippets.json'], 2]);
});

test('AutoLoader ignores a sibling path with the same workspace prefix', async () => {
  answer = 'No';
  const before = prompts.length;
  await loader.register({ toString: () => 'file:///project-other/snippets.json' });
  assert.equal(prompts.length, before);
  assert.deepEqual(writes.at(-1), ['aventus', 'preventCustomData', ['./other/snippets.json'], 2]);
});

test('concurrent AutoLoader events share one prompt and persist the manifest once', async () => {
  answer = 'Yes';
  let release;
  promptBarrier = new Promise(resolve => { release = resolve; });
  const beforePrompts = prompts.length;
  const beforeWrites = writes.length;
  try {
    const first = loader.register(uri('concurrent/vscode.html-custom-data.json'));
    const second = loader.register(uri('concurrent/vscode.html-custom-data.json'));
    assert.equal(prompts.length, beforePrompts + 1);
    release();
    await Promise.all([first, second]);
    assert.equal(writes.length, beforeWrites + 1);
    assert.deepEqual(values.html.customData.slice(-1), ['./concurrent/vscode.html-custom-data.json']);
  } finally {
    promptBarrier = undefined;
    release();
  }
});
