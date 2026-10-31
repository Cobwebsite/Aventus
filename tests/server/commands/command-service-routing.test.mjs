import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { HttpServer }, { GenericServer }, { Store }, { ProjectManager }, { pathToUri }] =
    await loadServerModules([
        'cmds/index.ts', 'live-server/HttpServer.ts', 'GenericServer.ts',
        'store/Store.ts', 'project/ProjectManager.ts', 'tools.ts',
    ]);

test('execute routes live-server and settings commands to the matching service', async () => {
    const oldHttp = HttpServer.getInstance;
    const oldRefresh = GenericServer.refreshSettings;
    const calls = [];
    const gates = {};
    for (const operation of ['start', 'stop', 'toggle']) {
        gates[operation] = {};
        gates[operation].promise = new Promise((resolve, reject) => {
            gates[operation].resolve = resolve;
            gates[operation].reject = reject;
        });
    }
    HttpServer.getInstance = () => ({
        start: async () => { calls.push('start'); await gates.start.promise; calls.push('started'); },
        stop: async () => { calls.push('stop'); await gates.stop.promise; calls.push('stopped'); },
        toggle: async () => { calls.push('toggle'); await gates.toggle.promise; calls.push('toggled'); },
    });
    GenericServer.refreshSettings = () => calls.push('settings');
    try {
        let settled = false;
        const start = Commands.execute({ command: 'aventus.liveserver.start' }).then(() => { settled = true; });
        await Promise.resolve();
        assert.deepEqual(calls, ['start']);
        assert.equal(settled, false);
        gates.start.resolve();
        await start;
        const stop = Commands.execute({ command: 'aventus.liveserver.stop' });
        await Promise.resolve();
        assert.deepEqual(calls, ['start', 'started', 'stop']);
        gates.stop.resolve();
        await stop;
        const toggle = Commands.execute({ command: 'aventus.liveserver.toggle' });
        await Promise.resolve();
        assert.deepEqual(calls, ['start', 'started', 'stop', 'stopped', 'toggle']);
        gates.toggle.resolve();
        await toggle;
        await Commands.execute({ command: 'aventus.reloadSettings' });
        assert.deepEqual(calls, ['start', 'started', 'stop', 'stopped', 'toggle', 'toggled', 'settings']);
    } finally {
        for (const gate of Object.values(gates)) gate.resolve();
        HttpServer.getInstance = oldHttp;
        GenericServer.refreshSettings = oldRefresh;
    }
});

test('execute propagates a live-server operation failure', async () => {
    const oldHttp = HttpServer.getInstance;
    HttpServer.getInstance = () => ({ start: async () => { throw new Error('start failed'); } });
    try {
        await assert.rejects(Commands.execute({ command: 'aventus.liveserver.start' }), /start failed/);
    } finally {
        HttpServer.getInstance = oldHttp;
    }
});

test('execute routes supplied store credentials and disconnect to Store without prompting', async () => {
    const oldSettings = Store._settings;
    const oldConnect = Store.connect;
    const oldDisconnect = Store.disconnect;
    const oldServer = GenericServer.instance;
    const oldLog = console.log;
    const calls = [];
    Store._settings = { token: '', username: '' };
    Store.connect = async (username, password) => { calls.push(['connect', username, password]); Store._settings = { token: 'token', username }; return true; };
    Store.disconnect = async () => { calls.push(['disconnect']); };
    GenericServer.instance = { logLevel: 4, connection: {
        Input: () => { throw new Error('unexpected credential prompt'); },
        showInformationMessage: message => calls.push(['info', message]),
    } };
    console.log = () => {};
    try {
        await Commands.execute({ command: 'aventus.store.connect', arguments: ['alice', 'secret'] });
        await Commands.execute({ command: 'aventus.store.disconnect' });
        assert.deepEqual(calls, [
            ['connect', 'alice', 'secret'], ['info', 'Connection successful'],
            ['disconnect'], ['info', 'You are disconnected'],
        ]);
    } finally {
        Store._settings = oldSettings;
        Store.connect = oldConnect;
        Store.disconnect = oldDisconnect;
        GenericServer.instance = oldServer;
        console.log = oldLog;
    }
});

test('execute passes i18n arguments to the matching build and publishes its file edit', async () => {
    const oldProject = ProjectManager.getInstance;
    const oldServer = GenericServer.instance;
    const oldTimeout = globalThis.setTimeout;
    const viewUri = pathToUri('D:\\demo\\Button.wcv.avt');
    const globalUri = pathToUri('D:\\demo\\messages.i18n.avt');
    const source = { existing: { en: 'Existing' } };
    const documentUser = TextDocument.create(globalUri, 'json', 1, JSON.stringify(source));
    const build = { i18nComponentsFiles: {}, tsLanguageService: { i18nFiles: {
        [globalUri]: { parsedSrc: source, file: { documentUser }, build: {
            buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        } },
    } }, tsFiles: {}, htmlFiles: {} };
    const calls = [];
    ProjectManager.getInstance = () => ({ getMatchingBuildsByUri: uri => {
        calls.push(['builds', uri]); return [build];
    } });
    GenericServer.instance = { logLevel: 4, connection: {
        Select: async items => { calls.push(['select', items]); return items[0]; },
        sendNotification: (...args) => calls.push(['notification', ...args]),
    } };
    globalThis.setTimeout = () => 0;
    try {
        await Commands.execute({ command: 'aventus.i18n.add', arguments: [viewUri, 'hello', false] });
        assert.deepEqual(calls[0], ['builds', viewUri]);
        assert.deepEqual(calls[1][1].map(item => item.label), ['messages.i18n.avt']);
        assert.equal(calls[2][1], 'aventus/editFile');
        const edit = calls[2][2][0];
        assert.equal(edit.uri, globalUri);
        assert.deepEqual(JSON.parse(edit.transformations[0][0].newText), {
            existing: { en: 'Existing' }, hello: { en: 'hello', fr: 'ⵌⵌ' },
        });
    } finally {
        ProjectManager.getInstance = oldProject;
        GenericServer.instance = oldServer;
        globalThis.setTimeout = oldTimeout;
    }
});
