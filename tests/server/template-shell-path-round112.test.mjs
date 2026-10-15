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

test('template preparation supports spaces in the save directory and retries after failure', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-shell-'));
    const source = join(root, 'source');
    const spacedSave = join(root, 'save with spaces');
    mkdirSync(source);
    mkdirSync(spacedSave);
    const config = join(source, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Shell path fixture' }; }",
        '  isAllowed() { return true; }',
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
        writeFileSync(config, 'invalid template source');
        assert.equal(await TemplateScript.create(config), undefined);
        assert.ok(errors.length > 0);

        writeFileSync(config, [
            `import { AventusTemplate } from '${base}';`,
            'export class Template extends AventusTemplate {',
            "  meta() { return { name: 'Shell path fixture' }; }",
            '  isAllowed() { return true; }',
            '}',
        ].join('\n'));
        const recovered = await TemplateScript.create(config);
        assert.ok(recovered);
        assert.equal(recovered.name, 'Shell path fixture');
        assert.equal(await recovered.isAllowed(spacedSave, source), true);
    } finally {
        GenericServer.instance = oldServer;
        TemplateScript.memory = oldMemory;
        TemplateScript.preparing = oldPreparing;
        GenericServer.error = oldError;
        rmSync(root, { recursive: true, force: true });
    }
});
