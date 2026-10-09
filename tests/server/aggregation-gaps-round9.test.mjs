import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { InternalAventusFile }] = await loadServerModules([
    'project/ProjectManager.ts', 'files/AventusFile.ts',
]);

test('static output listing returns names from every project, including projects without builds', () => {
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
        { name: 'A@assets', uri: 'file:///a/aventus.conf.avt' },
        { name: 'B@assets', uri: 'file:///b/aventus.conf.avt' },
    ]);
});

test('file completion resolve waits for subscribers and returns their result', async () => {
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
        let finished = false;
        const resolution = file.getCompletionResolve(item).then(result => { finished = true; return result; });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(finished, false);
        assert.deepEqual(calls, [[file, item]]);
        finish();
        const result = await resolution;
        assert.deepEqual(result, { ...item, detail: 'resolved' });
        file.removeOnCompletionResolve(subscription);
        calls.length = 0;
        assert.equal(await file.getCompletionResolve(item), item);
        assert.deepEqual(calls, []);
    } finally {
        finish();
        file.removeOnCompletionResolve(subscription);
    }
});

test('file completion resolve passes each result to the next subscriber', async () => {
    const file = new InternalAventusFile(TextDocument.create('file:///chain.wcl.avt', 'typescript', 1, 'x'));
    file.onCompletionResolve(async (_, item) => ({ ...item, detail: 'first' }));
    file.onCompletionResolve(async (_, item) => ({ ...item, documentation: `${item.detail} docs` }));
    assert.deepEqual(await file.getCompletionResolve({ label: 'method' }), {
        label: 'method', detail: 'first', documentation: 'first docs',
    });
});
