import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts',
]);

test('configuration discovery is exact and waits while its sibling template exists', async t => {
    const previousFiles = FilesManager.instance;
    const previousAutoLoad = ProjectManager.autoLoad;
    const templateUri = 'file:///workspace/app/template.avt.ts';
    const configUri = 'file:///workspace/app/aventus.conf.avt';
    const templates = new Set([templateUri]);
    const subscriptions = new Set();
    FilesManager.instance = {
        getByUri: uri => templates.has(uri) ? { uri } : undefined,
        onNewFile: () => { subscriptions.add('project'); return 'project'; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    ProjectManager.autoLoad = false;
    t.after(() => {
        FilesManager.instance = previousFiles;
        ProjectManager.autoLoad = previousAutoLoad;
    });

    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    let registeredDeletes = 0;
    let deleteConfig;
    const config = {
        uri: configUri, folderUri: 'file:///workspace/app',
        documentUser: { uri: configUri }, validate: () => {},
        onDelete: cb => { registeredDeletes++; deleteConfig = cb; return 'delete'; },
    };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        config[`on${name}`] = () => name;
        config[`removeOn${name}`] = () => {};
    }

    await manager.onNewFile({ documentUser: { uri: `${configUri}.backup` } });
    await manager.onNewFile(config);
    assert.deepEqual(manager.getAllConfigFiles(), []);
    assert.equal(registeredDeletes, 0);
    assert.equal(subscriptions.size, 0);

    templates.delete(templateUri);
    await manager.onNewFile(config);
    const first = manager.getProjectByUri(configUri);
    assert.ok(first instanceof Project);
    assert.deepEqual(manager.getAllConfigFiles(), [configUri]);
    assert.equal(registeredDeletes, 1);
    assert.equal(subscriptions.size, 1);

    await deleteConfig(config);
    assert.deepEqual(manager.getAllConfigFiles(), []);
    assert.equal(subscriptions.size, 0);
    await manager.onNewFile(config);
    assert.ok(manager.getProjectByUri(configUri) instanceof Project);
    assert.notEqual(manager.getProjectByUri(configUri), first);
    assert.equal(registeredDeletes, 2);
    manager.getProjectByUri(configUri).destroy();
});
