import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts',
]);

test('a failed project initialization leaves its registration and prevents rediscovery until deletion', async t => {
    const previous = {
        files: FilesManager.instance,
        autoLoad: ProjectManager.autoLoad,
        init: Project.prototype.init,
        loadFiles: Project.prototype.loadFiles,
    };
    const subscriptions = new Set();
    let nextId = 0;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => {
            const id = `new-${++nextId}`;
            subscriptions.add(id);
            return id;
        },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    ProjectManager.autoLoad = true;
    Project.prototype.loadFiles = () => {};
    let attempts = 0;
    Project.prototype.init = async function () {
        attempts++;
        if (attempts === 1) throw new Error('transient initialization failure');
    };
    t.after(() => {
        FilesManager.instance = previous.files;
        ProjectManager.autoLoad = previous.autoLoad;
        Project.prototype.init = previous.init;
        Project.prototype.loadFiles = previous.loadFiles;
    });

    const uri = 'file:///workspace/aventus.conf.avt';
    let onDelete;
    const file = {
        uri,
        folderUri: 'file:///workspace',
        documentUser: TextDocument.create(uri, 'json', 1, '{}'),
        validate: () => {},
        onDelete: callback => { onDelete = callback; return 'delete'; },
    };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        file[`on${name}`] = () => name;
        file[`removeOn${name}`] = () => {};
    }
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    await assert.rejects(manager.onNewFile(file), /transient initialization failure/);
    const failed = manager.getProjectByUri(uri);
    assert.ok(failed instanceof Project);
    assert.equal(onDelete, undefined);
    assert.equal(subscriptions.size, 1);

    const priorError = console.error;
    const errors = [];
    console.error = message => errors.push(message);
    try {
        await manager.onNewFile(file);
    } finally {
        console.error = priorError;
    }
    assert.equal(attempts, 1);
    assert.equal(manager.getProjectByUri(uri), failed);
    assert.match(errors[0], /already inside project manager/);

    await manager.onDeleteFile(file);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(subscriptions.size, 0);
    await manager.onNewFile(file);
    assert.equal(attempts, 2);
    assert.ok(manager.getProjectByUri(uri) instanceof Project);
    assert.notEqual(manager.getProjectByUri(uri), failed);
    assert.equal(typeof onDelete, 'function');
    await onDelete(file);
    assert.equal(subscriptions.size, 0);
});
