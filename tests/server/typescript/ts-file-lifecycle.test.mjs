import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, , { AventusTsFile }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'language-services/ts/File.ts',
    'language-services/ts/package/File.ts', 'project/DependencyManager.ts',
]);

function fixture() {
    const events = [];
    const build = {
        build: () => events.push('build'),
        npmBuilder: { unregister: uri => events.push(`unregister:${uri}`) },
        tsLanguageService: {
            removeFile: file => events.push(file === tsFile ? 'remove' : 'wrong-file'),
        },
        reloadPage: false,
    };
    const tsFile = Object.create(AventusTsFile.prototype);
    tsFile._build = build;
    tsFile._file = { uri: 'file:///demo/a.lib.avt', versionUser: 3, versionInternal: 5 };
    tsFile._compileResult = [];
    tsFile.diagnostics = [{ message: 'first' }];
    tsFile.oldFullSrc = [];
    tsFile.oldFullDocVisible = '';
    tsFile.oldFullDocInvisible = '';
    tsFile.oldFullClassScript = '';
    return { tsFile, build, events };
}

function result(overrides = {}) {
    return { compiled: 'class A {}', classScript: 'A', docVisible: 'A docs', docInvisible: 'internal', ...overrides };
}

test('TS file rebuilds only when compiled output, docs or class identity change', () => {
    const { tsFile, build, events } = fixture();
    assert.equal(tsFile.version, 3);
    assert.equal(tsFile.versionInternal, 5);
    const copy = tsFile.getDiagnostics();
    copy.pop();
    assert.equal(tsFile.getDiagnostics().length, 1);

    tsFile.setCompileResult([result()]);
    assert.deepEqual(events, ['build']);
    assert.equal(build.reloadPage, true);
    build.reloadPage = false;
    tsFile.setCompileResult([result()]);
    assert.deepEqual(events, ['build']);
    assert.equal(build.reloadPage, false);

    tsFile.setCompileResult([result({ docVisible: 'updated docs' })]);
    tsFile.setCompileResult([result({ docVisible: 'updated docs', docInvisible: 'updated internal' })]);
    tsFile.setCompileResult([result({ compiled: 'class A { value = 1 }', docVisible: 'updated docs', docInvisible: 'updated internal' })]);
    tsFile.setCompileResult([result({ classScript: 'B', compiled: 'class A { value = 1 }', docVisible: 'updated docs', docInvisible: 'updated internal' })]);
    assert.equal(events.length, 5);
    assert.equal(tsFile.compileResult[0].classScript, 'B');
    tsFile.setCompileResult([]);
    assert.equal(events.length, 6);
});

test('TS file deletion unregisters the service entry and npm builder', async () => {
    const { tsFile, events } = fixture();
    await tsFile.onDelete();
    assert.deepEqual(events, ['remove', 'unregister:file:///demo/a.lib.avt']);

    events.length = 0;
    tsFile.mustBeAddedToLanguageService = () => false;
    await tsFile.onDelete();
    assert.deepEqual(events, ['unregister:file:///demo/a.lib.avt']);
});
