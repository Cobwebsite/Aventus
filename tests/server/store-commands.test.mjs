import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, storeModule, serverModule] = await loadServerModules([
    'cmds/index.ts', 'store/Store.ts', 'GenericServer.ts',
]);
const { Commands } = commandsModule;
const { Store } = storeModule;
const { GenericServer } = serverModule;

test('store commands prompt for credentials, connect and disconnect', async () => {
    const previousSettings = Store._settings;
    const previousConnect = Store.connect;
    const previousDisconnect = Store.disconnect;
    const previousServer = GenericServer.instance;
    const previousLog = console.log;
    const prompts = [];
    const messages = [];
    const connected = [];
    const logged = [];
    const answers = ['dev', 'secret'];
    Store._settings = { token: '', username: undefined };
    Store.connect = async (...args) => { connected.push(args); Store._settings = { token: 'token', username: args[0] }; return true; };
    Store.disconnect = async () => { Store._settings = { token: '', username: undefined }; };
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async options => { prompts.push(options); return answers.shift(); },
            showInformationMessage: message => messages.push(message),
            showErrorMessage: message => messages.push(message),
        },
    };
    console.log = value => { logged.push(value); };
    try {
        await Commands.allCommandes['aventus.store.connect'].run();
        assert.deepEqual(connected, [['dev', 'secret']]);
        assert.deepEqual(logged, ['dev', 'secret']);
        assert.deepEqual(prompts.map(item => item.title), ['Username', 'Password']);
        assert.equal(prompts[1].password, true);
        assert.equal(messages[0], 'Connection successful');
        await Commands.allCommandes['aventus.store.disconnect'].run();
        assert.equal(messages[1], 'You are disconnected');
        assert.equal(Store.isConnected, false);
    } finally {
        console.log = previousLog;
        Store._settings = previousSettings;
        Store.connect = previousConnect;
        Store.disconnect = previousDisconnect;
        GenericServer.instance = previousServer;
    }
});

test('store connect skips prompts for an existing connection or canceled username', async () => {
    const previousSettings = Store._settings;
    const previousServer = GenericServer.instance;
    const messages = [];
    let prompts = 0;
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async () => { prompts++; return null; },
            showInformationMessage: message => messages.push(message),
        },
    };
    try {
        Store._settings = { token: 'token', username: 'dev' };
        await Commands.allCommandes['aventus.store.connect'].run();
        assert.equal(prompts, 0);
        assert.match(messages[0], /already connected/);
        Store._settings = { token: '', username: undefined };
        await Commands.allCommandes['aventus.store.connect'].run();
        assert.equal(prompts, 1);
    } finally {
        Store._settings = previousSettings;
        GenericServer.instance = previousServer;
    }
});
