import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const { Open } = require('unzipper');

const [storeModule, serverModule, dependenciesModule] = await loadServerModules([
    'store/Store.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);
const { Store, QueryError } = storeModule;
const { GenericServer } = serverModule;
const { DependencyManager } = dependenciesModule;

test('store tracks connection state and merges saved credentials', () => {
    const previousSettings = Store._settings;
    const previousServer = GenericServer.instance;
    const writes = [];
    Store._settings = { token: '', username: undefined };
    GenericServer.instance = { connection: {}, logLevel: 4 };
    const originalSetSettings = Store.setSettings;
    try {
        assert.equal(Store.isConnected, false);
        Store.setSettings = value => {
            writes.push(value);
            Store._settings = { ...Store._settings, ...value };
        };
        Store.setSettings({ token: 'sample', username: 'dev' });
        assert.equal(Store.isConnected, true);
        assert.deepEqual(writes, [{ token: 'sample', username: 'dev' }]);
    } finally {
        Store.setSettings = originalSetSettings;
        Store._settings = previousSettings;
        GenericServer.instance = previousServer;
    }
});

test('store POST parses a successful result and submits JSON without bearer when requested', async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (...args) => {
        calls.push(args);
        return { status: 200, text: async () => JSON.stringify({ errors: [], result: 'token' }) };
    };
    try {
        assert.equal(await Store.postWithErrors('/login', { username: 'dev' }, { withoutBearer: true }), 'token');
        assert.equal(calls[0][0], 'https://store.aventusjs.com/api/remote/login');
        assert.equal(calls[0][1].headers['Content-Type'], 'application/json');
        assert.equal(calls[0][1].headers.Authorization, undefined);
        assert.equal(calls[0][1].body, '{"username":"dev"}');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('store POST reports authentication, API, malformed and network errors', async () => {
    const originalFetch = globalThis.fetch;
    const originalServer = GenericServer.instance;
    GenericServer.instance = { connection: {}, logLevel: 4 };
    try {
        for (const [response, code] of [
            [{ status: 401, text: async () => '' }, 401],
            [{ status: 200, text: async () => JSON.stringify({ errors: [{ code: 7, message: 'rejected' }] }) }, 7],
            [{ status: 200, text: async () => JSON.stringify({ invalid: true }) }, -500],
        ]) {
            globalThis.fetch = async () => response;
            const result = await Store.postWithErrors('/login', {}, { withoutBearer: true });
            assert.ok(result instanceof QueryError);
            assert.equal(result.errors[0].code, code);
        }
        globalThis.fetch = async () => { throw new Error('offline'); };
        const offline = await Store.postWithErrors('/login', {}, { withoutBearer: true });
        assert.ok(offline instanceof QueryError);
        assert.match(offline.errors[0].message, /offline/);
    } finally {
        globalThis.fetch = originalFetch;
        GenericServer.instance = originalServer;
    }
});

test('store invalidates its session after a forbidden API response', async () => {
    const originalFetch = globalThis.fetch;
    const originalDisconnect = Store.disconnect;
    const originalServer = GenericServer.instance;
    let disconnected = 0;
    globalThis.fetch = async () => ({ status: 403, text: async () => '' });
    Store.disconnect = async () => { disconnected++; };
    GenericServer.instance = { logLevel: 4, connection: {} };
    try {
        const result = await Store.postWithErrors('/package/publish', {}, { withoutBearer: true });
        assert.ok(result instanceof QueryError);
        assert.equal(result.errors[0].code, 403);
        assert.equal(disconnected, 1);
        await Store.postWithErrors('/logout', {}, { withoutBearer: true });
        assert.equal(disconnected, 1);
    } finally {
        globalThis.fetch = originalFetch;
        Store.disconnect = originalDisconnect;
        GenericServer.instance = originalServer;
    }
});

test('store archive contains template files and excludes Git metadata', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-'));
    const source = join(root, 'template');
    mkdirSync(join(source, 'nested'), { recursive: true });
    mkdirSync(join(source, '.git'));
    writeFileSync(join(source, 'template.avt.ts'), 'export class Template {}');
    writeFileSync(join(source, 'nested', 'view.html'), '<p>hello</p>');
    writeFileSync(join(source, '.git', 'config'), 'private metadata');
    try {
        const archive = join(root, 'template.zip');
        await Store.zip(source, archive);
        const directory = await Open.file(archive);
        const names = directory.files.map(file => file.path);
        assert.ok(names.includes('template.avt.ts'));
        assert.ok(names.includes('nested/view.html'));
        assert.ok(names.every(name => !name.startsWith('.git')));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('store publication submits template metadata, README and archive then cleans the archive', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-publish-'));
    const templateFolder = join(root, 'template');
    mkdirSync(templateFolder);
    mkdirSync(join(root, 'temp'));
    const config = join(templateFolder, 'template.avt.ts');
    writeFileSync(config, 'export class Template {}');
    writeFileSync(join(templateFolder, 'README.md'), 'How to use it');
    const previousServer = GenericServer.instance;
    const oldPost = Store.postWithErrors;
    GenericServer.instance = { _savePath: root };
    let submitted;
    Store.postWithErrors = async (uri, form) => { submitted = [uri, form]; return true; };
    try {
        const template = {
            config, folderPath: templateFolder, name: 'Starter', description: 'Demo',
            version: '1.0.0', isProject: true, isGlobal: false, tags: ['basic'],
        };
        assert.equal(await Store.publishTemplate(template), true);
        assert.equal(submitted[0], '/template/publish');
        const form = submitted[1];
        assert.equal(form.get('name'), 'Starter');
        assert.equal(form.get('is_project'), '1');
        assert.equal(form.get('is_global'), '0');
        assert.equal(form.get('tags[]'), 'basic');
        assert.equal(form.get('readMe').name, 'README.md');
        assert.equal(form.get('templateFile').name, 'Starter.zip');
        assert.equal(existsSync(join(root, 'temp', 'Starter.zip')), false);
    } finally {
        Store.postWithErrors = oldPost;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('store package publication requires a built package and submits optional README', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-package-'));
    const output = join(root, 'output');
    const local = join(output, '@locals');
    mkdirSync(local, { recursive: true });
    const oldDependencies = DependencyManager.getInstance;
    const oldPost = Store.postWithErrors;
    DependencyManager.getInstance = () => ({ getPath: () => output });
    let submitted;
    Store.postWithErrors = async (uri, form) => { submitted = [uri, form]; return true; };
    const build = {
        buildConfig: { fullname: 'Demo', description: 'Demo package', version: '1.2.0', tags: ['ui'] },
        project: { getConfigFile: () => ({ folderPath: root }) },
    };
    try {
        assert.equal(await Store.publishPackage(build), false);
        assert.equal(submitted, undefined);
        writeFileSync(join(local, 'Demo.package.avt'), 'export namespace Demo {}');
        writeFileSync(join(root, 'README.md'), '# Demo');
        assert.equal(await Store.publishPackage(build), true);
        assert.equal(submitted[0], '/package/publish');
        assert.equal(submitted[1].get('name'), 'Demo');
        assert.equal(submitted[1].get('version'), '1.2.0');
        assert.equal(submitted[1].get('tags[]'), 'ui');
        assert.equal(submitted[1].get('packageFile').name, 'Demo.package.avt');
        assert.equal(submitted[1].get('readMe').name, 'README.md');
        submitted = undefined;
        build.buildConfig.readme = 'missing.md';
        const missing = await Store.publishPackage(build);
        assert.ok(missing instanceof QueryError);
        assert.equal(missing.errors[0].message, 'Readme not found');
        assert.equal(submitted, undefined);
    } finally {
        DependencyManager.getInstance = oldDependencies;
        Store.postWithErrors = oldPost;
        rmSync(root, { recursive: true, force: true });
    }
});

test('store package publication currently rejects a configured README present in the project', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-configured-readme-'));
    const output = join(root, 'output');
    const local = join(output, '@locals');
    mkdirSync(local, { recursive: true });
    writeFileSync(join(local, 'Demo.package.avt'), 'export namespace Demo {}');
    const readmeName = 'CUSTOM-README.test.md';
    writeFileSync(join(root, readmeName), '# Demo');
    const oldDependencies = DependencyManager.getInstance;
    const oldPost = Store.postWithErrors;
    let submissions = 0;
    DependencyManager.getInstance = () => ({ getPath: () => output });
    Store.postWithErrors = async () => { submissions++; return true; };
    try {
        const build = {
            buildConfig: { fullname: 'Demo', version: '1.0.0', tags: [], readme: readmeName },
            project: { getConfigFile: () => ({ folderPath: root }) },
        };
        for (const configuredPath of [readmeName, `./${readmeName}`]) {
            build.buildConfig.readme = configuredPath;
            await assert.rejects(Store.publishPackage(build), { code: 'ENOENT' });
        }
        assert.equal(submissions, 0);
    } finally {
        DependencyManager.getInstance = oldDependencies;
        Store.postWithErrors = oldPost;
        rmSync(root, { recursive: true, force: true });
    }
});

test('store connects with returned token and clears credentials on disconnect', async () => {
    const originalPost = Store.post;
    const originalSettings = Store.setSettings;
    const writes = [];
    const requests = [];
    Store.post = async (uri, body) => {
        requests.push([uri, body]);
        return uri === '/login' ? 'token-123' : true;
    };
    Store.setSettings = value => writes.push(value);
    try {
        assert.equal(await Store.connect('dev', 'secret'), true);
        assert.equal(requests[0][0], '/login');
        assert.equal(requests[0][1].username, 'dev');
        assert.equal(requests[0][1].password, 'secret');
        assert.equal(typeof requests[0][1].machineId, 'string');
        assert.deepEqual(writes[0], { token: 'token-123', username: 'dev' });
        await Store.disconnect();
        assert.equal(requests[1][0], '/logout');
        assert.deepEqual(writes[1], { token: '', username: undefined });
    } finally {
        Store.post = originalPost;
        Store.setSettings = originalSettings;
    }
});
