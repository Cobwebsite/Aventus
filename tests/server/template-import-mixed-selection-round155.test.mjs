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
    test(`local ${kind} import skips an invalid selection and installs the valid sibling`, async t => {
        const root = mkdtempSync(join(tmpdir(), `aventus-mixed-import-${kind}-`));
        const sourceRoot = join(root, 'extension', 'templates', kind);
        const destination = join(root, 'installed');
        const outside = join(root, 'outside');
        mkdirSync(destination);
        for (const name of ['invalid', 'valid']) {
            const folder = join(sourceRoot, name);
            mkdirSync(folder, { recursive: true });
            writeFileSync(join(folder, 'template.avt.ts'), name);
            writeFileSync(join(folder, 'content.txt'), `${name} content`);
        }
        mkdirSync(outside);
        writeFileSync(join(outside, 'sentinel.txt'), 'preserve');

        const previousServer = GenericServer.instance;
        const previousCreate = TemplateScript.create;
        t.after(() => {
            GenericServer.instance = previousServer;
            TemplateScript.create = previousCreate;
            rmSync(root, { recursive: true, force: true });
        });

        const errors = [];
        const messages = [];
        const selected = [];
        let reloads = 0;
        GenericServer.instance = {
            _extensionPath: join(root, 'extension'),
            _template: { workspaces: [root] },
            logLevel: 99,
            connection: {
                Select: async () => ({ label: 'Local' }),
                SelectMultiple: async items => {
                    selected.push(...items.map(item => item.label));
                    return items;
                },
                showInformationMessage: message => messages.push(message),
                showErrorMessage: message => errors.push(message),
            },
        };
        TemplateScript.create = async path => ({
            name: path.includes('invalid') ? 'Invalid' : 'Valid',
            installationFolder: path.includes('invalid') ? '../outside' : 'nested/valid',
        });

        const manager = Object.create(TemplateManager.prototype);
        manager.projectPath = [destination];
        manager.templatePath = [destination];
        manager.reloadProjects = async () => { reloads++; };
        manager.reloadTemplates = async () => { reloads++; };

        if (kind === 'projects') await manager.selectProjectToImport(false);
        else await manager.selectTemplateToImport();

        assert.deepEqual(selected, ['Invalid', 'Valid']);
        assert.deepEqual(errors, [kind === 'projects'
            ? 'Invalid installation folder'
            : 'Template Invalid failed: invalid installation folder']);
        assert.deepEqual(messages, [kind === 'projects' ? 'Projects installed' : 'Templates installed: Valid']);
        assert.equal(reloads, 1);
        assert.equal(readFileSync(join(outside, 'sentinel.txt'), 'utf8'), 'preserve');
        assert.equal(existsSync(join(outside, 'content.txt')), false);
        assert.equal(readFileSync(join(destination, 'nested', 'valid', 'content.txt'), 'utf8'), 'valid content');
    });
}
