import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = `export { Create } from './client/src/cmds/Create.ts'; export { MergeComponent } from './client/src/cmds/MergeComponent.ts'; export { SplitComponent } from './client/src/cmds/SplitComponent.ts'; export { Rename } from './client/src/cmds/Rename.ts'; export { Rename as RenameComponent } from './client/src/cmds/webcomponent/Rename.ts'; export { TemplateImport } from './client/src/cmds/file-system/ImportTemplate.ts'; export { ProjectImport } from './client/src/cmds/file-system/ImportProject.ts'; export { FileBatch } from './client/src/cmds/file-system/FileBatch.ts'; export { BuildProject } from './client/src/cmds/BuildProject.ts'; export { StaticExport } from './client/src/cmds/StaticExport.ts'; export { NpmBuild } from './client/src/cmds/npm/NpmBuild.ts'; export { PhpExport } from './client/src/cmds/php/Export.ts'; export { SharpExport } from './client/src/cmds/sharp/Export.ts'; export { StorePublishTemplate } from './client/src/cmds/store/PublishTemplate.ts'; export { StoreDownloadTemplate } from './client/src/cmds/store/DownloadTemplate.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'file-command-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const sent = [];
const vscode = { commands: { executeCommand(...args) { sent.push(args); } }, window: {} };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { Create, MergeComponent, SplitComponent, Rename, RenameComponent, TemplateImport, ProjectImport, FileBatch, BuildProject, StaticExport, NpmBuild, PhpExport, SharpExport, StorePublishTemplate, StoreDownloadTemplate } = module.exports;

test('file rename sends ordered URI pairs and middleware preserves server arguments', async () => {
  const uri = value => ({ toString: () => value });
  Rename.execute([
    { oldUri: uri('file:///old.avt'), newUri: uri('file:///new.avt') },
    { oldUri: uri('file:///before.css'), newUri: uri('file:///after.css') },
  ]);
  assert.deepEqual(sent, [['aventus.rename', [
    { oldUri: 'file:///old.avt', newUri: 'file:///new.avt' },
    { oldUri: 'file:///before.css', newUri: 'file:///after.css' },
  ]]]);
  const args = sent[0][1];
  assert.equal(await Rename.middleware(args), args);
});

test('component rename converts its URI and template imports discard arguments', async () => {
  assert.deepEqual(await RenameComponent.middleware([{ toString: () => 'file:///component.avt' }]), ['file:///component.avt']);
  assert.deepEqual(await TemplateImport.middleware(['ignored']), []);
  assert.deepEqual(await ProjectImport.middleware(['ignored']), []);
});

test('file batch command preserves all URI lists through dispatch', async () => {
  const changes = { created: ['file:///created.avt'], updated: ['file:///updated.avt'], deleted: ['file:///deleted.avt'] };
  const before = sent.length;
  FileBatch.execute(changes);
  assert.deepEqual(sent[before], ['aventus.filesystem.batch', changes]);
  assert.deepEqual(await FileBatch.middleware([changes]), [changes]);
});

test('build exports discard UI arguments while scoped exports keep their target', async () => {
  for (const Command of [BuildProject, StaticExport, NpmBuild]) {
    assert.deepEqual(await Command.middleware(['ignored']), []);
  }
  for (const Command of [PhpExport, SharpExport, StorePublishTemplate]) {
    assert.deepEqual(await Command.middleware([{ toString: () => 'file:///target.avt' }, 'extra']), ['file:///target.avt']);
    assert.deepEqual(await Command.middleware([]), []);
  }
  const before = sent.length;
  StoreDownloadTemplate.execute('https://example.test/template.zip');
  assert.deepEqual(sent[before], ['aventus.store.download_template', 'https://example.test/template.zip']);
  assert.deepEqual(await StoreDownloadTemplate.middleware(['https://example.test/template.zip']), ['https://example.test/template.zip']);
});


test('file changing middlewares handle explicit URI and missing target', async () => {
  const uri = { toString: () => 'file:///component.avt' };
  for (const Command of [Create, MergeComponent, SplitComponent, RenameComponent]) {
    assert.deepEqual(await Command.middleware([uri]), ['file:///component.avt']);
    assert.deepEqual(await Command.middleware([]), []);
  }
});
