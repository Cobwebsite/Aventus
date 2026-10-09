import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createWriteStream, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
const [{ Store }, { TemplateManager }, { TemplateScript }, { GenericServer }, { StoreDownloadTemplate }] = await loadServerModules([
    'store/Store.ts', 'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts', 'cmds/store/DownloadTemplate.ts',
]);

async function listen(handler) {
    const server = createServer(handler);
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    return { server, url: `http://127.0.0.1:${server.address().port}` };
}

async function archiveFixture(path) {
    const stream = createWriteStream(path);
    const zip = archiver('zip');
    const done = new Promise((resolve, reject) => {
        stream.once('close', resolve);
        stream.once('error', reject);
        zip.once('error', reject);
    });
    zip.pipe(stream);
    zip.append('fixture', { name: 'template.avt.ts' });
    zip.append('card', { name: 'components/card.txt' });
    await zip.finalize();
    await done;
}

test('Store connects and disconnects against a local HTTP service', async t => {
    const requests = [];
    const { server, url } = await listen(async (request, response) => {
        const body = [];
        for await (const chunk of request) body.push(chunk);
        requests.push({ path: request.url, authorization: request.headers.authorization, body: JSON.parse(Buffer.concat(body).toString()) });
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ errors: [], result: request.url.endsWith('/login') ? 'token-local' : true }));
    });
    const previousUrl = Store.url;
    const previousSettings = Store._settings;
    const previousSet = Store.setSettings;
    Store.url = url;
    Store._settings = { token: '', username: undefined };
    Store.setSettings = patch => { Store._settings = { ...Store._settings, ...patch }; };
    t.after(async () => {
        Store.url = previousUrl;
        Store._settings = previousSettings;
        Store.setSettings = previousSet;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });

    assert.equal(await Store.connect('alice', 'secret'), true);
    assert.equal(Store.isConnected, true);
    assert.equal(Store.token, 'token-local');
    await Store.disconnect();
    assert.equal(Store.isConnected, false);
    assert.equal(Store.settings.username, undefined);
    assert.deepEqual(requests.map(request => request.path), ['/api/remote/login', '/api/remote/logout']);
    assert.equal(requests[0].authorization, undefined);
    assert.equal(requests[0].body.username, 'alice');
    assert.equal(requests[0].body.password, 'secret');
    assert.match(requests[1].authorization, /^Bearer token-local\|.+/);
});

test('download command fetches a ZIP from local HTTP and installs its files', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-command-http-'));
    const zipPath = join(root, 'source.zip');
    await archiveFixture(zipPath);
    const requests = [];
    const { server, url } = await listen((request, response) => {
        requests.push(request.url);
        response.setHeader('Content-Type', 'application/zip');
        response.end(readFileSync(zipPath));
    });
    const previousUrl = Store.url;
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    const messages = [];
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [join(root, 'templates')];
    manager.projectPath = [join(root, 'projects')];
    manager.globalPath = [join(root, 'global')];
    manager.reloadTemplates = async () => messages.push('reload');
    Store.url = url;
    GenericServer.instance = { _savePath: root, _template: manager, connection: {
        showInformationMessage: message => messages.push(message),
        showErrorMessage: message => messages.push(`error:${message}`),
    } };
    TemplateScript.create = async path => {
        assert.equal(readFileSync(path, 'utf8'), 'fixture');
        return { installationFolder: 'nested/sample', isProject: false, isGlobal: false };
    };
    t.after(async () => {
        Store.url = previousUrl;
        GenericServer.instance = previousServer;
        TemplateScript.create = previousCreate;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    });

    await StoreDownloadTemplate.run(`${url}/template/download/sample/1.2.3`);
    assert.deepEqual(requests, ['/template/download/sample/1.2.3']);
    assert.equal(readFileSync(join(root, 'templates', 'nested', 'sample', 'components', 'card.txt'), 'utf8'), 'card');
    assert.deepEqual(messages, ['reload', 'Template sample installed']);
    assert.equal(existsSync(join(root, 'temp', 'packageTemp')), false);
});
