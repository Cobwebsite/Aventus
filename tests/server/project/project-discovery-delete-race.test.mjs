import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts',
]);

test('deleting a configuration during initialization does not subscribe its retired project', async t => {
    const previous = {
        files: FilesManager.instance,
        autoLoad: ProjectManager.autoLoad,
        init: Project.prototype.init,
        loadFiles: Project.prototype.loadFiles,
    };
    const subscriptions = new Set();
    let nextSubscription = 0;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => { const id = ++nextSubscription; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    ProjectManager.autoLoad = true;
    Project.prototype.loadFiles = () => {};
    let finishFirst;
    const gate = new Promise(resolve => { finishFirst = resolve; });
    let initCalls = 0;
    Project.prototype.init = async () => { if (++initCalls === 1) await gate; };
    t.after(() => {
        finishFirst();
        FilesManager.instance = previous.files;
        ProjectManager.autoLoad = previous.autoLoad;
        Project.prototype.init = previous.init;
        Project.prototype.loadFiles = previous.loadFiles;
    });

    const uri = 'file:///workspace/race/aventus.conf.avt';
    const deleteCallbacks = [];
    const config = {
        folderUri: 'file:///workspace/race', documentUser: { uri }, validate: () => {},
        onDelete: callback => { deleteCallbacks.push(callback); return deleteCallbacks.length; },
    };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        config[`on${name}`] = () => name;
        config[`removeOn${name}`] = () => {};
    }
    config.removeOnDelete = () => {};
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    const firstDiscovery = manager.onNewFile(config);
    const first = manager.getProjectByUri(uri);
    assert.ok(first instanceof Project);
    assert.equal(deleteCallbacks.length, 0);
    await manager.onDeleteFile(config);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(subscriptions.size, 0);

    finishFirst();
    await firstDiscovery;
    assert.equal(deleteCallbacks.length, 0);

    await manager.onNewFile(config);
    const replacement = manager.getProjectByUri(uri);
    assert.ok(replacement instanceof Project);
    assert.notEqual(replacement, first);
    assert.equal(deleteCallbacks.length, 1);
    assert.equal(subscriptions.size, 1);

    await deleteCallbacks[0](config);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(subscriptions.size, 0);
});
