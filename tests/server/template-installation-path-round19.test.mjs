import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

for (const kind of ['templates', 'projects']) {
    test(`local ${kind} import currently accepts a parent installation folder`, async () => {
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
            },
        };
        TemplateScript.create = async () => ({ name: 'Sample', installationFolder: '../outside' });
        try {
            if (kind === 'templates') await manager.selectTemplateToImport();
            else await manager.selectProjectToImport(false);
            assert.equal(readFileSync(join(escaped, 'created.txt'), 'utf8'), kind);
            assert.equal(existsSync(join(destination, 'outside')), false);
            assert.equal(messages.length, 1);
        } finally {
            TemplateScript.create = previousCreate;
            GenericServer.instance = previousServer;
            rmSync(root, { recursive: true, force: true });
        }
    });
}
