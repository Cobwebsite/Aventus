import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

for (const kind of ['templates', 'projects']) {
    test(`local ${kind} import distinguishes identically named scripts by selection id`, async () => {
        const root = mkdtempSync(join(tmpdir(), `aventus-duplicate-import-${kind}-`));
        const sourceRoot = join(root, 'extension', 'templates', kind);
        const destination = join(root, 'installed');
        for (const name of ['first', 'second']) {
            const folder = join(sourceRoot, name);
            mkdirSync(folder, { recursive: true });
            writeFileSync(join(folder, 'template.avt.ts'), name);
            writeFileSync(join(folder, 'payload.txt'), name);
        }
        mkdirSync(destination);

        const previousServer = GenericServer.instance;
        const previousCreate = TemplateScript.create;
        const manager = Object.create(TemplateManager.prototype);
        manager.templatePath = [destination];
        manager.projectPath = [destination];
        let reloads = 0;
        manager.reloadTemplates = async () => { reloads++; };
        manager.reloadProjects = async () => { reloads++; };
        GenericServer.instance = {
            _extensionPath: join(root, 'extension'),
            _template: { workspaces: [root] },
            connection: {
                Select: async () => ({ label: 'Local' }),
                SelectMultiple: async items => {
                    assert.deepEqual(items.map(item => item.label), ['Shared', 'Shared']);
                    assert.deepEqual(items.map(item => item.id), [join(sourceRoot, 'first'), join(sourceRoot, 'second')]);
                    return [{ ...items[1] }];
                },
                showInformationMessage: () => {},
            },
        };
        TemplateScript.create = async config => ({ name: 'Shared', config });
        try {
            if (kind === 'templates') await manager.selectTemplateToImport();
            else await manager.selectProjectToImport(false);
            assert.equal(existsSync(join(destination, 'first')), false);
            assert.equal(readFileSync(join(destination, 'second', 'payload.txt'), 'utf8'), 'second');
            assert.equal(reloads, 1);
        } finally {
            TemplateScript.create = previousCreate;
            GenericServer.instance = previousServer;
            rmSync(root, { recursive: true, force: true });
        }
    });
}
