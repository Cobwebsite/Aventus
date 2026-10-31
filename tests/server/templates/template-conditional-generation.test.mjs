import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('real template applies variables, conditions, blocks and write filter to generated paths and contents', { timeout: 15_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-conditions-'));
    const templateDir = join(root, 'template');
    const destination = join(root, 'destination');
    mkdirSync(join(templateDir, '${{name}}'), { recursive: true });
    mkdirSync(join(templateDir, 'denied'));
    mkdirSync(destination);
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(templateDir, '${{name}}', 'Main.lib.avt'), 'class ${{name}} {\n#if{{enabled}}enabled#end{{enabled}}\n#if{{disabled}}disabled#end{{disabled}}\n#{{custom}}body#{{custom/}}\n#{{namespace}}\tconst n = 1;#{{namespace/}}');
    writeFileSync(join(templateDir, 'denied', 'hidden.lib.avt'), 'hidden');
    writeFileSync(join(templateDir, 'omit.txt'), 'omit');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Conditional fixture' }; }",
        '  async run() {',
        "    this.registerVar('name', 'Widget');",
        "    this.registerIf('enabled', true);",
        "    this.registerIf('disabled', false);",
        "    this.registerBlock('custom', { before: () => '[', after: () => ']' });",
        "    await this.writeFile(info => !info.relativePath.includes('denied') && !info.relativePath.includes('omit.txt'));",
        '  }',
        '}',
    ].join('\n'));

    const oldServer = GenericServer.instance;
    const oldMemory = TemplateScript.memory;
    const oldProjects = ProjectManager.instance;
    const oldFiles = FilesManager.instance;
    const registered = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: value => errors.push(String(value)) },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [{ getNamespaceForUri: () => 'App.Generated' }] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };
    try {
        const script = await TemplateScript.create(config);
        assert.ok(script, errors.join('\n'));
        await script.init(destination, root);
        const generated = join(destination, 'Widget', 'Main.lib.avt');
        const contents = readFileSync(generated, 'utf8');
        assert.match(contents, /class Widget/);
        assert.match(contents, /enabled/);
        assert.doesNotMatch(contents, /disabled|#if|#end/);
        assert.match(contents, /\[body\]/);
        assert.match(contents, /namespace App\.Generated \{/);
        assert.equal(existsSync(join(destination, 'denied')), false);
        assert.equal(existsSync(join(destination, 'omit.txt')), false);
        assert.equal(existsSync(join(destination, 'template.avt.ts')), false);
        assert.equal(registered.length, 1);
        assert.match(registered[0], /Widget\/Main\.lib\.avt$/);
        assert.deepEqual(errors, []);
    } finally {
        GenericServer.instance = oldServer;
        TemplateScript.memory = oldMemory;
        ProjectManager.instance = oldProjects;
        FilesManager.instance = oldFiles;
        rmSync(root, { recursive: true, force: true });
    }
});

test('real project template writes renamed configuration after other Aventus files and registers both outputs', { timeout: 15_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-config-template-'));
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
        "  meta() { return { name: 'Project fixture', isProject: true }; }",
        "  async run() { this.registerVar('name', 'Project'); await this.writeFile(); }",
        '}',
    ].join('\n'));

    const oldServer = GenericServer.instance;
    const oldMemory = TemplateScript.memory;
    const oldProjects = ProjectManager.instance;
    const oldFiles = FilesManager.instance;
    const registered = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: value => errors.push(String(value)) },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };
    try {
        const script = await TemplateScript.create(config);
        assert.ok(script, errors.join('\n'));
        assert.equal(script.isProject, true);
        await script.init(destination, root);
        assert.equal(readFileSync(join(destination, 'Main.lib.avt'), 'utf8'), 'class Project {}');
        assert.equal(readFileSync(join(destination, 'aventus.conf.avt'), 'utf8'), '{"name":"Project"}');
        assert.equal(existsSync(join(destination, '!aventus.conf.avt')), false);
        assert.equal(registered.length, 2);
        assert.ok(registered.some(uri => uri.endsWith('/Main.lib.avt')));
        assert.ok(registered.some(uri => uri.endsWith('/aventus.conf.avt')));
        assert.deepEqual(errors, []);
    } finally {
        GenericServer.instance = oldServer;
        TemplateScript.memory = oldMemory;
        ProjectManager.instance = oldProjects;
        FilesManager.instance = oldFiles;
        rmSync(root, { recursive: true, force: true });
    }
});
