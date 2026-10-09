import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFileSync, createWriteStream, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { loadServerModules } from './helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
const [{ TemplateManager }, { TemplateScript }, { GenericServer }, { Store }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts', 'store/Store.ts',
]);

async function makeArchive(path, entries) {
    const output = createWriteStream(path);
    const archive = archiver('zip');
    const done = new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);
    });
    archive.pipe(output);
    for (const [name, content] of Object.entries(entries)) archive.append(content, { name });
    await archive.finalize();
    await done;
}

test('Store template installation extracts a real ZIP into the configured folder', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-real-zip-'));
    const zipPath = join(root, 'download.zip');
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    const manager = Object.create(TemplateManager.prototype);
    const messages = [];
    manager.templatePath = [join(root, 'templates')];
    manager.projectPath = [join(root, 'projects')];
    manager.globalPath = [join(root, 'global')];
    manager.downloadFile = async destination => { copyFileSync(zipPath, destination); return true; };
    manager.reloadTemplates = async () => messages.push('reload');
    GenericServer.instance = { _savePath: root, connection: {
        showInformationMessage: message => messages.push(message),
        showErrorMessage: message => messages.push(`error:${message}`),
    } };
    TemplateScript.create = async path => {
        assert.equal(readFileSync(path, 'utf8'), 'template fixture');
        return { name: 'Sample', installationFolder: 'nested/sample', isProject: false, isGlobal: false };
    };
    try {
        await makeArchive(zipPath, {
            'template.avt.ts': 'template fixture',
            'components/card.wcl.avt': 'export class Card {}',
        });
        await manager.downloadTemplateFromStore(`${Store.url}/template/download/sample/1.2.3`);
        const installed = join(root, 'templates', 'nested', 'sample');
        assert.equal(readFileSync(join(installed, 'components', 'card.wcl.avt'), 'utf8'), 'export class Card {}');
        assert.deepEqual(messages, ['reload', 'Template sample installed']);
        assert.equal(existsSync(join(root, 'temp', 'packageTemp')), false);
    } finally {
        TemplateScript.create = previousCreate;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('invalid Store archive is rejected before an installation is created', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-invalid-zip-'));
    const previousServer = GenericServer.instance;
    const manager = Object.create(TemplateManager.prototype);
    const errors = [];
    manager.templatePath = [join(root, 'templates')];
    manager.projectPath = [join(root, 'projects')];
    manager.globalPath = [join(root, 'global')];
    manager.downloadFile = async destination => { writeFileSync(destination, 'not a ZIP'); return true; };
    manager.reloadTemplates = () => assert.fail('registry should not reload');
    GenericServer.instance = { _savePath: root, connection: { showErrorMessage: message => errors.push(message) } };
    const originalError = console.error;
    console.error = () => {};
    try {
        await manager.downloadTemplateFromStore(`${Store.url}/template/download/broken/1.2.3`);
        assert.deepEqual(errors, ['Error extracting package to analyze']);
        assert.equal(existsSync(join(root, 'templates', 'broken')), false);
        assert.equal(existsSync(join(root, 'temp', 'packageTemp', 'temp.zip')), true);
    } finally {
        console.error = originalError;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
