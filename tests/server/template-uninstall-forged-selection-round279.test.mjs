import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

for (const [kind, registry, operation, reload, notification] of [
    ['project', 'loadedProjects', 'selectProjectToUninstall', 'reloadProjects', 'Projects deleted'],
    ['global template', 'loadedGlobal', 'selectGlobalToUninstall', 'reloadGlobal', 'Global templates deleted'],
]) {
    test(`${kind} uninstall ignores a foreign selection before a valid retry`, async t => {
        const root = mkdtempSync(join(tmpdir(), 'aventus-uninstall-forged-'));
        const installed = join(root, 'installed', 'known');
        const foreign = join(root, 'foreign');
        mkdirSync(installed, { recursive: true });
        mkdirSync(foreign);
        const config = join(installed, 'template.avt.ts');
        const foreignConfig = join(foreign, 'template.avt.ts');
        writeFileSync(config, 'installed');
        writeFileSync(foreignConfig, 'foreign');

        const previous = GenericServer.instance;
        t.after(() => {
            GenericServer.instance = previous;
            rmSync(root, { recursive: true, force: true });
        });

        const script = Object.assign(Object.create(TemplateScript.prototype), { name: 'Known', config });
        const manager = Object.create(TemplateManager.prototype);
        manager[registry] = { Known: script };
        manager[kind === 'project' ? 'projectPath' : 'globalPath'] = [join(root, 'installed')];
        let reloads = 0;
        manager[reload] = async () => { reloads++; };
        let selected = { label: 'Foreign', detail: foreignConfig };
        let afterSelect = () => {};
        const messages = [];
        GenericServer.instance = { connection: {
            SelectMultiple: async items => {
                assert.deepEqual(items, [{ label: 'Known', detail: config }]);
                afterSelect();
                return [selected];
            },
            showInformationMessage: message => messages.push(message),
        } };

        await manager[operation]();
        assert.equal(existsSync(foreign), true);
        assert.equal(existsSync(installed), true);
        assert.equal(reloads, 0);
        assert.deepEqual(messages, []);

        selected = { label: 'Known', detail: config };
        afterSelect = () => { manager[registry] = {}; };
        await manager[operation]();
        assert.equal(existsSync(installed), true);
        assert.equal(reloads, 0);

        manager[registry] = { Known: script };
        afterSelect = () => {};
        await manager[operation]();
        assert.equal(existsSync(installed), false);
        assert.equal(reloads, 1);
        assert.deepEqual(messages, [notification]);
    });
}
