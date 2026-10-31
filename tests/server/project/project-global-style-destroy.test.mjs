import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { FilesManager }] = await loadServerModules([
    'project/Project.ts', 'files/FilesManager.ts',
]);

test('destroyed project removes global style deletion subscriptions and ignores stale callbacks', async t => {
    const previous = FilesManager.instance;
    const removed = [];
    FilesManager.instance = { removeOnNewFile: id => removed.push(['new', id]) };
    t.after(() => { FilesManager.instance = previous; });
    const configRemoved = [];
    const configFile = {};
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${name}`] = id => configRemoved.push([name, id]);
    }
    const uri = 'file:///workspace/theme.gs.avt';
    const deleteCallbacks = new Map();
    const file = {
        uri,
        onDelete: callback => { deleteCallbacks.set('style-listener', callback); return 'style-listener'; },
        removeOnDelete: id => { removed.push(['delete', id]); deleteCallbacks.delete(id); },
    };
    const project = Object.create(Project.prototype);
    Object.assign(project, {
        configFile, builds: [], statics: [], scssFiles: { [uri]: { file } },
        onFileDeleteUUIDs: {}, onNewFileUUID: 'new-listener',
        onSaveUUID: 'Save', onValidateUUID: 'Validate', onFormattingUUID: 'Formatting',
        onCompletionUUID: 'Completion', onCompletionResolveUUID: 'CompletionResolve', onHoverUUID: 'Hover',
    });

    project.registerOnFileDelete(file);
    assert.equal(deleteCallbacks.size, 1);
    const staleCallback = deleteCallbacks.get('style-listener');
    project.destroy();
    assert.deepEqual(removed, [['new', 'new-listener'], ['delete', 'style-listener']]);
    assert.equal(configRemoved.length, 6);
    assert.equal(deleteCallbacks.size, 0);
    assert.deepEqual(project.onFileDeleteUUIDs, {});
    assert.deepEqual(project.scssFiles, {});

    await staleCallback(file);
    await project.onNewFile({ uri, path: '/workspace/theme.gs.avt' });
    assert.equal(deleteCallbacks.size, 0);
    assert.equal(project.scssFiles[uri], undefined);
    assert.deepEqual(removed, [['new', 'new-listener'], ['delete', 'style-listener']]);
});
