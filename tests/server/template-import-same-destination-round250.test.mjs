import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

for (const kind of ['projects', 'templates']) {
    test(`local ${kind} import with one installation folder replaces the first selected source`, async t => {
        const root = mkdtempSync(join(tmpdir(), `aventus-import-collision-${kind}-`));
        const sourceRoot = join(root, 'extension', 'templates', kind);
        const destination = join(root, 'installed');
        const target = join(destination, 'nested', 'shared');
        mkdirSync(target, { recursive: true });
        writeFileSync(join(target, 'old.txt'), 'previous installation');
        writeFileSync(join(destination, 'neighbor.txt'), 'preserved neighbor');
        for (const name of ['first', 'second']) {
            const folder = join(sourceRoot, name);
            mkdirSync(folder, { recursive: true });
            writeFileSync(join(folder, 'template.avt.ts'), name);
            writeFileSync(join(folder, `${name}.txt`), `${name} source`);
        }

        const previousServer = GenericServer.instance;
        const previousCreate = TemplateScript.create;
        t.after(() => {
            GenericServer.instance = previousServer;
            TemplateScript.create = previousCreate;
            rmSync(root, { recursive: true, force: true });
        });

        const messages = [];
        let reloads = 0;
        GenericServer.instance = {
            _extensionPath: join(root, 'extension'),
            _template: { workspaces: [root] },
            logLevel: 99,
            connection: {
                Select: async () => ({ label: 'Local' }),
                SelectMultiple: async items => items,
                showInformationMessage: message => messages.push(message),
                showErrorMessage: message => { throw new Error(message); },
            },
        };
        TemplateScript.create = async path => ({
            name: path.includes('first') ? 'First' : 'Second',
            installationFolder: 'nested/shared',
        });

        const manager = Object.create(TemplateManager.prototype);
        manager.projectPath = [destination];
        manager.templatePath = [destination];
        manager.reloadProjects = async () => { reloads++; };
        manager.reloadTemplates = async () => { reloads++; };

        if (kind === 'projects') await manager.selectProjectToImport(false);
        else await manager.selectTemplateToImport();

        assert.equal(readFileSync(join(target, 'second.txt'), 'utf8'), 'second source');
        assert.equal(existsSync(join(target, 'first.txt')), false);
        assert.equal(existsSync(join(target, 'old.txt')), false);
        assert.equal(readFileSync(join(destination, 'neighbor.txt'), 'utf8'), 'preserved neighbor');
        assert.deepEqual(messages, [kind === 'projects' ? 'Projects installed' : 'Templates installed']);
        assert.equal(reloads, 1);
    });
}
