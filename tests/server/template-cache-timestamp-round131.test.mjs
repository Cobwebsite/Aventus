import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts',
]);

test('template metadata cache retains the old script when edited content has an older timestamp', { timeout: 15_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-older-mtime-'));
    const config = join(root, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    const source = name => [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        `  meta() { return { name: '${name}' }; }`,
        '  async run() {}',
        '}',
    ].join('\n');
    const previousServer = GenericServer.instance;
    const previousMemory = TemplateScript.memory;
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: () => {} },
    };
    TemplateScript.memory = {};
    try {
        writeFileSync(config, source('Original'));
        const first = await TemplateScript.create(config);
        assert.equal(first.name, 'Original');

        const originalTime = statSync(config).mtime;
        writeFileSync(config, source('Edited'));
        const older = new Date(originalTime.getTime() - 60_000);
        utimesSync(config, older, older);
        const second = await TemplateScript.create(config);
        assert.equal(second, first);
        assert.equal(second.name, 'Original');
    } finally {
        GenericServer.instance = previousServer;
        TemplateScript.memory = previousMemory;
        rmSync(root, { recursive: true, force: true });
    }
});
