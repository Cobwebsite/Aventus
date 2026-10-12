import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

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

test('folder namespace currently leaks a neighboring source tree into the namespace', () => {
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        namespaceStrategy: 'followFolders',
        namespaceRoot,
    };

    // A sibling whose name begins with "src" is outside namespaceRoot.
    // Capture the current result until a source change can be agreed upon.
    assert.equal(
        build.getNamespaceForUri('file:///workspace/app/src-old/admin/widget.lib.avt'),
        'workspace.app.src-old.admin',
    );
});
