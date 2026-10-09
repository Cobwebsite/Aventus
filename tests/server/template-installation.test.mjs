import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

for (const kind of ['projects', 'templates']) {
    test(`local ${kind} import copies selected fixture and reloads its registry`, async () => {
        const root = mkdtempSync(join(tmpdir(), `aventus-import-${kind}-`));
        const source = join(root, 'extension', 'templates', kind, 'sample');
        const destination = join(root, 'installed');
        mkdirSync(source, { recursive: true });
        mkdirSync(destination);
        const config = join(source, 'template.avt.ts');
        writeFileSync(config, 'fixture');
        writeFileSync(join(source, 'result.txt'), 'installed content');
        const oldServer = GenericServer.instance;
        const oldCreate = TemplateScript.create;
        const messages = [];
        const selections = [];
        let reloads = 0;
        GenericServer.instance = {
            _extensionPath: join(root, 'extension'),
            _template: { workspaces: [root] },
            logLevel: 99,
            connection: {
                Select: async items => { selections.push(items.map(item => item.label)); return { label: 'Local' }; },
                SelectMultiple: async items => { selections.push(items.map(item => item.label)); return [{ label: 'Sample' }]; },
                showInformationMessage: message => messages.push(message),
            },
        };
        TemplateScript.create = async path => path === config ? { name: 'Sample', description: 'A fixture' } : undefined;
        const manager = Object.create(TemplateManager.prototype);
        manager.projectPath = [destination];
        manager.templatePath = [destination];
        manager.reloadProjects = async () => { reloads++; };
        manager.reloadTemplates = async () => { reloads++; };
        try {
            if (kind === 'projects') await manager.selectProjectToImport(false);
            else await manager.selectTemplateToImport();
            assert.equal(readFileSync(join(destination, 'sample', 'result.txt'), 'utf8'), 'installed content');
            assert.deepEqual(selections, [['Local', 'Git'], ['Sample']]);
            assert.equal(reloads, 1);
            assert.deepEqual(messages, [kind === 'projects' ? 'Projects installed' : 'Templates installed']);
        } finally {
            GenericServer.instance = oldServer;
            TemplateScript.create = oldCreate;
            rmSync(root, { recursive: true, force: true });
        }
    });
}

test('template uninstall removes selected nested entry but keeps unselected entry', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-uninstall-'));
    const oldServer = GenericServer.instance;
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(first);
    mkdirSync(second);
    writeFileSync(join(first, 'template.avt.ts'), 'first');
    writeFileSync(join(second, 'template.avt.ts'), 'second');
    const makeScript = (name, folder) => {
        const script = Object.create(TemplateScript.prototype);
        script.name = name;
        script.config = join(folder, 'template.avt.ts');
        return script;
    };
    const messages = [];
    let reloads = 0;
    GenericServer.instance = {
        connection: {
            SelectMultiple: async items => {
                assert.deepEqual(items.map(item => item.label), ['First', 'Second']);
                return [items[0]];
            },
            showInformationMessage: message => messages.push(message),
        },
    };
    const manager = Object.create(TemplateManager.prototype);
    manager.loadedTemplates = { group: { First: makeScript('First', first), Second: makeScript('Second', second) } };
    manager.reloadTemplates = async () => { reloads++; };
    try {
        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(first), false);
        assert.equal(existsSync(second), true);
        assert.equal(reloads, 1);
        assert.deepEqual(messages, ['Templates deleted']);
    } finally {
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});
