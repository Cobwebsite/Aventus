import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { NpmBuilder } = await loadServerModule('project/BuildNpm.ts');

test('npm builder returns an empty result when no modules are registered', async () => {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    assert.deepEqual(await builder.compile(), { result: '', errors: [] });
});

test('npm builder deduplicates imports and aliases shared by several files', () => {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    builder.register('file-a', { uri: 'library-one', libName: 'Button', alias: 'First' });
    builder.register('file-b', { uri: 'library-one', libName: 'Button', alias: 'Second' });
    builder.register('file-c', { uri: 'library-two', libName: 'Button', alias: 'Other' });
    const generated = builder.writeFileToCompile();
    assert.match(generated.buildTxt, /from "library-one"/);
    assert.match(generated.buildTxt, /from "library-two"/);
    assert.match(generated.toExport, /\["First"\]/);
    assert.match(generated.toExport, /\["Second"\]/);
    assert.match(generated.toExport, /\["Other"\]/);
    assert.equal((generated.buildTxt.match(/from "library-one"/g) ?? []).length, 1);

    builder.unregister('file-b');
    assert.doesNotMatch(builder.writeFileToCompile().toExport, /\["Second"\]/);
});

test('npm builder reports a missing namespace alias without registering the wildcard import', () => {
    const builder = new NpmBuilder({ isBuildAllowed: true });
    const diagnostics = builder.register('file-a', { uri: 'library', libName: '*' });
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0].message, /has no alias/);
    assert.equal(builder.storedInfo['file-a'], undefined);
});
