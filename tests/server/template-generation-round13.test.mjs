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

test('real template process writes substituted files, skips defaults and reports generated Aventus files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-generation-'));
    const templateDir = join(root, 'template');
    const destination = join(root, 'destination');
    mkdirSync(join(templateDir, 'src', '${{name}}'), { recursive: true });
    mkdirSync(join(templateDir, '.git'), { recursive: true });
    mkdirSync(destination);
    writeFileSync(join(templateDir, '.git', 'ignored.txt'), 'ignored');
    writeFileSync(join(templateDir, '.empty'), 'ignored');
    writeFileSync(join(templateDir, 'src', '${{name}}', 'Main.lib.avt'), 'class ${{name}} {}');
    writeFileSync(join(templateDir, 'README.txt'), 'Hello ${{name}}');
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Generated fixture' }; }",
        '  async run() {',
        "    const name = await this.input({ title: 'Name' });",
        "    this.registerVar('name', name);",
        '    await this.writeFile();',
        "    this.openFile('src/' + name + '/Main.lib.avt');",
        '  }',
        '}',
    ].join('\n'));

    const oldServer = GenericServer.instance;
    const oldMemory = TemplateScript.memory;
    const oldProjects = ProjectManager.instance;
    const oldFiles = FilesManager.instance;
    const registered = [];
    const notifications = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            Input: async options => { assert.equal(options.title, 'Name'); return 'Widget'; },
            sendNotification: (...args) => notifications.push(args),
            error: value => errors.push(String(value)),
        },
    };
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };
    TemplateScript.memory = {};
    try {
        const script = await TemplateScript.create(config);
        assert.ok(script, errors.join('\n'));
        await script.init(destination, root);
        assert.equal(readFileSync(join(destination, 'README.txt'), 'utf8'), 'Hello Widget');
        assert.equal(readFileSync(join(destination, 'src', 'Widget', 'Main.lib.avt'), 'utf8'), 'class Widget {}');
        assert.equal(existsSync(join(destination, '.git')), false);
        assert.equal(existsSync(join(destination, '.empty')), false);
        assert.equal(existsSync(join(destination, 'template.avt.ts')), false);
        assert.equal(registered.length, 1);
        assert.match(registered[0], /src\/Widget\/Main\.lib\.avt$/);
        assert.equal(notifications.length, 1);
        assert.equal(notifications[0][0], 'aventus/openfile');
        assert.match(notifications[0][1][0], /src\/Widget\/Main\.lib\.avt$/);
        assert.deepEqual(errors, []);
    } finally {
        GenericServer.instance = oldServer;
        TemplateScript.memory = oldMemory;
        ProjectManager.instance = oldProjects;
        FilesManager.instance = oldFiles;
        rmSync(root, { recursive: true, force: true });
    }
});
