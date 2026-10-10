import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }, { Store }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts', 'store/Store.ts',
]);

for (const kind of ['template', 'project', 'global']) {
    test(`Store download installs a ${kind} in its registry and removes the temporary archive`, async () => {
        const root = mkdtempSync(join(tmpdir(), `aventus-store-${kind}-`));
        const previousServer = GenericServer.instance;
        const previousCreate = TemplateScript.create;
        const notifications = [];
        const downloads = [];
        const extracts = [];
        const reloads = [];
        const manager = Object.create(TemplateManager.prototype);
        manager.templatePath = [join(root, 'templates')];
        manager.projectPath = [join(root, 'projects')];
        manager.globalPath = [join(root, 'global')];
        for (const path of [...manager.templatePath, ...manager.projectPath, ...manager.globalPath]) mkdirSync(path);
        const uri = `${Store.url}/template/download/sample/1.2.3`;
        GenericServer.instance = {
            _savePath: root,
            connection: { showInformationMessage: message => notifications.push(['info', message]), showErrorMessage: message => notifications.push(['error', message]) },
        };
        manager.downloadFile = async (path, url) => {
            downloads.push([path, url]);
            writeFileSync(path, 'archive fixture');
            return true;
        };
        manager.extractZip = async (path, output) => {
            extracts.push([path, output]);
            mkdirSync(output, { recursive: true });
            if (extracts.length === 1) writeFileSync(join(output, 'template.avt.ts'), 'fixture');
            else writeFileSync(join(output, 'created.txt'), kind);
            return true;
        };
        manager.reloadTemplates = async () => reloads.push('template');
        manager.reloadProjects = async () => reloads.push('project');
        manager.reloadGlobal = async () => reloads.push('global');
        TemplateScript.create = async () => ({
            name: 'Sample', isProject: kind === 'project', isGlobal: kind === 'global',
            installationFolder: 'nested/sample',
        });
        try {
            await manager.downloadTemplateFromStore(uri);
            const base = manager[`${kind}Path`][0];
            assert.equal(readFileSync(join(base, 'nested', 'sample', 'created.txt'), 'utf8'), kind);
            assert.deepEqual(reloads, [kind]);
            assert.deepEqual(notifications, [['info', 'Template sample installed']]);
            assert.equal(downloads.length, 1);
            assert.equal(downloads[0][1], uri);
            assert.equal(extracts.length, 2);
            assert.equal(existsSync(join(root, 'temp', 'packageTemp')), false);
        } finally {
            TemplateScript.create = previousCreate;
            GenericServer.instance = previousServer;
            rmSync(root, { recursive: true, force: true });
        }
    });
}

test('Store download rejects an invalid URI before creating an archive', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-uri-'));
    const previousServer = GenericServer.instance;
    const errors = [];
    const manager = Object.create(TemplateManager.prototype);
    manager.downloadFile = () => assert.fail('download should not begin');
    GenericServer.instance = { _savePath: root, connection: { showErrorMessage: message => errors.push(message) } };
    try {
        await manager.downloadTemplateFromStore(`${Store.url}/template/download/sample/latest`);
        assert.deepEqual(errors, ['The uri provided is wrong']);
        assert.equal(existsSync(join(root, 'temp')), false);
    } finally {
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Store download rejects an installation folder outside its root before extracting there', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-path-'));
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    const errors = [];
    const extracts = [];
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [join(root, 'templates')];
    manager.projectPath = [join(root, 'projects')];
    manager.globalPath = [join(root, 'global')];
    GenericServer.instance = {
        _savePath: root,
        connection: { showErrorMessage: message => errors.push(message) },
    };
    manager.downloadFile = async path => { writeFileSync(path, 'archive fixture'); return true; };
    manager.extractZip = async (path, output) => {
        extracts.push(output);
        mkdirSync(output, { recursive: true });
        writeFileSync(join(output, 'template.avt.ts'), 'fixture');
        return true;
    };
    TemplateScript.create = async () => ({ installationFolder: '..\\outside', isProject: false, isGlobal: false });
    try {
        await manager.downloadTemplateFromStore(`${Store.url}/template/download/sample/1.2.3`);
        assert.equal(extracts.length, 1);
        assert.deepEqual(errors, ['Invalid installation folder']);
        assert.equal(existsSync(join(root, 'outside')), false);
    } finally {
        TemplateScript.create = previousCreate;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
