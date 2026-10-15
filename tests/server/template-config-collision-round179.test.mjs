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

test('real template writes nested and root config files after sources and opens both paths', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-config-collision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'destination');
    mkdirSync(join(templateDir, 'src'), { recursive: true });
    mkdirSync(destination);
    writeFileSync(join(templateDir, '!aventus.conf.avt'), '{"source":"prefixed"}');
    writeFileSync(join(templateDir, 'aventus.conf.avt'), '{"source":"plain"}');
    writeFileSync(join(templateDir, 'src', '!aventus.conf.avt'), '{"source":"nested"}');
    writeFileSync(join(templateDir, 'src', 'Main.lib.avt'), 'export class ${{name}} {}');
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Config collision fixture' }; }",
        '  async run() {',
        "    this.registerVar('name', 'Panel');",
        '    await this.writeFile();',
        "    this.openFile(['aventus.conf.avt', 'src/aventus.conf.avt']);",
        '  }',
        '}',
    ].join('\n'));

    const previous = {
        server: GenericServer.instance, memory: TemplateScript.memory,
        projects: ProjectManager.instance, files: FilesManager.instance,
    };
    t.after(() => {
        GenericServer.instance = previous.server;
        TemplateScript.memory = previous.memory;
        ProjectManager.instance = previous.projects;
        FilesManager.instance = previous.files;
    });
    const registered = [];
    const notifications = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            error: value => errors.push(String(value)),
            sendNotification: (...args) => notifications.push(args),
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };

    const script = await TemplateScript.create(config);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);

    assert.equal(readFileSync(join(destination, 'aventus.conf.avt'), 'utf8'), '{"source":"plain"}');
    assert.equal(readFileSync(join(destination, 'src', 'aventus.conf.avt'), 'utf8'), '{"source":"nested"}');
    assert.equal(readFileSync(join(destination, 'src', 'Main.lib.avt'), 'utf8'), 'export class Panel {}');
    assert.equal(existsSync(join(destination, '!aventus.conf.avt')), false);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').slice(-2).join('/')),
        ['src/Main.lib.avt', 'destination/aventus.conf.avt', 'src/aventus.conf.avt']);
    assert.deepEqual(notifications, [
        ['aventus/openfile', [pathToFileURL(join(destination, 'aventus.conf.avt')).href]],
        ['aventus/openfile', [pathToFileURL(join(destination, 'src', 'aventus.conf.avt')).href]],
    ]);
    assert.deepEqual(errors, []);
});
