import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [commandsModule, filesModule, storeModule, serverModule, projectModule, templateModule, toolsModule] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'store/Store.ts', 'GenericServer.ts',
    'project/ProjectManager.ts', 'files/Template.ts', 'tools.ts',
]);
const commands = commandsModule.Commands.allCommandes;
const { FilesManager } = filesModule;
const { Store, QueryError } = storeModule;
const { GenericServer } = serverModule;
const { ProjectManager } = projectModule;
const { TemplateScript } = templateModule;
const { pathToUri } = toolsModule;

test('client file notifications delegate each URI exactly once and ignore empty input', async () => {
    const previous = FilesManager.getInstance;
    const calls = [];
    FilesManager.getInstance = () => ({
        onCreatedUri: uri => calls.push(['created', uri]),
        onUpdatedUri: uri => calls.push(['updated', uri]),
        onDeletedUri: uri => calls.push(['deleted', uri]),
    });
    try {
        await commands['aventus.filesystem.created'].run('file:///a.wcl.avt');
        await commands['aventus.filesystem.updated'].run('file:///a.wcl.avt');
        await commands['aventus.filesystem.deleted'].run('file:///a.wcl.avt');
        for (const cmd of ['created', 'updated', 'deleted']) {
            await commands[`aventus.filesystem.${cmd}`].run('');
        }
        assert.deepEqual(calls, [
            ['created', 'file:///a.wcl.avt'],
            ['updated', 'file:///a.wcl.avt'],
            ['deleted', 'file:///a.wcl.avt'],
        ]);
    } finally {
        FilesManager.getInstance = previous;
    }
});

for (const [command, handler] of [
    ['created', 'onCreatedUri'], ['updated', 'onUpdatedUri'], ['deleted', 'onDeletedUri'],
]) {
    test(`${command} command waits for its handler and forwards failures`, async () => {
        const previous = FilesManager.getInstance;
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        let finished = false;
        FilesManager.getInstance = () => ({ [handler]: async () => { await gate; } });
        try {
            const running = commands[`aventus.filesystem.${command}`].run('file:///a.wcl.avt').then(() => { finished = true; });
            await Promise.resolve();
            assert.equal(finished, false);
            release();
            await running;
            assert.equal(finished, true);

            const failure = new Error(`${command} failed`);
            FilesManager.getInstance = () => ({ [handler]: async () => { throw failure; } });
            await assert.rejects(commands[`aventus.filesystem.${command}`].run('file:///a.wcl.avt'), error => error === failure);
        } finally {
            release();
            FilesManager.getInstance = previous;
        }
    });
}

function withStore(run) {
    const previous = {
        settings: Store._settings, publishPackage: Store.publishPackage,
        getProject: ProjectManager.getInstance, server: GenericServer.instance,
    };
    const events = [];
    const calls = [];
    let selection = null;
    let builds = [];
    let publication = true;
    Store._settings = { token: 'token', username: 'dev' };
    Store.publishPackage = async build => { calls.push(build); return publication; };
    ProjectManager.getInstance = () => ({
        getAllBuilds: () => builds,
        getProjectByUri: uri => ({ getBuild: name => ({ uri, name }) }),
    });
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Select: async (items, options) => { events.push(['select', items, options]); return selection; },
            showErrorMessage: message => events.push(['error', message]),
            showInformationMessage: message => events.push(['info', message]),
        },
    };
    return Promise.resolve().then(() => run({
        events, calls,
        setBuilds: value => { builds = value; },
        setSelection: value => { selection = value; },
        setPublication: value => { publication = value; },
    })).finally(() => {
        Store._settings = previous.settings;
        Store.publishPackage = previous.publishPackage;
        ProjectManager.getInstance = previous.getProject;
        GenericServer.instance = previous.server;
    });
}

test('store package publication uses the sole build and reports success', async () => {
    await withStore(async ({ events, calls, setBuilds }) => {
        setBuilds([{ name: 'Demo@release', uri: 'file:///demo/aventus.conf.avt' }]);
        await commands['aventus.store.publish_package'].run();
        assert.deepEqual(calls, [{ uri: 'file:///demo/aventus.conf.avt', name: 'Demo@release' }]);
        assert.deepEqual(events, [['info', 'Package published']]);
    });
});

test('store package publication reports each service error and honors cancellation', async () => {
    await withStore(async ({ events, calls, setBuilds, setSelection, setPublication }) => {
        setBuilds([{ name: 'A', uri: 'file:///a' }, { name: 'B', uri: 'file:///b' }]);
        await commands['aventus.store.publish_package'].run();
        assert.deepEqual(calls, []);
        assert.deepEqual(events, [['select', [
            { label: 'A', detail: 'file:///a' }, { label: 'B', detail: 'file:///b' },
        ], { title: 'Project to compile' }]]);
        events.length = 0;
        setSelection({ label: 'B', detail: 'file:///b' });
        setPublication(new QueryError([{ code: 1, message: 'Unauthorized' }, { code: 2, message: 'Invalid package' }]));
        await commands['aventus.store.publish_package'].run();
        assert.deepEqual(calls, [{ uri: 'file:///b', name: 'B' }]);
        assert.deepEqual(events.filter(item => item[0] === 'error').map(item => item[1]), [
            'Unauthorized', 'Invalid package',
        ]);
    });
});

test('store template download delegates URL and skips missing URL', async () => {
    const previous = GenericServer.instance;
    const urls = [];
    GenericServer.instance = { _template: { downloadTemplateFromStore: async url => urls.push(url) } };
    try {
        await commands['aventus.store.download_template'].run('https://store.example/template');
        await commands['aventus.store.download_template'].run('');
        assert.deepEqual(urls, ['https://store.example/template']);
    } finally {
        GenericServer.instance = previous;
    }
});

test('store template publication reports success and service validation errors', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-publish-template-'));
    const path = join(root, 'template.avt.ts');
    writeFileSync(path, 'export default {}');
    const oldSettings = Store._settings;
    const oldPublish = Store.publishTemplate;
    const oldCreate = TemplateScript.create;
    const oldServer = GenericServer.instance;
    const events = [];
    const template = { name: 'Demo' };
    Store._settings = { token: 'token', username: 'dev' };
    TemplateScript.create = async () => template;
    Store.publishTemplate = async received => { assert.equal(received, template); return true; };
    GenericServer.instance = { logLevel: 4, connection: {
        showInformationMessage: value => events.push(['info', value]),
        showErrorMessage: value => events.push(['error', value]),
    } };
    try {
        await commands['aventus.store.publish_template'].run(pathToUri(path));
        assert.deepEqual(events, [['info', 'Template published']]);
        events.length = 0;
        Store.publishTemplate = async () => new QueryError([{ code: 1, message: 'Already exists' }]);
        await commands['aventus.store.publish_template'].run(pathToUri(path));
        assert.deepEqual(events, [['error', 'Already exists']]);
        events.length = 0;
        TemplateScript.create = async () => null;
        await commands['aventus.store.publish_template'].run(pathToUri(path));
        assert.deepEqual(events, [['error', 'Your script for the template contains errors']]);
    } finally {
        Store._settings = oldSettings;
        Store.publishTemplate = oldPublish;
        TemplateScript.create = oldCreate;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});
