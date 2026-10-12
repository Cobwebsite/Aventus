import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('template uninstall trusts a returned selection path outside the offered templates', async () => {
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
    let reloads = 0;
    manager.reloadTemplates = async () => { reloads++; };
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: {
        SelectMultiple: async choices => {
            assert.deepEqual(choices.map(choice => choice.detail), [config]);
            return [{ label: 'Known', detail: join(unrelated, 'template.avt.ts') }];
        },
        showInformationMessage() {},
    } };
    try {
        await manager.selectTemplateToUninstall();
        assert.equal(existsSync(installed), true);
        assert.equal(existsSync(unrelated), false);
        assert.equal(reloads, 1);
    } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
