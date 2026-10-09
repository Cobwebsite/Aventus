import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { GenericServer } = await loadServerModule('GenericServer.ts');

function initialize(params) {
    const server = Object.create(GenericServer.prototype);
    server.workspaces = [];
    GenericServer.instance = server;
    Object.defineProperty(server, 'logLevel', { value: 99 });
    server.onInitialize(params);
    return server;
}

test('missing save path falls back to Aventus application data and preserves workspace order', t => {
    const appData = mkdtempSync(join(process.cwd(), 'aventus-appdata-'));
    const previousAppData = process.env.APPDATA;
    const previousServer = GenericServer.instance;
    t.after(() => {
        if (previousAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = previousAppData;
        GenericServer.instance = previousServer;
        rmSync(appData, { recursive: true, force: true });
    });
    process.env.APPDATA = appData;
    const params = {
        workspaceFolders: [{ uri: 'file:///first' }, { uri: 'file:///second' }],
        extensionPath: 'D:/extension', isIDE: false,
    };
    const server = initialize(params);
    assert.equal(GenericServer.savePath, join(appData, 'aventus'));
    assert.equal(params.savePath, GenericServer.savePath);
    assert.deepEqual(server.workspaces, ['file:///first', 'file:///second']);
});

test('existing VS Code storage takes precedence over Aventus fallback path', t => {
    const appData = mkdtempSync(join(process.cwd(), 'aventus-appdata-'));
    const previousAppData = process.env.APPDATA;
    const previousServer = GenericServer.instance;
    t.after(() => {
        if (previousAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = previousAppData;
        GenericServer.instance = previousServer;
        rmSync(appData, { recursive: true, force: true });
    });
    process.env.APPDATA = appData;
    const vscode = join(appData, 'Code', 'User', 'globalStorage', 'cobwebsite.aventus');
    mkdirSync(vscode, { recursive: true });
    initialize({ workspaceFolders: null, extensionPath: 'D:/extension', isIDE: false });
    assert.equal(GenericServer.savePath, vscode);
});
