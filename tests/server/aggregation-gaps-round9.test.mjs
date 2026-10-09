import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { InternalAventusFile }] = await loadServerModules([
    'project/ProjectManager.ts', 'files/AventusFile.ts',
]);

test('static output listing currently returns build names instead of static names', () => {
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {
        'file:///a/aventus.conf.avt': {
            getConfigFile: () => ({ uri: 'file:///a/aventus.conf.avt' }),
            getBuildsName: () => ['A@web'],
            getStaticsName: () => ['A@assets'],
        },
        'file:///b/aventus.conf.avt': {
            getConfigFile: () => ({ uri: 'file:///b/aventus.conf.avt' }),
            getBuildsName: () => [],
            getStaticsName: () => ['B@assets'],
        },
    };
    assert.deepEqual(manager.getAllStatics(), [
        { name: 'A@web', uri: 'file:///a/aventus.conf.avt' },
    ]);
});

test('file completion resolve invokes subscribers but currently discards their result', async () => {
    const file = new InternalAventusFile(TextDocument.create('file:///demo.wcl.avt', 'typescript', 1, 'x'));
    const item = { label: 'method', data: { id: 1 } };
    const calls = [];
    let finish;
    const gate = new Promise(resolve => { finish = resolve; });
    const subscription = file.onCompletionResolve(async (current, received) => {
        calls.push([current, received]);
        await gate;
        return { ...received, detail: 'resolved' };
    });
    try {
        const result = await file.getCompletionResolve(item);
        assert.equal(result, item);
        assert.deepEqual(calls, [[file, item]]);
        finish();
        await gate;
        file.removeOnCompletionResolve(subscription);
        calls.length = 0;
        assert.equal(await file.getCompletionResolve(item), item);
        assert.deepEqual(calls, []);
    } finally {
        finish();
        file.removeOnCompletionResolve(subscription);
    }
});
