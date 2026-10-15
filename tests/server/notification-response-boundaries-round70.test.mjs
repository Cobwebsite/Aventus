import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, serverModule, inputModule, selectModule, multiModule, popupModule] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts', 'notification/AskInput.ts',
    'notification/AskSelect.ts', 'notification/AskSelectMultiple.ts', 'notification/Popup.ts',
]);
const commands = commandsModule.Commands.allCommandes;
const { GenericServer } = serverModule;
const { AskInput } = inputModule;
const { AskSelect } = selectModule;
const { AskSelectMultiple } = multiModule;
const { Popup } = popupModule;

test('interleaved replies and cancellations across all four prompt kinds preserve request ownership', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const option = { label: 'Chosen', detail: 'source object' };
        const requests = [
            { promise: AskInput.send({ title: 'Name' }), command: 'aventus.receiveinput', owner: AskInput, answer: 'Alice' },
            { promise: AskSelect.send([option], { title: 'One' }), command: 'aventus.receiveselect', owner: AskSelect, answer: { label: 'Chosen' } },
            { promise: AskSelectMultiple.send([option], { title: 'Many' }), command: 'aventus.receiveselectmultiple', owner: AskSelectMultiple, answer: [option] },
            { promise: Popup.send('Continue?', 'Yes', 'No'), command: 'aventus.popupresponse', owner: Popup, answer: 'Yes' },
        ];
        requests.forEach((request, index) => { request.id = sent[index][1][0]; });
        assert.equal(new Set(requests.map(request => request.id)).size, requests.length);

        for (const index of [3, 1, 2, 0]) {
            const request = requests[index];
            commands[request.command].run(request.id, index % 2 ? request.answer : null);
        }
        const results = await Promise.all(requests.map(request => request.promise));
        assert.equal(results[0], null);
        assert.equal(results[1], option);
        assert.equal(results[2], null);
        assert.equal(results[3], 'Yes');
        for (const request of requests) {
            assert.equal(request.owner.waitingResponse[request.id], undefined);
            commands[request.command].run(request.id, request.answer);
            assert.equal(request.owner.waitingResponse[request.id], undefined);
        }
        assert.equal(AskSelect.waitingOptions[requests[1].id], undefined);
    } finally {
        GenericServer.instance = previous;
    }
});

test('selection replies outside the offered options are cancelled', async () => {
    const previous = GenericServer.instance;
    const sent = [];
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        const offered = [{ label: 'Allowed' }];
        const foreign = { label: 'Not offered', detail: 'client supplied' };
        const single = AskSelect.send(offered);
        const singleId = sent.at(-1)[1][0];
        commands['aventus.receiveselect'].run(singleId, foreign);
        assert.equal(await single, null);
        assert.equal(AskSelect.waitingOptions[singleId], undefined);

        const multiple = AskSelectMultiple.send(offered);
        const multiId = sent.at(-1)[1][0];
        commands['aventus.receiveselectmultiple'].run(multiId, [offered[0], foreign]);
        assert.equal(await multiple, null);
        assert.equal(AskSelectMultiple.waitingResponse[multiId], undefined);

        const validMultiple = AskSelectMultiple.send(offered);
        const validId = sent.at(-1)[1][0];
        const transmittedOption = sent.at(-1)[1][1][0];
        commands['aventus.receiveselectmultiple'].run(validId, [{ ...transmittedOption, label: 'Changed by client' }]);
        assert.deepEqual(await validMultiple, offered);
    } finally {
        GenericServer.instance = previous;
    }
});

test('failed notification dispatch leaves a pending request for every prompt kind', async () => {
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: { sendNotification: () => { throw new Error('transport closed'); } } };
    const kinds = [
        { send: () => AskInput.send({ title: 'Name' }), owner: AskInput },
        { send: () => AskSelect.send([{ label: 'A' }]), owner: AskSelect },
        { send: () => AskSelectMultiple.send([{ label: 'A' }]), owner: AskSelectMultiple },
        { send: () => Popup.send('Continue?', 'Yes'), owner: Popup },
    ];
    try {
        for (const kind of kinds) {
            const before = new Set(Object.keys(kind.owner.waitingResponse));
            const failure = kind.send();
            await assert.rejects(failure, /transport closed/);
            const leaked = Object.keys(kind.owner.waitingResponse).filter(id => !before.has(id));
            assert.equal(leaked.length, 1);
            // The failed send cannot receive a reply; remove test-owned state explicitly.
            for (const id of leaked) {
                delete kind.owner.waitingResponse[id];
                if (kind.owner === AskSelect) delete AskSelect.waitingOptions[id];
            }
        }
    } finally {
        GenericServer.instance = previous;
    }
});
