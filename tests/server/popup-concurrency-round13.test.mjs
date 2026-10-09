import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { Popup }] = await loadServerModules([
    'GenericServer.ts', 'notification/Popup.ts',
]);

test('concurrent popups correlate out-of-order replies and ignore stale IDs', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const first = Popup.send('Replace file?', 'Replace', 'Cancel');
        const second = Popup.send('Publish package?', 'Publish', 'Cancel');
        const firstId = sent[0][1][0];
        const secondId = sent[1][1][0];
        assert.notEqual(firstId, secondId);
        assert.deepEqual(sent.map(([channel, params]) => [channel, ...params.slice(1)]), [
            ['aventus/popup', 'Replace file?', ['Replace', 'Cancel']],
            ['aventus/popup', 'Publish package?', ['Publish', 'Cancel']],
        ]);

        Popup.resolve('unknown', 'ignored');
        Popup.resolve(secondId, 'Publish');
        Popup.resolve(firstId, null);
        assert.deepEqual(await Promise.all([first, second]), [null, 'Publish']);
        Popup.resolve(firstId, 'late');
        assert.equal(Popup.waitingResponse[firstId], undefined);
        assert.equal(Popup.waitingResponse[secondId], undefined);
    } finally {
        GenericServer.instance = previous;
    }
});
