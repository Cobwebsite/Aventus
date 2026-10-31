import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { InternalAventusFile } = await loadServerModule('files/AventusFile.ts');
const uri = 'file:///round82-memory.wcl.avt';
const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

async function until(predicate) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    assert.fail('callback did not start');
}

test('save subscribers run in registration order and save waits for each asynchronous callback', async () => {
    const file = new InternalAventusFile(document(1, 'original'));
    const gate = deferred();
    const events = [];
    const removed = file.onSave(async () => events.push('removed'));
    file.removeOnSave(removed);
    file.onSave(async current => {
        events.push(`first:${current.versionUser}:${current.contentUser}`);
        await gate.promise;
        events.push('first:done');
    });
    file.onSave(async current => events.push(`second:${current.versionUser}:${current.contentUser}`));
    try {
        const saving = file.triggerSave();
        await until(() => events.length > 0);
        assert.deepEqual(events, ['first:1:original']);
        gate.resolve();
        await saving;
        assert.deepEqual(events, ['first:1:original', 'first:done', 'second:1:original']);
    } finally {
        gate.resolve();
    }
});

test('removed content, guard and delete subscribers remain silent across change and deletion', async () => {
    const file = new InternalAventusFile(document(1, 'original'));
    const events = [];
    const removedGuard = file.onCanContentChange(() => { events.push('removed-guard'); return false; });
    const removedChange = file.onContentChange(async () => events.push('removed-change'));
    const removedDelete = file.onDelete(async () => events.push('removed-delete'));
    file.removeOnCanContentChange(removedGuard);
    file.removeOnContentChange(removedChange);
    file.removeOnDelete(removedDelete);
    file.onCanContentChange(doc => { events.push(`guard:${doc.version}`); return true; });
    file.onContentChange(async current => events.push(`change:${current.versionUser}:${current.contentUser}`));
    file.onDelete(async current => events.push(`delete:${current.versionUser}:${current.contentUser}`));
    try {
        await file.triggerContentChange(document(2, 'edited'));
        await file.triggerDelete();
        await file.triggerContentChange(document(3, 'late'));
        assert.equal(file.contentUser, 'edited');
        assert.deepEqual(events, ['guard:2', 'change:2:edited', 'delete:2:edited']);
    } finally {
        clearTimeout(file.delayValidate);
    }
});
