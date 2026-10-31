import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts',
]);

test('discovery without auto load registers the project and its deletion callback without initializing it', async t => {
    const previousFiles = FilesManager.instance;
    const previousAutoLoad = ProjectManager.autoLoad;
    const previousInit = Project.prototype.init;
    const previousLoadFiles = Project.prototype.loadFiles;
    const subscriptions = new Set();
    let nextSubscription = 0;
    let initCalls = 0;
    let deletion;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => { const id = ++nextSubscription; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    ProjectManager.autoLoad = false;
    Project.prototype.loadFiles = () => {};
    Project.prototype.init = async () => { initCalls++; };
    t.after(() => {
        FilesManager.instance = previousFiles;
        ProjectManager.autoLoad = previousAutoLoad;
        Project.prototype.init = previousInit;
        Project.prototype.loadFiles = previousLoadFiles;
    });

    const uri = 'file:///workspace/manual/aventus.conf.avt';
    const config = {
        uri,
        folderUri: 'file:///workspace/manual', documentUser: { uri }, validate: () => {},
        onDelete: callback => { deletion = callback; },
    };
    for (const name of ['Validate', 'Save', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        config[`on${name}`] = () => name;
        config[`removeOn${name}`] = () => {};
    }
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    await manager.onNewFile(config);
    const project = manager.getProjectByUri(uri);
    assert.ok(project instanceof Project);
    assert.deepEqual(manager.getAllConfigFiles(), [uri]);
    assert.equal(initCalls, 0);
    assert.equal(subscriptions.size, 1);
    assert.equal(typeof deletion, 'function');

    await deletion(config);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.deepEqual(manager.getAllConfigFiles(), []);
    assert.equal(subscriptions.size, 0);
});
