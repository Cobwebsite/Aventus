import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { FilesManager } = await loadServerModule('files/FilesManager.ts');

function manager() {
    const instance = Object.create(FilesManager.prototype);
    instance.files = {
        'file:///d%3A/app/src/a.wcl.avt': { uri: 'file:///d%3A/app/src/a.wcl.avt', path: 'D:/app/src/a.wcl.avt' },
        'file:///d%3A/app/src/b.wcs.avt': { uri: 'file:///d%3A/app/src/b.wcs.avt', path: 'D:/app/src/b.wcs.avt' },
        'file:///d%3A/app/other/c.wcl.avt': { uri: 'file:///d%3A/app/other/c.wcl.avt', path: 'D:/app/other/c.wcl.avt' },
    };
    instance.onNewFileCb = {};
    instance.onFileRemoveCb = {};
    return instance;
}

test('file manager finds registered files by URI, path, extension and regex', () => {
    const instance = manager();
    assert.equal(instance.getByUri('file:///d%3A/app/src/a.wcl.avt'), instance.files['file:///d%3A/app/src/a.wcl.avt']);
    assert.equal(instance.getByUri('file:///missing'), undefined);
    assert.equal(instance.getByPath('D:/app/src/a.wcl.avt'), instance.files['file:///d%3A/app/src/a.wcl.avt']);
    assert.deepEqual(instance.getFilesWithExtension('.wcl.avt').map(file => file.uri), [
        'file:///d%3A/app/src/a.wcl.avt', 'file:///d%3A/app/other/c.wcl.avt',
    ]);
    assert.equal(instance.getFilesWithExtension(['.wcl.avt', '.wcs.avt']).length, 3);
    assert.equal(instance.getFilesMatching(/\/src\//).length, 2);
    assert.equal(instance.getUris().length, 3);
});

test('file manager registers and removes file callbacks', () => {
    const instance = manager();
    const newFile = instance.onNewFile(async () => {});
    const removedFile = instance.onFileRemove(async () => {});
    assert.equal(typeof instance.onNewFileCb[newFile], 'function');
    assert.equal(typeof instance.onFileRemoveCb[removedFile], 'function');
    instance.removeOnNewFile(newFile);
    instance.removeOnFileRemove(removedFile);
    assert.equal(instance.onNewFileCb[newFile], undefined);
    assert.equal(instance.onFileRemoveCb[removedFile], undefined);
});
