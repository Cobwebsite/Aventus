import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }, { GenericServer }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts', 'GenericServer.ts',
]);

test('a failed project initialization is cleaned up and can be retried on rediscovery', async t => {
    const previous = {
        files: FilesManager.instance,
        autoLoad: ProjectManager.autoLoad,
        init: Project.prototype.init,
        loadFiles: Project.prototype.loadFiles,
        showErrorMessage: GenericServer.showErrorMessage,
    };
    const messages = [];
    GenericServer.showErrorMessage = message => messages.push(message);
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
        GenericServer.showErrorMessage = previous.showErrorMessage;
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

    await manager.onNewFile(file);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /transient initialization failure/);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.equal(onDelete, undefined);
    assert.equal(subscriptions.size, 0);

    await manager.onNewFile(file);
    assert.equal(attempts, 2);
    assert.ok(manager.getProjectByUri(uri) instanceof Project);
    assert.equal(subscriptions.size, 1);
    assert.equal(typeof onDelete, 'function');
    assert.equal(messages.length, 1);
    await onDelete(file);
    assert.equal(subscriptions.size, 0);
});
