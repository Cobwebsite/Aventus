import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { loadServerModule, loadServerModules } from '../helpers/load-ts.mjs';

const { GenericServer } = await loadServerModule('GenericServer.ts');

function initialize(params) {
    const previous = GenericServer.instance;
    const server = Object.create(GenericServer.prototype);
    server.workspaces = [];
    server.runUpdate = () => { throw Error('CLI initialization must not check for updates'); };
    Object.defineProperty(server, 'logLevel', { value: 99 });
    GenericServer.instance = server;
    try {
        server.onInitialize(params);
        return server;
    } finally {
        GenericServer.instance = previous;
    }
}

test('CLI initialization derives the bundled extension root and skips the IDE update check', () => {
    const params = { workspaceFolders: [], savePath: 'D:/data', isIDE: false };
    const server = initialize(params);
    assert.equal(params.extensionPath, resolve('server'));
    assert.equal(server._extensionPath, resolve('server'));
    assert.equal(server.isIDE, false);
    assert.equal(server._noBuild, false);
});

test('explicit CLI extension root and noBuild option are retained without invoking IDE update', () => {
    const params = {
        workspaceFolders: [], savePath: 'D:/data', extensionPath: 'D:/custom extension',
        isIDE: false, noBuild: true,
    };
    const server = initialize(params);
    assert.equal(server._extensionPath, params.extensionPath);
    assert.equal(server._noBuild, true);
});

test('initialization selects existing VS Code global storage when savePath is omitted', () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-environment-'));
    const previousAppData = process.env.APPDATA;
    const storage = join(root, 'Code', 'User', 'globalStorage', 'cobwebsite.aventus');
    try {
        mkdirSync(storage, { recursive: true });
        process.env.APPDATA = root;
        const params = { workspaceFolders: [], isIDE: false };
        const server = initialize(params);
        assert.equal(params.savePath, storage);
        assert.equal(server._savePath, storage);
    } finally {
        if (previousAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = previousAppData;
        rmSync(root, { recursive: true, force: true });
    }
});

test('initialization falls back to Aventus app data when VS Code storage does not exist', () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-environment-'));
    const previousAppData = process.env.APPDATA;
    try {
        process.env.APPDATA = root;
        const params = { workspaceFolders: [], isIDE: false };
        const server = initialize(params);
        assert.equal(params.savePath, join(root, 'aventus'));
        assert.equal(server._savePath, join(root, 'aventus'));
    } finally {
        if (previousAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = previousAppData;
        rmSync(root, { recursive: true, force: true });
    }
});

test('an explicit savePath takes precedence over detected VS Code storage', () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-environment-'));
    const previousAppData = process.env.APPDATA;
    try {
        mkdirSync(join(root, 'Code', 'User', 'globalStorage', 'cobwebsite.aventus'), { recursive: true });
        process.env.APPDATA = root;
        const params = { workspaceFolders: [], savePath: join(root, 'chosen'), isIDE: false };
        const server = initialize(params);
        assert.equal(params.savePath, join(root, 'chosen'));
        assert.equal(server._savePath, join(root, 'chosen'));
    } finally {
        if (previousAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = previousAppData;
        rmSync(root, { recursive: true, force: true });
    }
});

test('TypeScript and Aventus built-in resource paths follow the active extension root', async () => {
    const [serverModule, loader] = await loadServerModules([
        'GenericServer.ts', 'language-services/ts/libLoader.ts',
    ]);
    const sharedServer = serverModule.GenericServer;
    const previous = sharedServer.instance;
    const root = resolve('test extension with spaces');
    sharedServer.instance = { _extensionPath: root };
    try {
        assert.equal(loader.serverFolder(), root);
        const names = [
            ['AVENTUS_DEF_BASE_PATH', 'Aventus@Main.package.avt'],
            ['AVENTUS_DEF_UI_PATH', 'Aventus@UI.package.avt'],
            ['AVENTUS_DEF_I18N_PATH', 'Aventus@I18n.package.avt'],
            ['AVENTUS_DEF_SHARP_PATH', 'Aventus@Sharp.package.avt'],
            ['AVENTUS_DEF_PHP_PATH', 'Aventus@Php.package.avt'],
        ];
        for (const [exportName, fileName] of names) {
            assert.equal(loader[exportName](), join(root, 'lib', fileName), exportName);
        }
        // The loader walks upward to reuse the nearest installed TypeScript dependency.
        assert.equal(loader.NODE_MODULES(), join(resolve('.'), 'node_modules'));
        assert.equal(loader.TYPESCRIPT_LIB_SOURCE(), join(resolve('.'), 'node_modules/typescript/lib'));
    } finally {
        sharedServer.instance = previous;
    }
});
