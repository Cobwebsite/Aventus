import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

for (const kind of ['projects', 'templates']) {
    test(`local ${kind} import replaces an installed folder without retaining obsolete files`, async t => {
        const root = mkdtempSync(join(tmpdir(), `aventus-import-replace-${kind}-`));
        t.after(() => rmSync(root, { recursive: true, force: true }));
        const extension = join(root, 'extension');
        const source = join(extension, 'templates', kind, 'source');
        const destination = join(root, 'installed');
        const target = join(destination, 'nested', 'renamed');
        mkdirSync(source, { recursive: true });
        mkdirSync(target, { recursive: true });
        writeFileSync(join(source, 'template.avt.ts'), 'new template');
        writeFileSync(join(source, 'new.txt'), 'new content');
        writeFileSync(join(target, 'template.avt.ts'), 'old template');
        writeFileSync(join(target, 'obsolete.txt'), 'obsolete content');
        writeFileSync(join(destination, 'neighbor.txt'), 'keep neighbor');

        const previousServer = GenericServer.instance;
        const previousCreate = TemplateScript.create;
        t.after(() => {
            GenericServer.instance = previousServer;
            TemplateScript.create = previousCreate;
        });

        const messages = [];
        let reloads = 0;
        GenericServer.instance = {
            _extensionPath: extension,
            _template: { workspaces: [root] },
            connection: {
                Select: async () => ({ label: 'Local' }),
                SelectMultiple: async items => {
                    assert.deepEqual(items.map(item => item.label), ['Updated']);
                    return [{ ...items[0] }];
                },
                showInformationMessage: message => messages.push(message),
            },
        };
        TemplateScript.create = async () => ({ name: 'Updated', installationFolder: 'nested/renamed' });

        const manager = Object.create(TemplateManager.prototype);
        manager.projectPath = [destination];
        manager.templatePath = [destination];
        manager.reloadProjects = async () => { reloads++; };
        manager.reloadTemplates = async () => { reloads++; };

        if (kind === 'projects') await manager.selectProjectToImport(false);
        else await manager.selectTemplateToImport();

        assert.equal(readFileSync(join(target, 'template.avt.ts'), 'utf8'), 'new template');
        assert.equal(readFileSync(join(target, 'new.txt'), 'utf8'), 'new content');
        assert.equal(existsSync(join(target, 'obsolete.txt')), false);
        assert.equal(readFileSync(join(destination, 'neighbor.txt'), 'utf8'), 'keep neighbor');
        assert.deepEqual(messages, [kind === 'projects' ? 'Projects installed' : 'Templates installed']);
        assert.equal(reloads, 1);
    });
}
