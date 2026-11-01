import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
let apiKey = '';
let translationFails = false;
const translations = [];
globalThis.__aventusEditorTranslation = { get apiKey() { return apiKey; }, get fails() { return translationFails; }, translations };
const source = `export { AventusI18nEditor } from './client/src/customEditors/AventusI18nEditor.ts'; export { AventusDBEditor } from './client/src/customEditors/AventusDBEditor.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'editors-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'editor-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/Settings$|\.\.\/Singleton$|\.\.\/communication\/i18n\/GetLocales$|^deepl-node$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('Settings')
      ? 'export const SettingsManager = { getInstance: () => ({ settings: { deeplApiKey: globalThis.__aventusEditorTranslation.apiKey } }) };'
      : args.path === 'deepl-node'
        ? 'export class Translator { constructor(key) { this.key = key; } async translateText(value, source, target) { globalThis.__aventusEditorTranslation.translations.push([this.key, value, source, target]); if (globalThis.__aventusEditorTranslation.fails) throw new Error("translation failed"); return { text: "Bonjour" }; } }'
      : args.path.endsWith('Singleton')
        ? 'export const Singleton = { client: { waitInit: async () => {} } };'
        : 'export const GetLocales = { execute: async () => ({ locales: [], fallback: "en-GB" }) };', loader: 'js' }));
  } }],
});
const applied = [];
const changeListeners = [];
const saveListeners = [];
const configurationWrites = [];
class WorkspaceEdit {
  changes = [];
  replace(uri, range, text) { this.changes.push({ uri, range, text }); }
}
class Range {
  constructor(startLine, startCharacter, endLine, endCharacter) {
    Object.assign(this, { startLine, startCharacter, endLine, endCharacter });
  }
}
const vscode = {
  WorkspaceEdit, Range, ConfigurationTarget: { Global: 1 },
  Uri: { joinPath(base, ...parts) { return { path: [base.path, ...parts].join('/') }; } },
  workspace: {
    applyEdit(edit) { applied.push(edit.changes); return Promise.resolve(true); },
    getConfiguration(section) { assert.equal(section, 'aventus'); return { async update(...args) { configurationWrites.push(args); } }; },
    onDidChangeTextDocument(callback) { changeListeners.push(callback); return { dispose() { const index = changeListeners.indexOf(callback); if (index >= 0) changeListeners.splice(index, 1); } }; },
    onDidSaveTextDocument(callback) { saveListeners.push(callback); return { dispose() { const index = saveListeners.indexOf(callback); if (index >= 0) saveListeners.splice(index, 1); } }; },
  },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AventusI18nEditor, AventusDBEditor } = module.exports;

function document(text, lineCount = 4) {
  return { uri: { value: 'file:///sample.avt' }, lineCount, getText: () => text };
}

test('i18n editor sorts keys and locales before replacing the entire document', async () => {
  applied.length = 0;
  const editor = new AventusI18nEditor({});
  const value = { zebra: { fr: 'z', en: 'z' }, alpha: { fr: 'a', en: 'a' } };
  await editor.triggerChange(value, document('{}'));
  assert.equal(applied.length, 1);
  assert.equal(applied[0][0].text, JSON.stringify({ alpha: { en: 'a', fr: 'a' }, zebra: { en: 'z', fr: 'z' } }, null, 4));
  assert.deepEqual(applied[0][0].range, new Range(0, 0, 4, 0));
});

test('DB editor avoids unchanged writes and formats a changed schema', async () => {
  applied.length = 0;
  const editor = new AventusDBEditor({});
  const value = { tables: [{ id: 'one' }] };
  const formatted = JSON.stringify(value, null, 2);
  await editor.triggerChange(value, document(formatted));
  assert.equal(applied.length, 0);
  await editor.triggerChange(value, document('{}', 2));
  assert.equal(applied.length, 1);
  assert.equal(applied[0][0].text, formatted);
  assert.deepEqual(applied[0][0].range, new Range(0, 0, 2, 0));
});

test('DB editor removes workspace listeners when its panel is disposed', async () => {
  changeListeners.length = 0;
  saveListeners.length = 0;
  const editor = new AventusDBEditor({ extensionUri: { path: '/extension' } });
  editor.setHtmlForWebview = () => {};
  const sent = [];
  let disposePanel;
  const panel = {
    webview: {
      onDidReceiveMessage() { return { dispose() {} }; },
      postMessage(message) { sent.push(message); },
    },
    onDidDispose(callback) { disposePanel = callback; return { dispose() {} }; },
  };
  const doc = { uri: { toString: () => 'file:///schema.db.avt' }, version: 1, isDirty: true, getText: () => '{}', lineCount: 1 };
  await editor.resolveCustomTextEditor(doc, panel, {});
  assert.equal(changeListeners.length, 1);
  assert.equal(saveListeners.length, 1);
  disposePanel();
  assert.equal(changeListeners.length, 0);
  assert.equal(saveListeners.length, 0);
  assert.deepEqual(sent, []);
});

test('DB editor webview routes load, save and apply changes without echoing its own edit', async () => {
  changeListeners.length = 0;
  saveListeners.length = 0;
  applied.length = 0;
  const editor = new AventusDBEditor({ extensionUri: { path: '/extension' } });
  editor.setHtmlForWebview = () => {};
  const sent = [];
  let receive;
  const panel = {
    webview: {
      onDidReceiveMessage(callback) { receive = callback; return { dispose() {} }; },
      postMessage(message) { sent.push(message); },
    },
    onDidDispose() { return { dispose() {} }; },
  };
  let contents = '{"tables":[]}';
  let saves = 0;
  const doc = { uri: { toString: () => 'file:///editor.db.avt' }, version: 1, isDirty: true,
    getText: () => contents, lineCount: 1, async save() { saves++; } };
  await editor.resolveCustomTextEditor(doc, panel, {});
  const flush = () => new Promise(resolve => setImmediate(resolve));
  receive({ channel: 'getData', uid: 'load' });
  await flush();
  assert.deepEqual(sent.at(-1), { channel: 'getData', uid: 'load', data: { tables: [] } });
  receive({ channel: 'save', uid: 'save' });
  await flush();
  assert.equal(saves, 1);
  assert.deepEqual(sent.at(-1), { channel: 'save', uid: 'save', data: true });
  receive({ channel: 'triggerChange', uid: 'change', data: { tables: [{ id: 'new' }] } });
  await flush();
  assert.equal(applied.length, 1);
  assert.equal(sent.at(-1).channel, 'triggerChange');
  contents = '{"tables":[{"id":"new"}]}';
  doc.version++;
  await changeListeners[0]({ document: doc });
  assert.equal(sent.at(-1).channel, 'is_dirty');
  contents = '{"tables":[{"id":"external"}]}';
  doc.version++;
  await changeListeners[0]({ document: doc });
  assert.deepEqual(sent.at(-1), { channel: 'update_content', data: { tables: [{ id: 'external' }] } });
});

test('i18n editor webview initializes filtered content, saves and reports missing translation key', async () => {
  changeListeners.length = 0;
  saveListeners.length = 0;
  const editor = new AventusI18nEditor({ extensionUri: { path: '/extension' } });
  editor.setHtmlForWebview = () => {};
  const uri = 'file:///messages%40app.i18n.avt';
  AventusI18nEditor.filtersByUri[uri] = 'welcome';
  const sent = [];
  let receive;
  const panel = {
    webview: {
      onDidReceiveMessage(callback) { receive = callback; return { dispose() {} }; },
      postMessage(message) { sent.push(message); },
    },
    onDidDispose() { return { dispose() {} }; },
  };
  let saves = 0;
  let contents = '{"welcome":{"en":"Hello"}}';
  const doc = { uri: { toString: () => uri }, version: 1, isDirty: false,
    getText: () => contents, lineCount: 1, async save() { saves++; } };
  await editor.resolveCustomTextEditor(doc, panel, {});
  const flush = () => new Promise(resolve => setImmediate(resolve));
  receive({ channel: 'init', uid: 'init' });
  await flush();
  assert.deepEqual(sent.at(-1), { channel: 'init', uid: 'init', data: {
    content: { welcome: { en: 'Hello' } }, filter: 'welcome', fallback: 'en-GB', locales: [], pageName: 'messages@app.i18n.avt',
  } });
  assert.equal(AventusI18nEditor.filtersByUri[uri], undefined);
  receive({ channel: 'save', uid: 'save' });
  await flush();
  assert.equal(saves, 1);
  assert.deepEqual(sent.at(-1), { channel: 'save', uid: 'save', data: true });
  receive({ channel: 'translate', uid: 'translate', data: { value: 'Hello', source: 'en-GB', destination: 'fr-FR' } });
  await flush();
  assert.deepEqual(sent.at(-1), { channel: 'translate', uid: 'translate', data: { error: 'No api key' } });
  receive({ channel: 'setApiKey', uid: 'key', data: { key: 'secret' } });
  await flush();
  assert.deepEqual(configurationWrites.at(-1), ['deeplApiKey', 'secret', 1]);
  assert.deepEqual(sent.at(-1), { channel: 'setApiKey', uid: 'key', data: true });
  receive({ channel: 'triggerChange', uid: 'change', data: { welcome: { en: 'Hi' } } });
  await flush();
  assert.equal(applied.at(-1)[0].text, JSON.stringify({ welcome: { en: 'Hi' } }, null, 4));
  contents = '{"welcome":{"en":"Hi"}}';
  doc.version++;
  await changeListeners[0]({ document: doc });
  assert.equal(sent.at(-1).channel, 'is_dirty');
  contents = '{"welcome":{"en":"External"}}';
  doc.version++;
  await changeListeners[0]({ document: doc });
  assert.deepEqual(sent.at(-1), { channel: 'update_content', data: { welcome: { en: 'External' } } });
});

test('i18n translation normalizes locale codes and reports provider errors', async () => {
  const editor = new AventusI18nEditor({});
  apiKey = 'test-key';
  translations.length = 0;
  try {
    assert.deepEqual(await editor.translate('Bonjour', 'fr-FR', 'en-US'), { result: 'Bonjour' });
    assert.deepEqual(translations, [['test-key', 'Bonjour', 'fr', 'en-GB']]);
    translationFails = true;
    const originalError = console.error;
    const errors = [];
    console.error = value => errors.push(value);
    try {
      assert.deepEqual(await editor.translate('Hello', 'en-US', 'de-DE'), { error: 'Error: translation failed' });
    } finally { console.error = originalError; }
    assert.deepEqual(translations.at(-1), ['test-key', 'Hello', 'en', 'de']);
    assert.equal(errors.length, 4);
  } finally {
    apiKey = '';
    translationFails = false;
  }
});

test('i18n editor removes workspace listeners when its panel is disposed', async () => {
  changeListeners.length = 0;
  saveListeners.length = 0;
  const editor = new AventusI18nEditor({ extensionUri: { path: '/extension' } });
  editor.setHtmlForWebview = () => {};
  const sent = [];
  let disposePanel;
  const panel = {
    webview: { onDidReceiveMessage() { return { dispose() {} }; }, postMessage(message) { sent.push(message); } },
    onDidDispose(callback) { disposePanel = callback; return { dispose() {} }; },
  };
  const doc = { uri: { toString: () => 'file:///closed.i18n.avt' }, version: 2, isDirty: true,
    getText: () => '{"key":{"en":"value"}}', lineCount: 1 };
  await editor.resolveCustomTextEditor(doc, panel, {});
  disposePanel();
  assert.equal(changeListeners.length, 0);
  assert.equal(saveListeners.length, 0);
  assert.deepEqual(sent, []);
});

test('editor HTML resolves every webview URL, nonce and CSP token', () => {
  const context = { extensionUri: { path: '/' + process.cwd().replace(/\\/g, '/') } };
  for (const Editor of [AventusI18nEditor, AventusDBEditor]) {
    const webview = {
      cspSource: 'vscode-resource:',
      asWebviewUri: () => ({ toString: () => 'vscode-webview:/assets' }),
    };
    new Editor(context).setHtmlForWebview(context, webview);
    assert.match(webview.html, /vscode-webview:\/assets\/index\.js/);
    assert.match(webview.html, /vscode-resource:/);
    assert.doesNotMatch(webview.html, /\$csp|\$nonce|~\/css/);
    assert.match(webview.html, /vscode-webview:\/assets\/(?:css\/theme\.css|style\.css)/);
  }
});

test('i18n editor close disposes the matching panel and allows reopening the same URI', async () => {
  const editor = new AventusI18nEditor({ extensionUri: { path: '/extension' } });
  editor.setHtmlForWebview = () => {};
  const uri = 'file:///reopen.i18n.avt';
  const doc = { uri: { toString: () => uri }, version: 1, isDirty: false, getText: () => '{}', lineCount: 1 };
  const panels = [];
  function panel() {
    const value = {
      disposed: false,
      webview: { onDidReceiveMessage() { return { dispose() {} }; }, postMessage() {} },
      onDidDispose(callback) { this.onDispose = callback; return { dispose() {} }; },
      dispose() { this.disposed = true; this.onDispose(); },
    };
    panels.push(value);
    return value;
  }
  await editor.resolveCustomTextEditor(doc, panel(), {});
  AventusI18nEditor.close(uri);
  assert.equal(panels[0].disposed, true);
  await editor.resolveCustomTextEditor(doc, panel(), {});
  AventusI18nEditor.close(uri);
  assert.equal(panels[1].disposed, true);
  assert.equal(panels.length, 2);
});

test('reopening an i18n panel leaves only the current generation listening', async () => {
  changeListeners.length = 0;
  saveListeners.length = 0;
  const editor = new AventusI18nEditor({ extensionUri: { path: '/extension' } });
  editor.setHtmlForWebview = () => {};
  const doc = { uri: { toString: () => 'file:///repeat.i18n.avt' }, version: 1, isDirty: false,
    getText: () => '{"key":{"en":"value"}}', lineCount: 1 };
  const generations = [];
  function panel() {
    const messages = [];
    let dispose;
    const value = {
      messages,
      webview: { onDidReceiveMessage() { return { dispose() {} }; }, postMessage(message) { messages.push(message); } },
      onDidDispose(callback) { dispose = callback; return { dispose() {} }; },
      dispose() { dispose(); },
    };
    generations.push(value);
    return value;
  }
  await editor.resolveCustomTextEditor(doc, panel(), {});
  generations[0].dispose();
  await editor.resolveCustomTextEditor(doc, panel(), {});
  assert.equal(changeListeners.length, 1);
  assert.equal(saveListeners.length, 1);
  doc.version++;
  for (const listener of changeListeners) await listener({ document: doc });
  assert.deepEqual(generations.map(panel => panel.messages.map(message => message.channel)), [
    [], ['is_dirty', 'update_content'],
  ]);
  generations[1].dispose();
});
