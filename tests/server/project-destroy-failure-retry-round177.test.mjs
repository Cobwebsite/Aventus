import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { FilesManager }, { GenericServer }] = await loadServerModules([
    'project/Project.ts', 'files/FilesManager.ts', 'GenericServer.ts',
]);

test('a failed child build cleanup does not stop other resources and can be retried', t => {
    const oldFiles = FilesManager.instance;
    const oldShowErrorMessage = GenericServer.showErrorMessage;
    const released = [];
    const messages = [];
    FilesManager.instance = { removeOnNewFile: id => released.push(`file:${id}`) };
    GenericServer.showErrorMessage = message => messages.push(message);
    t.after(() => { FilesManager.instance = oldFiles; GenericServer.showErrorMessage = oldShowErrorMessage; });

    const project = Object.create(Project.prototype);
    project.onNewFileUUID = 'project-file';
    const configCallbacks = ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover'];
    project.configFile = {};
    for (const name of configCallbacks) {
        project[`on${name}UUID`] = `config-${name}`;
        project.configFile[`removeOn${name}`] = id => released.push(`${name}:${id}`);
    }
    let firstFails = true;
    project.builds = [
        { destroy() {
            released.push('first-build');
            if (firstFails) throw new Error('first build cleanup failed');
        } },
        { destroy() { released.push('second-build'); } },
    ];
    project.statics = [{ destroy() { released.push('static'); } }];

    assert.doesNotThrow(() => project.destroy());
    assert.equal(messages.length, 1);
    assert.match(messages[0], /first build cleanup failed/);
    assert.deepEqual(released.slice(0, 7), [
        'file:project-file', ...configCallbacks.map(name => `${name}:config-${name}`),
    ]);
    assert.deepEqual(released.slice(7), ['first-build', 'second-build', 'static']);
    assert.equal(project.builds.length, 1);
    assert.equal(project.statics.length, 0);

    firstFails = false;
    project.destroy();
    assert.equal(released.filter(event => event === 'second-build').length, 1);
    assert.equal(released.filter(event => event === 'static').length, 1);
    assert.equal(released.filter(event => event === 'first-build').length, 2);
    assert.equal(released.filter(event => event === 'file:project-file').length, 1);
    assert.deepEqual(project.builds, []);
    assert.deepEqual(project.statics, []);
    assert.equal(project.destroyed, true);
    assert.equal(messages.length, 1);
});

test('project destruction reports every child cleanup failure in one message', t => {
    const oldShowErrorMessage = GenericServer.showErrorMessage;
    const messages = [];
    GenericServer.showErrorMessage = message => messages.push(message);
    t.after(() => { GenericServer.showErrorMessage = oldShowErrorMessage; });
    const project = Object.create(Project.prototype);
    const buildError = new Error('build cleanup failed');
    const staticError = new Error('static cleanup failed');
    project.destroyed = true;
    project.builds = [{ destroy() { throw buildError; } }];
    project.statics = [{ destroy() { throw staticError; } }];

    assert.doesNotThrow(() => project.destroy());
    assert.equal(messages.length, 1);
    assert.match(messages[0], /Build: Error: build cleanup failed/);
    assert.match(messages[0], /Static: Error: static cleanup failed/);
    assert.equal(project.builds.length, 1);
    assert.equal(project.statics.length, 1);
});
