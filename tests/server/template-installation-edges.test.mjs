import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('local template import replaces an existing installation and honors its destination folder', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-replace-template-'));
    const source = join(root, 'extension', 'templates', 'templates', 'sample');
    const destination = join(root, 'installed');
    const installed = join(destination, 'nested', 'sample');
    mkdirSync(source, { recursive: true });
    mkdirSync(installed, { recursive: true });
    writeFileSync(join(source, 'template.avt.ts'), 'fixture');
    writeFileSync(join(source, 'fresh.txt'), 'fresh');
    writeFileSync(join(installed, 'stale.txt'), 'stale');
    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    let reloads = 0;
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'), _template: { workspaces: [root] }, logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => items,
            showInformationMessage() {},
        },
    };
    TemplateScript.create = async () => ({ name: 'Sample', installationFolder: 'nested/sample' });
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [destination];
    manager.reloadTemplates = async () => { reloads++; };
    try {
        await manager.selectTemplateToImport();
        assert.equal(existsSync(join(installed, 'stale.txt')), false);
        assert.equal(readFileSync(join(installed, 'fresh.txt'), 'utf8'), 'fresh');
        assert.equal(reloads, 1);
    } finally {
        GenericServer.instance = previousServer;
        TemplateScript.create = previousCreate;
        rmSync(root, { recursive: true, force: true });
    }
});

test('template import and uninstall cancellation leave registries and files intact', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-cancel-template-'));
    const installed = join(root, 'installed');
    mkdirSync(installed);
    writeFileSync(join(installed, 'template.avt.ts'), 'fixture');
    const previous = GenericServer.instance;
    let reloads = 0;
    GenericServer.instance = { connection: {
        Select: async () => null,
        SelectMultiple: async () => null,
        showInformationMessage: () => assert.fail('unexpected notification'),
    } };
    const script = Object.create(TemplateScript.prototype);
    script.name = 'Installed';
    script.config = join(installed, 'template.avt.ts');
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [root];
    manager.loadedTemplates = { Installed: script };
    manager.reloadTemplates = async () => { reloads++; };
    try {
        await manager.selectTemplateToImport();
        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(installed), true);
        assert.equal(reloads, 0);
    } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('missing project and template installation paths report an error before selection', async () => {
    const previous = GenericServer.instance;
    const errors = [];
    GenericServer.instance = { logLevel: 99, connection: {
        showErrorMessage: message => errors.push(message),
        Select: () => assert.fail('selection should not open'),
    } };
    const manager = Object.create(TemplateManager.prototype);
    manager.projectPath = [];
    manager.templatePath = [];
    try {
        await manager.selectProjectToImport(false);
        await manager.selectTemplateToImport();
        assert.deepEqual(errors, ['No project path registered', 'No template path registered']);
    } finally {
        GenericServer.instance = previous;
    }
});
