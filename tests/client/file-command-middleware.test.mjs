import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = `export { Rename } from './client/src/cmds/Rename.ts'; export { Rename as RenameComponent } from './client/src/cmds/webcomponent/Rename.ts'; export { TemplateImport } from './client/src/cmds/file-system/ImportTemplate.ts'; export { ProjectImport } from './client/src/cmds/file-system/ImportProject.ts'; export { ShowDependencies } from './client/src/cmds/ShowDependencies.ts'; export { FileCreated } from './client/src/cmds/file-system/FileCreated.ts'; export { FileUpdated } from './client/src/cmds/file-system/FileUpdated.ts'; export { FileDeleted } from './client/src/cmds/file-system/FileDeleted.ts'; export { BuildProject } from './client/src/cmds/BuildProject.ts'; export { StaticExport } from './client/src/cmds/StaticExport.ts'; export { NpmBuild } from './client/src/cmds/npm/NpmBuild.ts'; export { PhpExport } from './client/src/cmds/php/Export.ts'; export { SharpExport } from './client/src/cmds/sharp/Export.ts'; export { StorePublishTemplate } from './client/src/cmds/store/PublishTemplate.ts'; export { StoreDownloadTemplate } from './client/src/cmds/store/DownloadTemplate.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'file-command-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const sent = [];
const vscode = { commands: { executeCommand(...args) { sent.push(args); } }, window: {} };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { Rename, RenameComponent, TemplateImport, ProjectImport, ShowDependencies, FileCreated, FileUpdated, FileDeleted, BuildProject, StaticExport, NpmBuild, PhpExport, SharpExport, StorePublishTemplate, StoreDownloadTemplate } = module.exports;

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

test('show dependencies middleware only forwards its arguments', async () => {
  const args = ['file:///aventus.conf.avt'];
  assert.equal(await ShowDependencies.middleware(args), args);
  assert.deepEqual(sent.map(item => item[0]), ['aventus.rename']);
});

test('file create, update and delete commands preserve their URI through dispatch', async () => {
  for (const [Command, name] of [
    [FileCreated, 'aventus.filesystem.created'],
    [FileUpdated, 'aventus.filesystem.updated'],
    [FileDeleted, 'aventus.filesystem.deleted'],
  ]) {
    const before = sent.length;
    Command.execute('file:///changed.avt');
    assert.deepEqual(sent[before], [name, 'file:///changed.avt']);
    assert.deepEqual(await Command.middleware([{ toString: () => sent[before][1] }]), ['file:///changed.avt']);
  }
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
