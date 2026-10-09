import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

function git(...args) {
    const result = spawnSync('git', args, { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });
    assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
}

for (const kind of ['template', 'project', 'global']) {
    test(`${kind} Git import reloads its registry and uninstall removes the cloned directory`, async () => {
        const root = mkdtempSync(join(process.cwd(), `aventus-git-${kind}-`));
        const source = join(root, 'fixture.git');
        const destination = join(root, 'installed');
        const clone = join(destination, 'fixture');
        mkdirSync(source);
        mkdirSync(destination);
        writeFileSync(join(source, 'template.avt.ts'), 'fixture');
        writeFileSync(join(source, 'content.txt'), kind);
        git('init', source);
        git('-C', source, 'add', '.');
        git('-C', source, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture');

        const previousServer = GenericServer.instance;
        const previousCreate = TemplateScript.create;
        const manager = Object.create(TemplateManager.prototype);
        manager.templatePath = [destination];
        manager.projectPath = [destination];
        manager.globalPath = [destination];
        manager.loadedTemplates = {};
        manager.loadedProjects = {};
        manager.loadedGlobal = {};
        const selections = [];
        GenericServer.instance = {
            connection: {
                Select: async items => { selections.push(items.map(item => item.label)); return { label: 'Git' }; },
                Input: async options => { assert.equal(options.title, 'Git url'); return source; },
                SelectMultiple: async items => {
                    assert.deepEqual(items.map(item => item.label), ['Fixture']);
                    return items;
                },
                showInformationMessage() {},
            },
        };
        TemplateScript.create = async config => {
            const script = Object.create(TemplateScript.prototype);
            script.name = 'Fixture';
            script.config = config;
            return script;
        };

        try {
            if (kind === 'template') await manager.selectTemplateToImport();
            else if (kind === 'project') await manager.selectProjectToImport(false);
            else await manager.selectGlobalToImport(false);

            assert.deepEqual(selections, [['Local', 'Git']]);
            assert.equal(readFileSync(join(clone, 'content.txt'), 'utf8'), kind);
            const registry = kind === 'template' ? manager.getGeneralTemplates()
                : kind === 'project' ? manager.getGeneralProjects() : manager.getGeneralGlobal();
            assert.ok(registry.Fixture instanceof TemplateScript);
            assert.equal(registry.Fixture.config, join(clone, 'template.avt.ts'));

            if (kind === 'template') await manager.selectTemplateToUninstall();
            else if (kind === 'project') await manager.selectProjectToUninstall();
            else await manager.selectGlobalToUninstall();
            assert.equal(existsSync(clone), false);
            const after = kind === 'template' ? manager.getGeneralTemplates()
                : kind === 'project' ? manager.getGeneralProjects() : manager.getGeneralGlobal();
            assert.deepEqual(after, {});
        } finally {
            TemplateScript.create = previousCreate;
            GenericServer.instance = previousServer;
            rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
        }
    });
}
