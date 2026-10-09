import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Commands } = await loadServerModule('cmds/index.ts');
const { Communication } = await loadServerModule('communication/index.ts');

test('command registry maps each command to an executable handler', () => {
    const entries = Object.entries(Commands.allCommandes);
    assert.ok(entries.length > 40);
    assert.ok(entries.every(([command, handler]) => command === handler.cmd && typeof handler.run === 'function'));
    assert.ok(Commands.allCommandes['aventus.receiveinput']);
});

test('command dispatcher forwards arguments and ignores an unknown command', async () => {
    const calls = [];
    Commands.allCommandes['test.dispatch'] = { run: async (...args) => calls.push(args) };
    try {
        await Commands.execute({ command: 'test.dispatch', arguments: ['a', 2] });
        await Commands.execute({ command: 'test.dispatch' });
        await Commands.execute({ command: 'test.unknown', arguments: [1] });
        assert.deepEqual(calls, [['a', 2], []]);
    } finally {
        delete Commands.allCommandes['test.dispatch'];
    }
});

test('communication dispatcher registers channels and forwards object or array arguments', async () => {
    Communication.init();
    assert.ok(Communication.allCommunications['aventus.i18n.getLocales']);
    assert.ok(Communication.allCommunications['aventus.i18n.getKeyFromPosition']);

    const calls = [];
    Communication.allCommunications['test.dispatch'] = { run: (...args) => calls.push(args) };
    try {
        Communication.execute('test.dispatch', { key: 'value' });
        Communication.execute('test.dispatch', ['a', 2]);
        Communication.execute('test.dispatch', undefined);
        assert.deepEqual(calls, [[{ key: 'value' }], ['a', 2], []]);
        assert.equal(Communication.execute('test.unknown', {}), undefined);
    } finally {
        delete Communication.allCommunications['test.dispatch'];
    }
});
