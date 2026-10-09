import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { AskInput }, { AskSelect }, { AskSelectMultiple }] = await loadServerModules([
    'GenericServer.ts', 'notification/AskInput.ts', 'notification/AskSelect.ts', 'notification/AskSelectMultiple.ts',
]);

test('simultaneous input requests resolve independently even when replies arrive out of order', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const first = AskInput.send({ title: 'First' });
        const second = AskInput.send({ title: 'Second' });
        const firstId = sent[0][1][0];
        const secondId = sent[1][1][0];
        assert.notEqual(firstId, secondId);
        AskInput.resolve('unknown-request', 'ignored');
        AskInput.resolve(secondId, 'B');
        AskInput.resolve(firstId, 'A');
        assert.deepEqual(await Promise.all([first, second]), ['A', 'B']);
        assert.equal(AskInput.waitingResponse[firstId], undefined);
        assert.equal(AskInput.waitingResponse[secondId], undefined);
    } finally {
        GenericServer.instance = previous;
    }
});

test('selection response preserves option identity and cleans up its request state', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const first = { label: 'first', detail: 'original' };
        const second = { label: 'second', detail: 'other' };
        const choice = AskSelect.send([first, second]);
        const id = sent.at(-1)[1][0];
        AskSelect.resolve(id, { label: 'second' });
        assert.equal(await choice, second);
        assert.equal(AskSelect.waitingResponse[id], undefined);
        assert.equal(AskSelect.waitingOptions[id], undefined);

        const multiple = AskSelectMultiple.send([first, second]);
        const multiId = sent.at(-1)[1][0];
        AskSelectMultiple.resolve(multiId, [first, second]);
        assert.deepEqual(await multiple, [first, second]);
        assert.equal(AskSelectMultiple.waitingResponse[multiId], undefined);
    } finally {
        GenericServer.instance = previous;
    }
});
