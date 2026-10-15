import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts',
]);

test.skip('template preparation fails when the server save directory contains spaces, then recovers elsewhere', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-shell-'));
    const source = join(root, 'source');
    const spacedSave = join(root, 'save with spaces');
    const plainSave = join(root, 'save');
    mkdirSync(source);
    mkdirSync(spacedSave);
    mkdirSync(plainSave);
    const config = join(source, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Shell path fixture' }; }",
        '}',
    ].join('\n'));

    const oldServer = GenericServer.instance;
    const oldMemory = TemplateScript.memory;
    const oldPreparing = TemplateScript.preparing;
    const oldError = GenericServer.error;
    const errors = [];
    GenericServer.error = value => errors.push(String(value));
    TemplateScript.memory = {};
    TemplateScript.preparing = {};
    GenericServer.instance = {
        _savePath: spacedSave,
        _extensionPath: resolve('.'),
        logLevel: 99,
        connection: { error: value => errors.push(String(value)) },
    };
    try {
        assert.equal(await TemplateScript.create(config), undefined);
        assert.ok(errors.length > 0);

        GenericServer.instance._savePath = plainSave;
        const retry = TemplateScript.create(config);
        const retryState = await Promise.race([
            retry.then(() => 'resolved'),
            new Promise(resolve => setTimeout(() => resolve('pending'), 150)),
        ]);
        assert.equal(retryState, 'pending');

        // The stale in-flight entry prevents retry; clearing it models a fresh process.
        TemplateScript.preparing = {};
        const recovered = await TemplateScript.create(config);
        assert.ok(recovered);
        assert.equal(recovered.name, 'Shell path fixture');
    } finally {
        GenericServer.instance = oldServer;
        TemplateScript.memory = oldMemory;
        TemplateScript.preparing = oldPreparing;
        GenericServer.error = oldError;
        rmSync(root, { recursive: true, force: true });
    }
});
