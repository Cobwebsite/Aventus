import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts',
]);

test('template registry merges distinct names from installed and configured directories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-sources-'));
    const installed = join(root, 'installed', 'card');
    const custom = join(root, 'custom', 'table');
    mkdirSync(installed, { recursive: true });
    mkdirSync(custom, { recursive: true });
    const installedScript = join(installed, 'template.avt.ts');
    const customScript = join(custom, 'template.avt.ts');
    writeFileSync(installedScript, 'placeholder');
    writeFileSync(customScript, 'placeholder');
    const oldCreate = TemplateScript.create;
    TemplateScript.create = async path => ({
        name: path === installedScript ? 'Cards.Button' : 'Tables.Data',
        config: path,
    });
    try {
        const current = Object.create(TemplateManager.prototype);
        const result = await current.readTemplates([join(root, 'installed'), join(root, 'custom')]);
        assert.equal(result.nb, 2);
        assert.equal(result.templates.Cards.Button.config, installedScript);
        assert.equal(result.templates.Tables.Data.config, customScript);
    } finally {
        TemplateScript.create = oldCreate;
        rmSync(root, { recursive: true, force: true });
    }
});

test('homonymous template winner currently follows completion order, not directory order', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-priority-'));
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(first);
    mkdirSync(second);
    const firstScript = join(first, 'template.avt.ts');
    const secondScript = join(second, 'template.avt.ts');
    writeFileSync(firstScript, 'placeholder');
    writeFileSync(secondScript, 'placeholder');
    const oldCreate = TemplateScript.create;
    try {
        for (const finalPath of [firstScript, secondScript]) {
            const release = new Map();
            const seen = [];
            TemplateScript.create = path => new Promise(resolve => {
                seen.push(path);
                release.set(path, () => resolve({ name: 'Shared.Card', config: path }));
            });
            const loading = Object.create(TemplateManager.prototype).readTemplates([first, second]);
            assert.deepEqual(seen, [firstScript, secondScript]);
            const initialPath = finalPath === firstScript ? secondScript : firstScript;
            release.get(initialPath)();
            release.get(finalPath)();
            const result = await loading;
            assert.equal(result.nb, 2);
            assert.equal(result.templates.Shared.Card.config, finalPath);
        }
    } finally {
        TemplateScript.create = oldCreate;
        rmSync(root, { recursive: true, force: true });
    }
});
