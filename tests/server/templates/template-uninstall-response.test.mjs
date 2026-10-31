import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('template uninstall accepts only offered templates inside a registered root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-uninstall-selection-'));
    const installed = join(root, 'installed', 'known');
    const unrelated = join(root, 'unrelated');
    mkdirSync(installed, { recursive: true });
    mkdirSync(unrelated);
    const config = join(installed, 'template.avt.ts');
    writeFileSync(config, 'known');
    writeFileSync(join(unrelated, 'template.avt.ts'), 'not installed');

    const script = Object.assign(Object.create(TemplateScript.prototype), { name: 'Known', config });
    const manager = Object.create(TemplateManager.prototype);
    manager.loadedTemplates = { Known: script };
    manager.templatePath = [join(root, 'installed')];
    let reloads = 0;
    const messages = [];
    let response = [{ label: 'Known', detail: join(unrelated, 'template.avt.ts') }];
    let afterSelect = () => {};
    manager.reloadTemplates = async () => { reloads++; };
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: {
        SelectMultiple: async choices => {
            assert.equal(choices.length, 1);
            afterSelect();
            return response;
        },
        showInformationMessage: message => messages.push(message),
    } };
    try {
        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(installed), true);
        assert.equal(existsSync(unrelated), true);
        assert.equal(reloads, 0);
        assert.deepEqual(messages, []);

        response = [{ label: 'Known', detail: config }];
        afterSelect = () => { manager.loadedTemplates = {}; };
        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(installed), true);
        assert.equal(reloads, 0);

        afterSelect = () => {};
        const outsideConfig = join(unrelated, 'template.avt.ts');
        manager.loadedTemplates = { Outside: Object.assign(Object.create(TemplateScript.prototype), { name: 'Outside', config: outsideConfig }) };
        response = [{ label: 'Outside', detail: outsideConfig }];
        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(unrelated), true);
        assert.equal(reloads, 0);

        manager.loadedTemplates = { Known: script };
        response = [{ label: 'Known', detail: config }];
        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(installed), false);
        assert.equal(existsSync(unrelated), true);
        assert.equal(reloads, 1);
        assert.deepEqual(messages, ['Templates deleted']);
    } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
