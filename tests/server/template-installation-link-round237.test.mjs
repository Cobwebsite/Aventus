import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('template installation path resolves a nested directory junction outside the installation root', t => {
    const temp = mkdtempSync(join(tmpdir(), 'aventus-template-install-link-'));
    t.after(() => rmSync(temp, { recursive: true, force: true }));
    const root = join(temp, 'installed');
    const outside = join(temp, 'outside');
    mkdirSync(root);
    mkdirSync(outside);
    symlinkSync(outside, join(root, 'linked'), 'junction');

    const selected = TemplateManager.getInstallationPath(root, 'linked/new-template');
    assert.equal(selected, join(root, 'linked', 'new-template'));
    assert.equal(realpathSync(join(root, 'linked')), realpathSync(outside));
    assert.equal(relative(root, realpathSync(join(root, 'linked'))).startsWith('..'), true);
});

test('local template import writes through a junction outside the installation root', async t => {
    const temp = mkdtempSync(join(tmpdir(), 'aventus-template-import-link-'));
    t.after(() => rmSync(temp, { recursive: true, force: true }));
    const source = join(temp, 'extension', 'templates', 'templates', 'sample');
    const root = join(temp, 'installed');
    const outside = join(temp, 'outside');
    mkdirSync(source, { recursive: true });
    mkdirSync(root);
    mkdirSync(outside);
    symlinkSync(outside, join(root, 'linked'), 'junction');
    writeFileSync(join(source, 'template.avt.ts'), 'fixture');
    writeFileSync(join(source, 'content.txt'), 'copied outside');

    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    t.after(() => {
        GenericServer.instance = previousServer;
        TemplateScript.create = previousCreate;
    });
    const messages = [];
    GenericServer.instance = {
        _extensionPath: join(temp, 'extension'), _template: { workspaces: [temp] }, logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => items,
            showInformationMessage: message => messages.push(message),
        },
    };
    TemplateScript.create = async () => ({ name: 'Sample', installationFolder: 'linked/new-template' });
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [root];
    let reloads = 0;
    manager.reloadTemplates = async () => { reloads++; };
    await manager.selectTemplateToImport();

    assert.equal(readFileSync(join(outside, 'new-template', 'content.txt'), 'utf8'), 'copied outside');
    assert.equal(existsSync(join(root, 'linked', 'new-template', 'content.txt')), true);
    assert.equal(reloads, 1);
    assert.deepEqual(messages, ['Templates installed']);
});
