import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('real template can regenerate into an existing destination, then cancel after an earlier write', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-lifecycle-'));
    const templateDir = join(root, 'template');
    const destination = join(root, 'destination');
    mkdirSync(templateDir);
    mkdirSync(destination);
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(templateDir, 'Main.lib.avt'), 'class ${{name}} {}');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Lifecycle fixture' }; }",
        '  async run() {',
        "    const name = await this.input({ title: 'Name' });",
        '    if (name === null) return;',
        "    this.registerVar('name', name);",
        '    await this.writeFile();',
        "    const next = await this.input({ title: 'Continue' });",
        '    if (next === null) return;',
        "    this.openFile('Main.lib.avt');",
        '  }',
        '}',
    ].join('\n'));

    const previousServer = GenericServer.instance;
    const previousMemory = TemplateScript.memory;
    const previousProjects = ProjectManager.instance;
    const previousFiles = FilesManager.instance;
    const inputs = ['First', 'yes', 'Second', 'yes', 'Third', null];
    const registered = [];
    const notifications = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            Input: async ({ title }) => {
                assert.ok(title === 'Name' || title === 'Continue');
                return inputs.shift();
            },
            sendNotification: (...args) => notifications.push(args),
            error: value => errors.push(String(value)),
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };
    try {
        const script = await TemplateScript.create(config);
        assert.ok(script, errors.join('\n'));

        await script.init(destination, root);
        assert.equal(readFileSync(join(destination, 'Main.lib.avt'), 'utf8'), 'class First {}');
        assert.equal(registered.length, 1);
        assert.equal(notifications.length, 1);

        await script.init(destination, root);
        assert.equal(readFileSync(join(destination, 'Main.lib.avt'), 'utf8'), 'class Second {}');
        assert.equal(registered.length, 2);
        assert.equal(notifications.length, 2);

        await script.init(destination, root);
        assert.equal(readFileSync(join(destination, 'Main.lib.avt'), 'utf8'), 'class Third {}');
        assert.equal(registered.length, 3);
        assert.equal(notifications.length, 2);
        assert.deepEqual(inputs, []);
        assert.equal(existsSync(join(destination, 'template.avt.ts')), false);
        assert.deepEqual(errors, []);
    } finally {
        GenericServer.instance = previousServer;
        TemplateScript.memory = previousMemory;
        ProjectManager.instance = previousProjects;
        FilesManager.instance = previousFiles;
        rmSync(root, { recursive: true, force: true });
    }
});
