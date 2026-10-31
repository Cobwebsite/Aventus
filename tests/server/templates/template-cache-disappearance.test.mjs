import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { TemplateScript } = await loadServerModule('files/Template.ts');

test('a missing template script is removed from cache and can be loaded again', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-disappearance-'));
    const config = join(root, 'template.avt.ts');
    writeFileSync(config, 'fixture');
    const previousMemory = TemplateScript.memory;
    const originalPrepare = TemplateScript.prototype.prepareScript;
    TemplateScript.memory = {};
    TemplateScript.prototype.prepareScript = async function () {
        return { name: 'Fixture', version: '1.0.0', description: '' };
    };
    try {
        const first = await TemplateScript.create(config);
        assert.equal(first.name, 'Fixture');
        rmSync(config);
        assert.equal(await TemplateScript.create(config), undefined);
        assert.equal(TemplateScript.memory[config], undefined);
        writeFileSync(config, 'fixture restored');
        const restored = await TemplateScript.create(config);
        assert.notEqual(restored, first);
        assert.equal(restored.name, 'Fixture');
    } finally {
        TemplateScript.memory = previousMemory;
        TemplateScript.prototype.prepareScript = originalPrepare;
        rmSync(root, { recursive: true, force: true });
    }
});
