import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { FilesManager }] = await loadServerModules([
    'project/Project.ts', 'files/FilesManager.ts',
]);

test('a failed child build cleanup leaves project destruction terminal and remaining resources live', t => {
    const oldFiles = FilesManager.instance;
    const released = [];
    FilesManager.instance = { removeOnNewFile: id => released.push(`file:${id}`) };
    t.after(() => { FilesManager.instance = oldFiles; });

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

    assert.throws(() => project.destroy(), /first build cleanup failed/);
    assert.deepEqual(released.slice(0, 7), [
        'file:project-file', ...configCallbacks.map(name => `${name}:config-${name}`),
    ]);
    assert.equal(released.at(-1), 'first-build');
    assert.equal(released.includes('second-build'), false);
    assert.equal(released.includes('static'), false);

    firstFails = false;
    project.destroy();
    assert.equal(released.filter(event => event === 'second-build').length, 0);
    assert.equal(released.filter(event => event === 'static').length, 0);
    assert.equal(released.filter(event => event === 'first-build').length, 1);
    assert.equal(released.filter(event => event === 'file:project-file').length, 1);
    assert.equal(project.destroyed, true);
});
