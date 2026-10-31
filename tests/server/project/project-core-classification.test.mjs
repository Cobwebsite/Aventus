import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { FilesManager }] = await loadServerModules([
    'project/Project.ts', 'files/FilesManager.ts',
]);

test('core project classification accepts case variants but rejects neighboring folder suffixes', t => {
    const previousFiles = FilesManager.instance;
    const active = new Set();
    let nextId = 0;
    FilesManager.instance = {
        onNewFile: () => { const id = ++nextId; active.add(id); return id; },
        removeOnNewFile: id => active.delete(id),
    };
    t.after(() => { FilesManager.instance = previousFiles; });

    for (const [folderUri, expected] of [
        ['file:///workspace/Aventus/Base/SRC', true],
        ['file:///workspace/aventus/base/src', true],
        ['file:///workspace/aventus/base/src-extra', false],
        ['file:///workspace/other/src', false],
    ]) {
        const subscriptions = new Set();
        const config = {
            folderUri,
            documentUser: { uri: `${folderUri}/aventus.conf.avt` },
            validate: () => {},
        };
        for (const name of ['Validate', 'Save', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
            config[`on${name}`] = () => {
                const id = ++nextId;
                subscriptions.add(id);
                return id;
            };
            config[`removeOn${name}`] = id => subscriptions.delete(id);
        }
        const project = new Project(config, false);
        assert.equal(project.isCoreBuild, expected, folderUri);
        assert.equal(subscriptions.size, 6, folderUri);
        project.destroy();
        assert.equal(subscriptions.size, 0, folderUri);
        assert.equal(active.size, 0, folderUri);
    }
});
