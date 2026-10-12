import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

function git(...args) {
    const result = spawnSync('git', args, { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });
    assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
}

function setup(kind, destination) {
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [destination];
    manager.projectPath = [destination];
    manager.globalPath = [destination];
    manager.loadedTemplates = {};
    manager.loadedProjects = {};
    manager.loadedGlobal = {};
    return {
        manager,
        import: kind === 'template' ? () => manager.selectTemplateToImport()
            : kind === 'project' ? () => manager.selectProjectToImport(false)
                : () => manager.selectGlobalToImport(false),
        registry: () => kind === 'template' ? manager.getGeneralTemplates()
            : kind === 'project' ? manager.getGeneralProjects() : manager.getGeneralGlobal(),
    };
}

test('Git template import refuses an occupied clone destination and preserves installed content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-git-conflict-'));
    const source = join(root, 'fixture.git');
    const destination = join(root, 'installed');
    const clone = join(destination, 'fixture');
    mkdirSync(source);
    mkdirSync(destination);
    writeFileSync(join(source, 'template.avt.ts'), 'fixture');
    writeFileSync(join(source, 'content.txt'), 'first');
    git('init', source);
    git('-C', source, 'add', '.');
    git('-C', source, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'first');

    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    const { import: importTemplate, registry } = setup('template', destination);
    GenericServer.instance = {
        connection: {
            Select: async () => ({ label: 'Git' }),
            Input: async () => source,
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
        await importTemplate();
        assert.equal(readFileSync(join(clone, 'content.txt'), 'utf8'), 'first');
        writeFileSync(join(source, 'content.txt'), 'second');
        git('-C', source, 'add', '.');
        git('-C', source, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'second');
        await assert.rejects(importTemplate(), /git clone|already exists/i);
        assert.equal(readFileSync(join(clone, 'content.txt'), 'utf8'), 'first');
        assert.equal(registry().Fixture.config, join(clone, 'template.avt.ts'));
    } finally {
        TemplateScript.create = previousCreate;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
});

test('Git global import loads nested scripts and uninstall preserves the unselected sibling after reload', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-git-nested-'));
    const source = join(root, 'fixture.git');
    const destination = join(root, 'installed');
    const clone = join(destination, 'fixture');
    for (const folder of [join(source, 'first'), join(source, 'second'), destination]) mkdirSync(folder, { recursive: true });
    for (const name of ['first', 'second']) {
        writeFileSync(join(source, name, 'template.avt.ts'), name);
        writeFileSync(join(source, name, 'content.txt'), name);
    }
    git('init', source);
    git('-C', source, 'add', '.');
    git('-C', source, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'nested');

    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    const { manager, import: importGlobal, registry } = setup('global', destination);
    const messages = [];
    GenericServer.instance = {
        connection: {
            Select: async () => ({ label: 'Git' }),
            Input: async () => source,
            SelectMultiple: async items => items.filter(item => item.label === 'First'),
            showInformationMessage: message => messages.push(message),
        },
    };
    TemplateScript.create = async config => {
        const script = Object.create(TemplateScript.prototype);
        script.name = config.includes('first') ? 'First' : 'Second';
        script.config = config;
        return script;
    };
    try {
        await importGlobal();
        assert.equal(manager.getGeneralGlobalLength(), 2);
        assert.ok(registry().First instanceof TemplateScript);
        assert.ok(registry().Second instanceof TemplateScript);
        await manager.selectGlobalToUninstall();
        assert.equal(existsSync(join(clone, 'first')), false);
        assert.equal(readFileSync(join(clone, 'second', 'content.txt'), 'utf8'), 'second');
        assert.deepEqual(Object.keys(registry()), ['Second']);
        assert.equal(manager.getGeneralGlobalLength(), 1);
        assert.deepEqual(messages, ['Global templates deleted']);
    } finally {
        TemplateScript.create = previousCreate;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
});
