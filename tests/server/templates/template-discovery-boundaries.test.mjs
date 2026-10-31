import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('template discovery stops at a script root while traversing sibling categories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-boundary-'));
    const parent = join(root, 'parent');
    const hidden = join(parent, 'nested');
    const sibling = join(root, 'sibling', 'nested');
    for (const folder of [parent, hidden, sibling]) mkdirSync(folder, { recursive: true });
    const parentScript = join(parent, 'template.avt.ts');
    const hiddenScript = join(hidden, 'template.avt.ts');
    const siblingScript = join(sibling, 'template.avt.ts');
    for (const path of [parentScript, hiddenScript, siblingScript]) writeFileSync(path, 'fixture');
    const originalCreate = TemplateScript.create;
    const seen = [];
    TemplateScript.create = async config => {
        seen.push(config);
        return { name: config === parentScript ? 'Parent' : config === hiddenScript ? 'Hidden' : 'Sibling' };
    };
    try {
        const result = await Object.create(TemplateManager.prototype).readTemplates([root]);
        assert.equal(result.nb, 2);
        assert.deepEqual(Object.keys(result.templates).sort(), ['Parent', 'Sibling']);
        assert.deepEqual(new Set(seen), new Set([parentScript, siblingScript]));
    } finally {
        TemplateScript.create = originalCreate;
        rmSync(root, { recursive: true, force: true });
    }
});

test('template query passes destination and workspace to eligibility and rejects an empty result', async () => {
    const manager = Object.create(TemplateManager.prototype);
    manager.workspaces = ['D:\\work'];
    const script = Object.create(TemplateScript.prototype);
    script.description = 'Filtered';
    const checks = [];
    script.isAllowed = async (...args) => { checks.push(args); return false; };
    const previous = GenericServer.instance;
    let shown;
    GenericServer.instance = { connection: { Select: async items => {
        shown = items;
        return { label: 'Custom action', detail: 'Create from scratch' };
    } } };
    try {
        const custom = { label: 'Custom action', detail: 'Create from scratch' };
        await assert.rejects(manager.query('D:\\work\\src', { Hidden: script }, [custom]),
            /No templates available for this location/);
        assert.deepEqual(checks, [['D:\\work\\src', 'D:\\work']]);
        assert.equal(shown, undefined);
    } finally {
        GenericServer.instance = previous;
    }
});
