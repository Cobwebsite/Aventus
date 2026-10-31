import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }, { VsCodeConnection }, { Commands }, { AventusLanguageId }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'vscode/Connection.ts', 'cmds/index.ts', 'definition.ts',
]);

function createServer() {
    const handlers = {};
    const connection = new Proxy({}, {
        get(target, key) {
            if (key in target) return target[key];
            if (String(key).startsWith('on')) return callback => { handlers[key] = callback; };
        },
    });
    const server = new GenericServer(connection);
    Object.defineProperty(server, 'logLevel', { value: 99 });
    return { server, handlers };
}

test('initialization accepts a null workspace list and truncates its requested log before startup', () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-init-log-'));
    const logFile = join(root, 'server.log');
    const oldServer = GenericServer.instance;
    try {
        writeFileSync(logFile, 'previous session');
        const { handlers, server } = createServer();
        handlers.onInitialize({ workspaceFolders: null, savePath: root, extensionPath: root,
            logFile, isIDE: false, noBuild: true });
        assert.deepEqual(server.workspaces, []);
        assert.equal(GenericServer.getWorkspaceUri(), '');
        assert.equal(GenericServer.noBuild, true);
        assert.equal(readFileSync(logFile, 'utf8'), '');
    } finally {
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('failed settings load does not start services and a later initialization can retry', async () => {
    const oldServer = GenericServer.instance;
    const oldSettings = SettingsManager.instance;
    const { server, handlers } = createServer();
    const calls = [];
    let getSettingsCount = 0;
    server.checkNodeJs = async () => { calls.push('node'); return true; };
    server.connection.getSettings = async () => {
        calls.push('settings request');
        if (++getSettingsCount === 1) throw new Error('settings temporarily unavailable');
        return undefined;
    };
    server.connection.getSettingsHtml = async () => { calls.push('html request'); return undefined; };
    server.startServer = async () => { calls.push('services'); server.isLoading = false; };
    SettingsManager.instance = {
        initSettings(value) { calls.push(['settings', value]); },
        setSettingsHtml(value) { calls.push(['html', value]); },
    };
    try {
        await assert.rejects(handlers.onInitialized(), /settings temporarily unavailable/);
        assert.equal(server.isLoading, true);
        assert.deepEqual(calls, ['node', 'settings request']);
        await handlers.onInitialized();
        assert.equal(server.isLoading, false);
        assert.deepEqual(calls, ['node', 'settings request', 'node', 'settings request',
            'html request', ['settings', {}], ['html', {}], 'services']);
    } finally {
        GenericServer.instance = oldServer;
        SettingsManager.instance = oldSettings;
    }
});

test('VS Code initialization advertises the exact document options and registered command names', () => {
    const handlers = {};
    const adapter = Object.create(VsCodeConnection.prototype);
    adapter._connection = { onInitialize(callback) { handlers.initialize = callback; } };
    let received;
    adapter.onInitialize(options => { received = options; });
    const result = handlers.initialize({ workspaceFolders: null,
        initializationOptions: { savePath: '/tmp/save', extensionPath: '/tmp/extension' } });
    assert.deepEqual(received, { workspaceFolders: null, savePath: '/tmp/save',
        extensionPath: '/tmp/extension', isIDE: true });
    assert.deepEqual(result.capabilities, {
        textDocumentSync: 2,
        completionProvider: { resolveProvider: true },
        executeCommandProvider: { commands: Object.keys(Commands.allCommandes) },
        hoverProvider: {},
        definitionProvider: {},
        documentFormattingProvider: {},
        codeActionProvider: { codeActionKinds: ['quickfix'], resolveProvider: true },
        referencesProvider: {},
        codeLensProvider: { resolveProvider: true },
        renameProvider: true,
        colorProvider: { documentSelector: [
            { language: AventusLanguageId.SCSS }, { language: AventusLanguageId.WebComponent },
        ] },
    });
    assert.ok(result.capabilities.executeCommandProvider.commands.length > 30);
    assert.equal(new Set(result.capabilities.executeCommandProvider.commands).size,
        result.capabilities.executeCommandProvider.commands.length);
});
