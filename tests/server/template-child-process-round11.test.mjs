import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts',
]);

test('template script loads metadata and runs in a real child process', { timeout: 15_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-child-'));
    const config = join(root, 'template.avt.ts');
    const destination = join(root, 'destination');
    const workspace = join(root, 'workspace');
    mkdirSync(destination);
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, `
        import { writeFileSync } from 'node:fs';
        import { join } from 'node:path';
        import { AventusTemplate } from '${base}';
        export class Template extends AventusTemplate {
            meta() { return { name: 'Child fixture', version: '2.1.0', description: 'real process', allowQuick: true }; }
            isAllowed() { return true; }
            async run(destination) { writeFileSync(join(destination, 'created.txt'), this.workspacePath); }
        }
    `);
    const previousServer = GenericServer.instance;
    const previousMemory = TemplateScript.memory;
    const errors = [];
    GenericServer.instance = {
        _savePath: root,
        _extensionPath: resolve('.'),
        logLevel: 99,
        connection: { error: value => errors.push(String(value)) },
    };
    TemplateScript.memory = {};
    try {
        const script = await TemplateScript.create(config);
        assert.ok(script, errors.join('\n'));
        assert.equal(script.name, 'Child fixture');
        assert.equal(script.version, '2.1.0');
        assert.equal(script.description, 'real process');
        assert.equal(script.allowQuick, true);
        assert.equal(await script.isAllowed(destination, workspace), true);
        assert.equal(script.containsError, false);
        await script.init(destination, workspace);
        assert.equal(readFileSync(join(destination, 'created.txt'), 'utf8'), workspace);
        assert.deepEqual(readdirSync(join(root, 'temp')), []);
        assert.deepEqual(errors, []);
    } finally {
        TemplateScript.memory = previousMemory;
        GenericServer.instance = previousServer;
        rmSync(root, { recursive: true, force: true });
    }
});
