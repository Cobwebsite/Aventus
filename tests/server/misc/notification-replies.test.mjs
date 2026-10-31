import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [commandsModule, serverModule, inputModule, selectModule, multipleModule, popupModule] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts', 'notification/AskInput.ts',
    'notification/AskSelect.ts', 'notification/AskSelectMultiple.ts', 'notification/Popup.ts',
]);
const commands = commandsModule.Commands.allCommandes;
const { GenericServer } = serverModule;
const { AskInput } = inputModule;
const { AskSelect } = selectModule;
const { AskSelectMultiple } = multipleModule;
const { Popup } = popupModule;

function withNotifications(run) {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    return Promise.resolve().then(() => run(sent)).finally(() => { GenericServer.instance = previous; });
}

test('stale command replies do not consume the next request with the same prompt and choices', async () => {
    await withNotifications(async sent => {
        const kinds = [
            { start: () => AskInput.send({ title: 'Name' }), command: 'aventus.receiveinput', answer: 'Alice', pending: AskInput },
            { start: () => AskSelect.send([{ label: 'Same' }], { title: 'Choose' }), command: 'aventus.receiveselect', answer: { label: 'Same' }, pending: AskSelect },
            { start: () => AskSelectMultiple.send([{ label: 'Same' }], { title: 'Choose' }), command: 'aventus.receiveselectmultiple', answer: [{ label: 'Same' }], pending: AskSelectMultiple },
            { start: () => Popup.send('Continue?', 'Yes'), command: 'aventus.popupresponse', answer: 'Yes', pending: Popup },
        ];
        for (const kind of kinds) {
            const first = kind.start();
            const firstId = sent.at(-1)[1][0];
            commands[kind.command].run(firstId, null);
            assert.equal(await first, null);

            const second = kind.start();
            const secondId = sent.at(-1)[1][0];
            const originalSelection = kind.command === 'aventus.receiveselect' ? AskSelect.waitingOptions[secondId][0] : null;
            assert.notEqual(secondId, firstId);
            commands[kind.command].run(firstId, kind.answer);
            assert.equal(kind.pending.waitingResponse[firstId], undefined);
            assert.equal(typeof kind.pending.waitingResponse[secondId], 'function');
            commands[kind.command].run(secondId, kind.answer);
            const resolved = await second;
            if (kind.command === 'aventus.receiveselect') {
                assert.equal(resolved, originalSelection);
            } else {
                assert.deepEqual(resolved, kind.answer);
            }
            assert.equal(kind.pending.waitingResponse[secondId], undefined);
        }
    });
});

test('same-label selections correlate by request and option IDs', async () => {
    await withNotifications(async sent => {
        const firstOptions = [{ label: 'Shared', detail: 'first A' }, { label: 'Shared', detail: 'first B' }];
        const secondOptions = [{ label: 'Shared', detail: 'second A' }, { label: 'Shared', detail: 'second B' }];
        const first = AskSelect.send(firstOptions, { title: 'Same title' });
        const firstId = sent.at(-1)[1][0];
        const firstOffered = sent.at(-1)[1][1];
        const second = AskSelect.send(secondOptions, { title: 'Same title' });
        const secondId = sent.at(-1)[1][0];
        const secondOffered = sent.at(-1)[1][1];
        assert.notEqual(firstId, secondId);

        commands['aventus.receiveselect'].run(secondId, secondOffered[0]);
        commands['aventus.receiveselect'].run(firstId, firstOffered[0]);
        assert.equal(await first, firstOptions[0]);
        assert.equal(await second, secondOptions[0]);
        assert.equal(AskSelect.waitingOptions[firstId], undefined);
        assert.equal(AskSelect.waitingOptions[secondId], undefined);
    });
});

test('multiple selection maps same-label objects by detail to offered options', async () => {
    await withNotifications(async sent => {
        const options = [{ label: 'Shared', detail: 'A' }, { label: 'Shared', detail: 'B' }];
        const selected = [{ label: 'Shared', detail: 'B' }, { label: 'Shared', detail: 'A' }];
        const request = AskSelectMultiple.send(options, { title: 'Choose duplicates' });
        const id = sent.at(-1)[1][0];
        commands['aventus.receiveselectmultiple'].run(id, selected);
        assert.deepEqual(await request, [options[1], options[0]]);
        assert.equal(AskSelectMultiple.waitingResponse[id], undefined);
    });
});
