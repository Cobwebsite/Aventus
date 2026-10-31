import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('cancelled single and multiple template choices become empty variables without registration', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-choice-cancel-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(templateDir);
    mkdirSync(destination);
    writeFileSync(join(templateDir, 'result.txt'), 'single=${{single}};multi=${{multi}}');
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Choice cancellation fixture' }; }",
        '  async run() {',
        "    const single = await this.select([{label:'A'}], {title:'Single'});",
        "    const multi = await this.selectMultiple([{label:'B'}], {title:'Multiple'});",
        "    this.registerVar('single', single?.label);",
        "    this.registerVar('multi', multi?.map(item => item.label).join(','));",
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
    const calls = [];
    const registered = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            Select: async (_items, options) => { calls.push(options.title); return null; },
            SelectMultiple: async (_items, options) => { calls.push(options.title); return null; },
            error: value => errors.push(String(value)),
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };
    const script = await TemplateScript.create(config);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);
    assert.deepEqual(calls, ['Single', 'Multiple']);
    assert.equal(readFileSync(join(destination, 'result.txt'), 'utf8'), 'single=;multi=');
    assert.deepEqual(registered, []);
    assert.deepEqual(errors, []);
});
