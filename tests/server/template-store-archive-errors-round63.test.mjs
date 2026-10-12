import assert from 'node:assert/strict';
import { createWriteStream, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
const [{ Store }, { TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

async function makeZip(entries) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-archive-fixture-'));
    const path = join(root, 'archive.zip');
    const output = createWriteStream(path);
    const archive = archiver('zip');
    const done = new Promise((resolve, reject) => {
        output.once('close', resolve);
        output.once('error', reject);
        archive.once('error', reject);
    });
    archive.pipe(output);
    for (const [name, content] of Object.entries(entries)) archive.append(content, { name });
    try {
        await archive.finalize();
        await done;
        return readFileSync(path);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

test('Store download rejects an archive without template manifest then installs a valid retry', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-archive-retry-'));
    const bodies = [
        await makeZip({ 'readme.txt': 'not a template' }),
        await makeZip({ 'template.avt.ts': 'fixture', 'content.txt': 'installed' }),
    ];
    const server = createServer((_request, response) => {
        response.writeHead(200, { 'content-type': 'application/zip' });
        response.end(bodies.shift());
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const oldUrl = Store.url;
    const oldServer = GenericServer.instance;
    const oldCreate = TemplateScript.create;
    const messages = [];
    let reloads = 0;
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [join(root, 'templates')];
    manager.projectPath = [join(root, 'projects')];
    manager.globalPath = [join(root, 'global')];
    manager.reloadTemplates = async () => { reloads++; };
    Store.url = `http://127.0.0.1:${server.address().port}`;
    GenericServer.instance = { _savePath: root, connection: {
        showErrorMessage: message => messages.push(`error:${message}`),
        showInformationMessage: message => messages.push(`info:${message}`),
    } };
    TemplateScript.create = async () => ({ installationFolder: 'nested/sample', isProject: false, isGlobal: false });
    t.after(async () => {
        Store.url = oldUrl;
        GenericServer.instance = oldServer;
        TemplateScript.create = oldCreate;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    });
    const url = `${Store.url}/template/download/sample/1.2.3`;
    await manager.downloadTemplateFromStore(url);
    assert.equal(reloads, 0);
    assert.equal(existsSync(join(root, 'templates', 'nested', 'sample')), false);
    assert.equal(existsSync(join(root, 'temp', 'packageTemp')), false);
    await manager.downloadTemplateFromStore(url);
    assert.equal(readFileSync(join(root, 'templates', 'nested', 'sample', 'content.txt'), 'utf8'), 'installed');
    assert.equal(reloads, 1);
    assert.equal(existsSync(join(root, 'temp', 'packageTemp')), false);
    assert.deepEqual(messages, ['error:template.avt.ts not found', 'info:Template sample installed']);
});

test('Store download currently accepts a valid ZIP body even when HTTP status is 404', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-http-status-'));
    const body = await makeZip({ 'template.avt.ts': 'fixture', 'content.txt': 'from 404' });
    const server = createServer((_request, response) => {
        response.writeHead(404, { 'content-type': 'application/zip' });
        response.end(body);
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const oldUrl = Store.url;
    const oldServer = GenericServer.instance;
    const oldCreate = TemplateScript.create;
    const messages = [];
    let reloads = 0;
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [join(root, 'templates')];
    manager.projectPath = [join(root, 'projects')];
    manager.globalPath = [join(root, 'global')];
    manager.reloadTemplates = async () => { reloads++; };
    Store.url = `http://127.0.0.1:${server.address().port}`;
    GenericServer.instance = { _savePath: root, connection: {
        showErrorMessage: message => messages.push(`error:${message}`),
        showInformationMessage: message => messages.push(`info:${message}`),
    } };
    TemplateScript.create = async () => ({ installationFolder: 'sample', isProject: false, isGlobal: false });
    t.after(async () => {
        Store.url = oldUrl;
        GenericServer.instance = oldServer;
        TemplateScript.create = oldCreate;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    });
    await manager.downloadTemplateFromStore(`${Store.url}/template/download/sample/1.2.3`);
    assert.equal(readFileSync(join(root, 'templates', 'sample', 'content.txt'), 'utf8'), 'from 404');
    assert.equal(reloads, 1);
    assert.deepEqual(messages, ['info:Template sample installed']);
});
