import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { EditFile }, { SetSettings }] = await loadServerModules([
    'GenericServer.ts', 'notification/EditFile.ts', 'notification/SetSettings.ts',
]);

test('edit-file notification preserves grouped transformations and their order', () => {
    const sent = [];
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    const uri = 'file:///d%3A/app/card.wcl.avt';
    const first = { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }, newText: 'A' };
    const second = { range: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } }, newText: 'B' };
    try {
        EditFile.send(uri, [[first], [second]]);
        assert.deepEqual(sent, [['aventus/editFile', [{ uri, transformations: [[first], [second]] }]]]);
    } finally {
        GenericServer.instance = previous;
    }
});

test('settings notification sends values and scope without leaving a pending promise', () => {
    const sent = [];
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const result = SetSettings.send({ logLevel: 2 }, true);
        assert.deepEqual(sent, [['aventus/setsettings', [{ logLevel: 2 }, true]]]);
        assert.equal(result, undefined);
    } finally {
        GenericServer.instance = previous;
    }
});
