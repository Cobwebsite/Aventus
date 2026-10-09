import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { NpmBuilder } = await loadServerModule('project/BuildNpm.ts');

test('npm builder shares a wildcard import across files and removes it after the final unregister', () => {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    builder.register('file-a', { uri: '@demo/widgets', libName: '*', alias: 'Widgets' });
    builder.register('file-b', { uri: '@demo/widgets', libName: '*', alias: 'Controls' });
    let generated = builder.writeFileToCompile();
    assert.equal((generated.buildTxt.match(/from "@demo\/widgets"/g) ?? []).length, 1);
    assert.match(generated.toExport, /\['Widgets'\]/);
    assert.match(generated.toExport, /\['Controls'\]/);

    builder.unregister('file-a');
    generated = builder.writeFileToCompile();
    assert.doesNotMatch(generated.toExport, /\['Widgets'\]/);
    assert.match(generated.toExport, /\['Controls'\]/);

    builder.unregister('file-b');
    generated = builder.writeFileToCompile();
    assert.doesNotMatch(generated.buildTxt, /@demo\/widgets/);
    assert.doesNotMatch(generated.toExport, /\['Controls'\]/);
});

test('npm builder resolves existing node_modules from the project upward in nearest-first order', t => {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-paths-round5-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const project = join(root, 'project');
    const source = join(project, 'src', 'nested');
    mkdirSync(source, { recursive: true });
    mkdirSync(join(root, 'node_modules'));
    mkdirSync(join(project, 'node_modules'));
    const builder = new NpmBuilder({ isBuildAllowed: true });
    const found = builder.getPotentialNodeModulesPaths(source);
    assert.deepEqual(found.slice(0, 2), [join(project, 'node_modules'), join(root, 'node_modules')]);
    assert.equal(found.includes(join(source, 'node_modules')), false);
});
