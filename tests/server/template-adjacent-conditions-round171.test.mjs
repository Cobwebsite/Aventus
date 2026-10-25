import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('real template processes repeated and nested conditions while preserving unclosed markers', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-adjacent-ifs-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const source = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(source);
    mkdirSync(destination);
    const config = join(source, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(source, 'Panel.wcl.avt'),
        '#if{{optional}}before#end{{optional}}\nexport class Panel {}\n#if{{optional}}after#end{{optional}}\n' +
        '#if{{enabled}}A#if{{optional}}drop#end{{optional}}B#if{{enabled}}C#end{{enabled}}#end{{enabled}}\n' +
        '#if{{unfinished}}keep');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Adjacent conditions', isProject: false }; }",
        "  async run() { this.registerIf('optional', false); this.registerIf('enabled', true); this.registerIf('unfinished', false); await this.writeFile(); }",
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

    assert.equal(readFileSync(join(destination, 'Panel.wcl.avt'), 'utf8'),
        '\nexport class Panel {}\n\nABC\n#if{{unfinished}}keep');
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['Panel.wcl.avt']);
    assert.deepEqual(errors, []);
});
