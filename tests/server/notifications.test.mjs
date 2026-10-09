import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [serverModule, inputModule, selectModule, multiModule, popupModule, progressModule, compiledModule] =
    await loadServerModules([
        'GenericServer.ts',
        'notification/AskInput.ts',
        'notification/AskSelect.ts',
        'notification/AskSelectMultiple.ts',
        'notification/Popup.ts',
        'notification/ProgressStart.ts',
        'notification/Compiled.ts',
    ]);
const { GenericServer } = serverModule;
const { AskInput } = inputModule;
const { AskSelect } = selectModule;
const { AskSelectMultiple } = multiModule;
const { Popup } = popupModule;
const { ProgressStart } = progressModule;
const { Compiled } = compiledModule;

const messages = [];
GenericServer.instance = {
    logLevel: 4,
    connection: { sendNotification: (channel, params) => messages.push({ channel, params }) },
};

function lastMessage() {
    return messages.at(-1);
}

test('input notification correlates response and ignores a late response', async () => {
    const promise = AskInput.send({ title: 'Name' });
    const { channel, params } = lastMessage();
    assert.equal(channel, 'aventus/askinput');
    assert.equal(params[1].title, 'Name');
    AskInput.resolve(params[0], 'Alice');
    assert.equal(await promise, 'Alice');
    AskInput.resolve(params[0], 'late');
    assert.equal(AskInput.waitingResponse[params[0]], undefined);
});

test('selection notification resolves to the original option object', async () => {
    const selected = { label: 'A', detail: 'Original item' };
    const promise = AskSelect.send([selected], { title: 'Pick' });
    const { channel, params } = lastMessage();
    assert.equal(channel, 'aventus/askselect');
    AskSelect.resolve(params[0], { label: 'A' });
    assert.equal(await promise, selected);
    assert.equal(AskSelect.waitingResponse[params[0]], undefined);
});

test('multiple selection and popup support cancellation', async () => {
    const multiple = AskSelectMultiple.send([{ label: 'A' }], { title: 'Pick many' });
    const multiMessage = lastMessage();
    assert.equal(multiMessage.channel, 'aventus/askselectmultiple');
    AskSelectMultiple.resolve(multiMessage.params[0], null);
    assert.equal(await multiple, null);

    const popup = Popup.send('Continue?', 'Yes', 'No');
    const popupMessage = lastMessage();
    assert.equal(popupMessage.channel, 'aventus/popup');
    assert.deepEqual(popupMessage.params.slice(1), ['Continue?', ['Yes', 'No']]);
    Popup.resolve(popupMessage.params[0], null);
    assert.equal(await popup, null);
});

test('progress and compilation notifications expose their channels and arguments', () => {
    const id = ProgressStart.send('Loading');
    assert.equal(lastMessage().channel, 'aventus/progress_start');
    assert.deepEqual(lastMessage().params, [id, 'Loading']);
    Compiled.part('Step one');
    assert.deepEqual(lastMessage(), { channel: 'aventus/compiled/part', params: ['Step one'] });
    Compiled.send('app', []);
    assert.deepEqual(lastMessage(), { channel: 'aventus/compiled', params: ['app', []] });
});
