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

test('real project template callback edits generated content and filters a config before registration', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-callback-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'project');
    mkdirSync(templateDir);
    mkdirSync(destination);
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(templateDir, 'Main.lib.avt'), 'class ${{name}} {}');
    writeFileSync(join(templateDir, '!aventus.conf.avt'), '{"name":"${{name}}"}');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Callback fixture', isProject: true }; }",
        '  async run() {',
        "    this.registerVar('name', 'Panel');",
        '    await this.writeFile(info => {',
        "      if (info.isDir) return true;",
        "      if (info.relativePath.endsWith('!aventus.conf.avt')) return false;",
        "      info.content += '\\n// edited by callback';",
        '      return true;',
        '    });',
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
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: value => errors.push(String(value)) },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };

    const script = await TemplateScript.create(config);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);
    assert.equal(readFileSync(join(destination, 'Main.lib.avt'), 'utf8'), 'class Panel {}\n// edited by callback');
    assert.equal(existsSync(join(destination, 'aventus.conf.avt')), false);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['Main.lib.avt']);
    assert.deepEqual(errors, []);
});
