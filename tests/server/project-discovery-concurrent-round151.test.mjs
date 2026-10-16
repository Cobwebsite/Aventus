import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts',
]);

test('concurrent notifications for one configuration create one project while initialization is pending', async t => {
    const previousFiles = FilesManager.instance;
    const previousAutoLoad = ProjectManager.autoLoad;
    const previousInit = Project.prototype.init;
    const previousLoadFiles = Project.prototype.loadFiles;
    const previousError = console.error;
    const subscriptions = new Set();
    const errors = [];
    let releaseInit;
    const initialization = new Promise(resolve => { releaseInit = resolve; });
    let initCalls = 0;
    let deleteCallback;
    let deleteSubscriptions = 0;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => { const id = `subscription-${subscriptions.size + 1}`; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    ProjectManager.autoLoad = true;
    Project.prototype.loadFiles = () => {};
    Project.prototype.init = async () => { initCalls++; await initialization; };
    console.error = message => errors.push(message);
    t.after(() => {
        FilesManager.instance = previousFiles;
        ProjectManager.autoLoad = previousAutoLoad;
        Project.prototype.init = previousInit;
        Project.prototype.loadFiles = previousLoadFiles;
        console.error = previousError;
    });

    const uri = 'file:///workspace/app/aventus.conf.avt';
    const config = {
        folderUri: 'file:///workspace/app', documentUser: { uri }, validate: () => {},
        onDelete: callback => { deleteSubscriptions++; deleteCallback = callback; },
    };
    for (const name of ['Validate', 'Save', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        config[`on${name}`] = () => name;
        config[`removeOn${name}`] = () => {};
    }
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    const first = manager.onNewFile(config);
    const registered = manager.getProjectByUri(uri);
    assert.ok(registered instanceof Project);
    assert.equal(initCalls, 1);
    await manager.onNewFile(config);
    assert.equal(manager.getProjectByUri(uri), registered);
    assert.equal(initCalls, 1);
    assert.equal(subscriptions.size, 1);
    assert.equal(deleteSubscriptions, 0);
    assert.equal(errors.length, 1);

    releaseInit();
    await first;
    assert.equal(deleteSubscriptions, 1);
    await deleteCallback(config);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(subscriptions.size, 0);
});

test('failed project initialization removes the registry entry and its subscriptions', async t => {
    const previousFiles = FilesManager.instance;
    const previousAutoLoad = ProjectManager.autoLoad;
    const previousInit = Project.prototype.init;
    const previousLoadFiles = Project.prototype.loadFiles;
    const previousError = console.error;
    const subscriptions = new Set();
    let initCalls = 0;
    let deleteSubscriptions = 0;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => { const id = `subscription-${subscriptions.size + 1}`; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    ProjectManager.autoLoad = true;
    Project.prototype.loadFiles = () => {};
    Project.prototype.init = async () => { initCalls++; throw new Error('initialization failed'); };
    console.error = () => {};
    t.after(() => {
        FilesManager.instance = previousFiles;
        ProjectManager.autoLoad = previousAutoLoad;
        Project.prototype.init = previousInit;
        Project.prototype.loadFiles = previousLoadFiles;
        console.error = previousError;
    });

    const uri = 'file:///workspace/app/aventus.conf.avt';
    const config = {
        folderUri: 'file:///workspace/app', documentUser: { uri }, validate: () => {},
        onDelete: () => { deleteSubscriptions++; },
    };
    for (const name of ['Validate', 'Save', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        config[`on${name}`] = () => name;
        config[`removeOn${name}`] = () => {};
    }
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    await assert.rejects(manager.onNewFile(config), /initialization failed/);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(initCalls, 1);
    assert.equal(deleteSubscriptions, 0);
    assert.equal(subscriptions.size, 0);
});
