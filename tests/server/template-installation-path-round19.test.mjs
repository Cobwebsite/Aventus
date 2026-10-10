import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }, { getInstallationPath }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts', 'files/InstallationPath.ts',
]);

for (const kind of ['templates', 'projects']) {
    for (const installationFolder of ['../outside', '..\\outside', 'nested/..\\..\\outside', '/absolute', 'C:\\absolute']) {
    test(`local ${kind} import rejects installation folder ${installationFolder}`, async () => {
        const root = mkdtempSync(join(tmpdir(), `aventus-install-parent-${kind}-`));
        const source = join(root, 'extension', 'templates', kind, 'sample');
        const destination = join(root, 'installed', kind);
        const escaped = join(root, 'installed', 'outside');
        mkdirSync(source, { recursive: true });
        mkdirSync(destination, { recursive: true });
        writeFileSync(join(source, 'template.avt.ts'), 'fixture');
        writeFileSync(join(source, 'created.txt'), kind);
        const previousServer = GenericServer.instance;
        const previousCreate = TemplateScript.create;
        const messages = [];
        const errors = [];
        const manager = Object.create(TemplateManager.prototype);
        manager.templatePath = [destination];
        manager.projectPath = [destination];
        manager.reloadTemplates = async () => {};
        manager.reloadProjects = async () => {};
        GenericServer.instance = {
            _extensionPath: join(root, 'extension'),
            _template: { workspaces: [root] },
            connection: {
                Select: async () => ({ label: 'Local' }),
                SelectMultiple: async items => items,
                showInformationMessage: message => messages.push(message),
                showErrorMessage: message => errors.push(message),
            },
        };
        TemplateScript.create = async () => ({ name: 'Sample', installationFolder });
        try {
            if (kind === 'templates') await manager.selectTemplateToImport();
            else await manager.selectProjectToImport(false);
            assert.equal(existsSync(escaped), false);
            assert.equal(existsSync(join(destination, 'outside')), false);
            assert.equal(existsSync(join(destination, 'nested')), false);
            assert.deepEqual(errors, ['Invalid installation folder']);
            assert.equal(messages.length, 0);
        } finally {
            TemplateScript.create = previousCreate;
            GenericServer.instance = previousServer;
            rmSync(root, { recursive: true, force: true });
        }
    });
    }
}

test('installation paths allow nested folders inside the root', () => {
    const root = join(tmpdir(), 'aventus-install-root');
    assert.equal(getInstallationPath(root, 'nested\\sample'), join(root, 'nested', 'sample'));
    assert.equal(getInstallationPath(root, 'nested/../sample'), join(root, 'sample'));
    assert.equal(getInstallationPath(root, '.'), null);
});
