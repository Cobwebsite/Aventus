import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('template installation path rejects a nested directory junction outside the installation root', t => {
    const temp = mkdtempSync(join(tmpdir(), 'aventus-template-install-link-'));
    t.after(() => rmSync(temp, { recursive: true, force: true }));
    const root = join(temp, 'installed');
    const outside = join(temp, 'outside');
    const inside = join(root, 'inside');
    mkdirSync(root);
    mkdirSync(outside);
    mkdirSync(inside);
    symlinkSync(outside, join(root, 'linked'), 'junction');
    symlinkSync(inside, join(root, 'local-link'), 'junction');

    const selected = TemplateManager.getInstallationPath(root, 'linked/new-template');
    assert.equal(selected, null);
    assert.equal(realpathSync(join(root, 'linked')), realpathSync(outside));
    assert.equal(relative(root, realpathSync(join(root, 'linked'))).startsWith('..'), true);
    assert.equal(TemplateManager.getInstallationPath(root, 'local-link/new-template'), join(root, 'local-link', 'new-template'));
});

test('local template import rejects a junction outside the installation root', async t => {
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
    const errors = [];
    GenericServer.instance = {
        _extensionPath: join(temp, 'extension'), _template: { workspaces: [temp] }, logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => items,
            showInformationMessage: message => messages.push(message),
            showErrorMessage: message => errors.push(message),
        },
    };
    TemplateScript.create = async () => ({ name: 'Sample', installationFolder: 'linked/new-template' });
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [root];
    let reloads = 0;
    manager.reloadTemplates = async () => { reloads++; };
    await manager.selectTemplateToImport();

    assert.equal(existsSync(join(outside, 'new-template')), false);
    assert.equal(existsSync(join(root, 'linked', 'new-template')), false);
    assert.equal(reloads, 0);
    assert.deepEqual(messages, []);
    assert.deepEqual(errors, ['Template Sample failed: invalid installation folder']);
});
