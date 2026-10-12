import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { TemplateScript } = await loadServerModule('files/Template.ts');

test('a cached template script throws ENOENT when its source file disappears', async () => {
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
        await assert.rejects(TemplateScript.create(config), error => error?.code === 'ENOENT');
        assert.equal(TemplateScript.memory[config], first);
    } finally {
        TemplateScript.memory = previousMemory;
        TemplateScript.prototype.prepareScript = originalPrepare;
        rmSync(root, { recursive: true, force: true });
    }
});
