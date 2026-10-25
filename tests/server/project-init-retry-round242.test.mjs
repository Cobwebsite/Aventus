import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }, { GenericServer }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts', 'GenericServer.ts',
]);

test('a failed project initialization is cleaned up before discovery retries the same config', async t => {
    const previousFiles = FilesManager.instance;
    const previousAutoLoad = ProjectManager.autoLoad;
    const previousInit = Project.prototype.init;
    const previousLoadFiles = Project.prototype.loadFiles;
    const previousShowErrorMessage = GenericServer.showErrorMessage;
    const messages = [];
    GenericServer.showErrorMessage = message => messages.push(message);
    const liveSubscriptions = new Set();
    const instances = [];
    const configSubscriptions = new Map();
    const deleteCallbacks = [];
    let nextId = 0;
    let validations = 0;

    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => {
            const id = `new-${++nextId}`;
            liveSubscriptions.add(id);
            return id;
        },
        removeOnNewFile: id => liveSubscriptions.delete(id),
    };
    ProjectManager.autoLoad = true;
    Project.prototype.loadFiles = () => {};
    Project.prototype.init = async function () {
        instances.push(this);
        if (instances.length === 1) throw new Error('initial configuration failed');
    };
    t.after(() => {
        FilesManager.instance = previousFiles;
        ProjectManager.autoLoad = previousAutoLoad;
        Project.prototype.init = previousInit;
        Project.prototype.loadFiles = previousLoadFiles;
        GenericServer.showErrorMessage = previousShowErrorMessage;
    });

    const uri = 'file:///workspace/retry/aventus.conf.avt';
    const config = {
        folderUri: 'file:///workspace/retry',
        documentUser: { uri },
        validate: () => { validations++; },
        onDelete: callback => { deleteCallbacks.push(callback); },
    };
    for (const name of ['Validate', 'Save', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configSubscriptions.set(name, new Set());
        config[`on${name}`] = () => {
            const id = `${name}-${++nextId}`;
            configSubscriptions.get(name).add(id);
            return id;
        };
        config[`removeOn${name}`] = id => configSubscriptions.get(name).delete(id);
    }
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    await manager.onNewFile(config);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /initial configuration failed/);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(liveSubscriptions.size, 0);
    assert.ok([...configSubscriptions.values()].every(subscriptions => subscriptions.size === 0));
    assert.equal(deleteCallbacks.length, 0);

    await manager.onNewFile(config);
    const recovered = manager.getProjectByUri(uri);
    assert.ok(recovered instanceof Project);
    assert.notEqual(recovered, instances[0]);
    assert.deepEqual(instances, [instances[0], recovered]);
    assert.equal(validations, 2);
    assert.equal(liveSubscriptions.size, 1);
    assert.ok([...configSubscriptions.values()].every(subscriptions => subscriptions.size === 1));
    assert.equal(deleteCallbacks.length, 1);
    assert.equal(messages.length, 1);

    await deleteCallbacks[0](config);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(liveSubscriptions.size, 0);
    assert.ok([...configSubscriptions.values()].every(subscriptions => subscriptions.size === 0));
});
