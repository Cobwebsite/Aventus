import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('local template import recovers after an unreadable script, then survives uninstall and reinstall', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-import-retry-'));
    const source = join(root, 'extension', 'templates', 'templates', 'sample');
    const installedRoot = join(root, 'installed');
    const sourceConfig = join(source, 'template.avt.ts');
    const installedConfig = join(installedRoot, 'sample', 'template.avt.ts');
    mkdirSync(source, { recursive: true });
    mkdirSync(installedRoot);
    writeFileSync(sourceConfig, 'invalid');
    writeFileSync(join(source, 'payload.txt'), 'payload');

    const oldServer = GenericServer.instance;
    const oldCreate = TemplateScript.create;
    const selections = [];
    const messages = [];
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'),
        _template: { workspaces: [root] },
        logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => {
                selections.push(items.map(item => item.label));
                return items;
            },
            showInformationMessage: message => messages.push(message),
        },
    };
    TemplateScript.create = async config => {
        if (readFileSync(config, 'utf8') !== 'valid') return undefined;
        const script = Object.create(TemplateScript.prototype);
        script.name = 'Sample';
        script.description = 'Recovered template';
        script.config = config;
        return script;
    };
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [installedRoot];
    manager.loadedTemplates = {};
    manager.loadedTemplatesLength = 0;
    try {
        await manager.selectTemplateToImport();
        assert.deepEqual(selections, [[]]);
        assert.equal(existsSync(installedConfig), false);
        assert.deepEqual(Object.keys(manager.getGeneralTemplates()), []);

        writeFileSync(sourceConfig, 'valid');
        await manager.selectTemplateToImport();
        assert.deepEqual(selections, [[], ['Sample']]);
        assert.equal(readFileSync(join(installedRoot, 'sample', 'payload.txt'), 'utf8'), 'payload');
        assert.equal(manager.getGeneralTemplates().Sample.config, installedConfig);
        assert.equal(manager.getGeneralTemplatesLength(), 1);

        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(installedConfig), false);
        assert.deepEqual(Object.keys(manager.getGeneralTemplates()), []);
        assert.equal(manager.getGeneralTemplatesLength(), 0);

        await manager.selectTemplateToImport();
        assert.equal(manager.getGeneralTemplates().Sample.config, installedConfig);
        assert.equal(manager.getGeneralTemplatesLength(), 1);
        assert.deepEqual(messages, ['Templates installed', 'Templates deleted', 'Templates installed']);
    } finally {
        TemplateScript.create = oldCreate;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});
