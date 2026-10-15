import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { createWriteStream, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
const [{ Store }, { TemplateManager }, { TemplateScript }, { GenericServer }, { StoreDownloadTemplate }] = await loadServerModules([
    'store/Store.ts', 'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts', 'cmds/store/DownloadTemplate.ts',
]);

async function zipWithContent(content) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-zip-'));
    const path = join(root, 'fixture.zip');
    const output = createWriteStream(path);
    const archive = archiver('zip');
    const done = new Promise((resolve, reject) => {
        output.once('close', resolve);
        output.once('error', reject);
        archive.once('error', reject);
    });
    archive.pipe(output);
    archive.append('fixture', { name: 'template.avt.ts' });
    archive.append(content, { name: 'components/card.txt' });
    try {
        await archive.finalize();
        await done;
        return readFileSync(path);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

test('Store template download survives a bad HTTP archive and installs a later valid version', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-http-recovery-'));
    const archives = [await zipWithContent('first'), Buffer.from('bad archive'), await zipWithContent('recovered')];
    const requests = [];
    const server = createServer((request, response) => {
        requests.push(request.url);
        const body = archives.shift();
        response.writeHead(body.toString() === 'bad archive' ? 500 : 200, { 'Content-Type': 'application/zip' });
        response.end(body);
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const previousUrl = Store.url;
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    const messages = [];
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [join(root, 'templates')];
    manager.projectPath = [join(root, 'projects')];
    manager.globalPath = [join(root, 'global')];
    manager.reloadTemplates = async () => messages.push('reload');
    Store.url = `http://127.0.0.1:${server.address().port}`;
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

    const url = `${Store.url}/template/download/sample/1.2.3`;
    const installed = join(root, 'templates', 'nested', 'sample', 'components', 'card.txt');
    const temporary = join(root, 'temp', 'packageTemp');
    const originalError = console.error;
    console.error = () => {};
    try {
        await StoreDownloadTemplate.run(url);
        assert.equal(readFileSync(installed, 'utf8'), 'first');
        assert.equal(existsSync(temporary), false);

        await StoreDownloadTemplate.run(url);
        assert.equal(readFileSync(installed, 'utf8'), 'first');
        assert.equal(existsSync(temporary), false);

        await StoreDownloadTemplate.run(url);
        assert.equal(readFileSync(installed, 'utf8'), 'recovered');
        assert.equal(existsSync(temporary), false);
    } finally {
        console.error = originalError;
    }
    assert.deepEqual(requests, Array(3).fill('/template/download/sample/1.2.3'));
    assert.deepEqual(messages, [
        'reload', 'Template sample installed',
        'error:Error downloading package',
        'reload', 'Template sample installed',
    ]);
});
