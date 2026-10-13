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

test('real component template replaces path/content variables, conditions and blocks', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-variables-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(templateDir);
    mkdirSync(destination);
    mkdirSync(join(templateDir, '${{name}}'));
    mkdirSync(join(templateDir, '.git'));
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(templateDir, '${{name}}', '${{name}}.wcl.avt'),
        'export class ${{name}} {}\n#if{{enabled}}enabled#end{{enabled}}\n#{{custom}}body#{{custom/}}');
    writeFileSync(join(templateDir, '${{name}}', 'disabled.txt'), '#if{{disabled}}hidden#end{{disabled}}');
    writeFileSync(join(templateDir, '${{name}}', '.empty'), 'ignored');
    writeFileSync(join(templateDir, '.git', 'config'), 'ignored');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Variable fixture', isProject: false }; }",
        '  async run() {',
        "    this.registerVar('name', 'Panel');",
        "    this.registerIf('enabled', true);",
        "    this.registerIf('disabled', false);",
        "    this.registerBlock('custom', { before: () => '<', after: () => '>' });",
        '    await this.writeFile();',
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

    const output = join(destination, 'Panel', 'Panel.wcl.avt');
    assert.equal(readFileSync(output, 'utf8'), 'export class Panel {}\nenabled\n<body>');
    assert.equal(readFileSync(join(destination, 'Panel', 'disabled.txt'), 'utf8'), '');
    assert.equal(existsSync(join(destination, 'Panel', '.empty')), false);
    assert.equal(existsSync(join(destination, '.git')), false);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['Panel.wcl.avt']);
    assert.deepEqual(errors, []);
});
