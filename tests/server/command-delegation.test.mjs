import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [inputModule, selectModule, multipleModule, popupModule,
    receiveInputModule, receiveSelectModule, receiveMultipleModule, popupResponseModule,
    httpModule, startModule, stopModule, toggleModule, serverModule, reloadModule] =
    await loadServerModules([
        'notification/AskInput.ts', 'notification/AskSelect.ts',
        'notification/AskSelectMultiple.ts', 'notification/Popup.ts',
        'cmds/ReceiveInput.ts', 'cmds/ReceiveSelect.ts',
        'cmds/ReceiveSelectMultiple.ts', 'cmds/PopupResponse.ts',
        'live-server/HttpServer.ts', 'cmds/live-server/StartServer.ts',
        'cmds/live-server/StopServer.ts', 'cmds/live-server/ToggleServer.ts',
        'GenericServer.ts', 'cmds/ReloadSettings.ts',
    ]);

test('response commands forward identifiers and answers to the matching notification', () => {
    const pairs = [
        [inputModule.AskInput, receiveInputModule.ReceiveInput, 'text'],
        [selectModule.AskSelect, receiveSelectModule.ReceiveSelect, { label: 'first' }],
        [multipleModule.AskSelectMultiple, receiveMultipleModule.ReceiveSelectMultiple, [{ label: 'first' }]],
        [popupModule.Popup, popupResponseModule.PopupResponse, null],
    ];
    for (const [notification, command, response] of pairs) {
        const original = notification.resolve;
        const calls = [];
        notification.resolve = (...args) => calls.push(args);
        try {
            command.run('request-1', response);
            assert.deepEqual(calls, [['request-1', response]]);
        } finally {
            notification.resolve = original;
        }
    }
});

test('live server commands delegate start, stop and toggle to the active server', () => {
    const { HttpServer } = httpModule;
    const original = HttpServer.getInstance;
    const calls = [];
    HttpServer.getInstance = () => ({
        start: () => calls.push('start'),
        stop: () => calls.push('stop'),
        toggle: () => calls.push('toggle'),
    });
    try {
        startModule.StartServer.run();
        stopModule.StopServer.run();
        toggleModule.ToggleServer.run();
        assert.deepEqual(calls, ['start', 'stop', 'toggle']);
    } finally {
        HttpServer.getInstance = original;
    }
});

test('reload settings command requests a refresh', async () => {
    const { GenericServer } = serverModule;
    const original = GenericServer.refreshSettings;
    let calls = 0;
    GenericServer.refreshSettings = () => { calls++; };
    try {
        await reloadModule.ReloadSettings.run();
        assert.equal(calls, 1);
    } finally {
        GenericServer.refreshSettings = original;
    }
});
