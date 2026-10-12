import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('template child failure after writing derived variables cleans its generated script', { timeout: 15_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-recovery-'));
    const templateDir = join(root, 'template');
    const destination = join(root, 'destination');
    mkdirSync(templateDir);
    mkdirSync(destination);
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(templateDir, 'result.txt'), '${{name}}/${{kind}}');
    const source = [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Recovery fixture' }; }",
        '  async run() {',
        "    const name = await this.input({ title: 'Name' });",
        "    const kind = name + '-kind';",
        "    this.registerVar('name', name);",
        "    this.registerVar('kind', kind);",
        '    await this.writeFile();',
        '    process.exit(2);',
        '  }',
        '}',
    ].join('\n');
    writeFileSync(config, source);

    const oldServer = GenericServer.instance;
    const oldMemory = TemplateScript.memory;
    const oldProjects = ProjectManager.instance;
    const oldFiles = FilesManager.instance;
    const answers = ['First'];
    const notifications = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            Input: async () => answers.shift(),
            sendNotification: (...args) => notifications.push(args),
            error: () => {},
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: () => {} };
    try {
        const first = await TemplateScript.create(config);
        assert.ok(first);
        await first.init(destination, root);
        assert.equal(readFileSync(join(destination, 'result.txt'), 'utf8'), 'First/First-kind');
        assert.deepEqual(readdirSync(join(root, 'temp')), []);
        assert.deepEqual(notifications, []);

        assert.deepEqual(readdirSync(join(root, 'temp')), []);
        assert.deepEqual(notifications, []);
        assert.deepEqual(answers, []);
        assert.equal(existsSync(join(destination, 'template.avt.ts')), false);

        const secondPreparation = first.prepareScript();
        const result = await Promise.race([
            secondPreparation.then(() => 'resolved'),
            new Promise(resolve => setTimeout(() => resolve('pending'), 100)),
        ]);
        assert.equal(result, 'pending');
    } finally {
        GenericServer.instance = oldServer;
        TemplateScript.memory = oldMemory;
        ProjectManager.instance = oldProjects;
        FilesManager.instance = oldFiles;
        rmSync(root, { recursive: true, force: true });
    }
});
