import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');
const namespaceRoot = `${process.platform === 'win32' ? '' : '/'}workspace/app/src/`;

test('folder namespace follows the configured root across nested folders', () => {
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        namespaceStrategy: 'followFolders',
        namespaceRoot,
    };

    assert.equal(build.getNamespaceForUri('file:///workspace/app/src/widget.lib.avt'), '');
    assert.equal(build.getNamespaceForUri('file:///workspace/app/src/admin/detail/widget.lib.avt'), 'admin.detail');
});

test('folder namespace is empty outside the configured root', () => {
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        namespaceStrategy: 'followFolders',
        namespaceRoot,
    };

    assert.equal(
        build.getNamespaceForUri('file:///workspace/app/src-old/admin/widget.lib.avt'),
        '',
    );
    assert.equal(build.getNamespaceForUri('file:///workspace/other/widget.lib.avt'), '');
});

test('folder namespace also accepts a root without a trailing separator', () => {
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        namespaceStrategy: 'followFoldersCamelCase',
        namespaceRoot: namespaceRoot.slice(0, -1),
    };

    assert.equal(build.getNamespaceForUri('file:///workspace/app/src/admin-detail/widget.lib.avt'), 'AdminDetail');
    assert.equal(build.getNamespaceForUri('file:///workspace/app/src-old/widget.lib.avt'), '');
});
