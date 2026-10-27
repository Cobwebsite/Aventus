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
    test(`local ${kind} reimport preserves the old installation when the source disappears`, async t => {
        const root = mkdtempSync(join(tmpdir(), `aventus-import-vanish-${kind}-`));
        const extension = join(root, 'extension');
        const source = join(extension, 'templates', kind, 'source');
        const destination = join(root, 'installed');
        const target = join(destination, 'source');
        mkdirSync(source, { recursive: true });
        mkdirSync(target, { recursive: true });
        writeFileSync(join(source, 'template.avt.ts'), 'source');
        writeFileSync(join(source, 'new.txt'), 'new');
        writeFileSync(join(target, 'old.txt'), 'old');
        writeFileSync(join(destination, 'neighbor.txt'), 'neighbor');

        const oldServer = GenericServer.instance;
        const oldCreate = TemplateScript.create;
        t.after(() => {
            GenericServer.instance = oldServer;
            TemplateScript.create = oldCreate;
            rmSync(root, { recursive: true, force: true });
        });

        let removeSource = true;
        let reloads = 0;
        const messages = [];
        const errors = [];
        GenericServer.instance = {
            _extensionPath: extension,
            _template: { workspaces: [root] },
            connection: {
                Select: async () => ({ label: 'Local' }),
                SelectMultiple: async items => {
                    if (removeSource) rmSync(source, { recursive: true, force: true });
                    return items;
                },
                showInformationMessage: message => messages.push(message),
                showErrorMessage: message => errors.push(message),
            },
        };
        TemplateScript.create = async () => ({ name: 'Source' });
        const manager = Object.create(TemplateManager.prototype);
        manager.projectPath = [destination];
        manager.templatePath = [destination];
        manager.reloadProjects = async () => { reloads++; };
        manager.reloadTemplates = async () => { reloads++; };
        const importLocal = () => kind === 'projects'
            ? manager.selectProjectToImport(false)
            : manager.selectTemplateToImport();

        if (kind === 'projects') await assert.rejects(importLocal());
        else await importLocal();
        assert.equal(readFileSync(join(target, 'old.txt'), 'utf8'), 'old');
        assert.equal(existsSync(join(target, 'new.txt')), false);
        assert.equal(readFileSync(join(destination, 'neighbor.txt'), 'utf8'), 'neighbor');
        assert.equal(reloads, 0);
        assert.deepEqual(messages, []);
        if (kind === 'templates') {
            assert.equal(errors.length, 1);
            assert.match(errors[0], /^Template Source failed: /);
        }

        removeSource = false;
        mkdirSync(source, { recursive: true });
        writeFileSync(join(source, 'template.avt.ts'), 'source');
        writeFileSync(join(source, 'new.txt'), 'new');
        await importLocal();
        assert.equal(readFileSync(join(target, 'new.txt'), 'utf8'), 'new');
        assert.equal(existsSync(join(target, 'old.txt')), false);
        assert.equal(reloads, 1);
        assert.deepEqual(messages, [kind === 'projects' ? 'Projects installed' : 'Templates installed']);
    });
}
