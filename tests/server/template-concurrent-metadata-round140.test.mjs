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

test('concurrent metadata requests resolve, but a later refresh remains pending', { timeout: 10_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-concurrent-'));
    const config = join(root, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    const source = name => [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        `  meta() { return { name: '${name}', description: '${name} description', allowQuick: true }; }`,
        '  async run() {}',
        '}',
    ].join('\n');
    const previousServer = GenericServer.instance;
    const previousMemory = TemplateScript.memory;
    const previousPreparing = TemplateScript.preparing;
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: error => errors.push(String(error)) },
    };
    TemplateScript.memory = {};
    TemplateScript.preparing = {};
    try {
        writeFileSync(config, source('First'));
        const initial = await Promise.all(Array.from({ length: 4 }, () => TemplateScript.create(config)));
        assert.ok(initial.every(template => template?.name === 'First'));
        assert.ok(initial.every(template => template.description === 'First description' && template.allowQuick));
        assert.ok(initial.includes(TemplateScript.memory[config]));

        const originalTime = statSync(config).mtime;
        writeFileSync(config, source('Second'));
        const newer = new Date(originalTime.getTime() + 60_000);
        utimesSync(config, newer, newer);
        const refreshed = TemplateScript.create(config);
        const outcome = await Promise.race([
            refreshed.then(() => 'resolved', () => 'rejected'),
            new Promise(resolve => setTimeout(() => resolve('pending'), 150)),
        ]);
        assert.equal(outcome, 'pending');
        assert.equal(TemplateScript.memory[config].name, 'First');
        assert.deepEqual(errors, []);
    } finally {
        GenericServer.instance = previousServer;
        TemplateScript.memory = previousMemory;
        TemplateScript.preparing = previousPreparing;
        rmSync(root, { recursive: true, force: true });
    }
});
