import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { TemplateScript } = await loadServerModule('files/Template.ts');

test('template script cache reuses unchanged metadata and reloads after a newer modification time', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-cache-'));
    const config = join(root, 'template.avt.ts');
    writeFileSync(config, 'fixture');
    const originalPrepare = TemplateScript.prototype.prepareScript;
    const previousMemory = TemplateScript.memory;
    let loads = 0;
    TemplateScript.memory = {};
    TemplateScript.prototype.prepareScript = async function () {
        loads++;
        return { name: `Template ${loads}`, version: '1.0.0', description: '', isAllow: false };
    };
    try {
        const first = await TemplateScript.create(config);
        const again = await TemplateScript.create(config);
        assert.equal(first, again);
        assert.equal(loads, 1);
        assert.equal(first.name, 'Template 1');

        const newer = new Date(first.lastModified.getTime() + 5000);
        utimesSync(config, newer, newer);
        const refreshed = await TemplateScript.create(config);
        assert.notEqual(refreshed, first);
        assert.equal(refreshed.name, 'Template 2');
        assert.equal(loads, 2);
        assert.equal(await TemplateScript.create(config), refreshed);
        assert.equal(loads, 2);
    } finally {
        TemplateScript.prototype.prepareScript = originalPrepare;
        TemplateScript.memory = previousMemory;
        rmSync(root, { recursive: true, force: true });
    }
});

test('invalid updated template leaves the previous cached script available', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-cache-error-'));
    const config = join(root, 'template.avt.ts');
    writeFileSync(config, 'fixture');
    const originalPrepare = TemplateScript.prototype.prepareScript;
    const previousMemory = TemplateScript.memory;
    let loads = 0;
    TemplateScript.memory = {};
    TemplateScript.prototype.prepareScript = async function () {
        loads++;
        if (loads === 2) this.containsError = true;
        return { name: `Template ${loads}`, version: '1.0.0', description: '', isAllow: false };
    };
    try {
        const original = await TemplateScript.create(config);
        const newer = new Date(original.lastModified.getTime() + 5000);
        utimesSync(config, newer, newer);
        assert.equal(await TemplateScript.create(config), original);
        assert.equal(loads, 2);
        const recovered = await TemplateScript.create(config);
        assert.notEqual(recovered, original);
        assert.equal(recovered.name, 'Template 3');
        assert.equal(loads, 3);
    } finally {
        TemplateScript.prototype.prepareScript = originalPrepare;
        TemplateScript.memory = previousMemory;
        rmSync(root, { recursive: true, force: true });
    }
});
