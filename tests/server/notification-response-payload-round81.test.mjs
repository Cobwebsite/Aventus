import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

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

test('empty input, empty multi-selection and empty popup choice remain successful answers', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const cases = [
            { promise: AskInput.send({ title: 'Optional name' }), command: 'aventus.receiveinput', answer: '', owner: AskInput },
            { promise: AskSelectMultiple.send([{ label: 'A' }]), command: 'aventus.receiveselectmultiple', answer: [], owner: AskSelectMultiple },
            { promise: Popup.send('Continue?', ''), command: 'aventus.popupresponse', answer: '', owner: Popup },
        ];
        for (const [index, entry] of cases.entries()) {
            const id = sent[index][1][0];
            commands[entry.command].run(id, entry.answer);
            assert.deepEqual(await entry.promise, entry.answer);
            assert.equal(entry.owner.waitingResponse[id], undefined);
        }
    } finally {
        GenericServer.instance = previous;
    }
});

test('a response command of the wrong prompt kind does not consume a pending request', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const option = { label: 'Chosen', detail: 'original' };
        const selected = AskSelect.send([option]);
        const id = sent[0][1][0];
        for (const command of ['aventus.receiveinput', 'aventus.receiveselectmultiple', 'aventus.popupresponse']) {
            commands[command].run(id, null);
            assert.equal(typeof AskSelect.waitingResponse[id], 'function');
            assert.equal(AskSelect.waitingOptions[id][0], option);
        }
        commands['aventus.receiveselect'].run(id, { label: option.label });
        assert.equal(await selected, option);
        assert.equal(AskSelect.waitingResponse[id], undefined);
        assert.equal(AskSelect.waitingOptions[id], undefined);
    } finally {
        GenericServer.instance = previous;
    }
});
