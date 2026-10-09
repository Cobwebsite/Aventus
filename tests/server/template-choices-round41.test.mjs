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

test('real template forwards input validation and maps single and multiple choices into generated content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-choices-'));
    const templateDir = join(root, 'template');
    const destination = join(root, 'destination');
    mkdirSync(templateDir);
    mkdirSync(destination);
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(templateDir, 'result.txt'), '${{name}}|${{framework}}|${{features}}');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Choices fixture' }; }",
        '  async run() {',
        "    const name = await this.input({ title: 'Name', value: 'Default', validations: [{ regex: '^[A-Z]+$', message: 'Uppercase only' }] });",
        "    const framework = await this.select([{ label: 'A', detail: 'first' }, { label: 'B', detail: 'second' }], { title: 'Framework' });",
        "    const features = await this.selectMultiple([{ label: 'CSS' }, { label: 'I18n' }, { label: 'Tests' }], { title: 'Features' });",
        "    this.registerVar('name', name);",
        "    this.registerVar('framework', framework?.detail);",
        "    this.registerVar('features', features?.map(item => item.label).join(','));",
        '    await this.writeFile();',
        '  }',
        '}',
    ].join('\n'));
    const previousServer = GenericServer.instance;
    const previousMemory = TemplateScript.memory;
    const previousProjects = ProjectManager.instance;
    const previousFiles = FilesManager.instance;
    const calls = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            Input: async options => { calls.push(['input', options]); return 'WIDGET'; },
            Select: async (items, options) => { calls.push(['select', items, options]); return { label: 'B' }; },
            SelectMultiple: async (items, options) => { calls.push(['multi', items, options]); return [{ label: 'Tests' }, { label: 'CSS' }]; },
            error: value => errors.push(String(value)),
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: () => {} };
    try {
        const script = await TemplateScript.create(config);
        assert.ok(script, errors.join('\n'));
        await script.init(destination, root);
        assert.deepEqual(calls[0], ['input', { title: 'Name', value: 'Default', validations: [{ regex: '^[A-Z]+$', message: 'Uppercase only' }] }]);
        assert.deepEqual(calls[1], ['select', [{ label: 'A', detail: 'first' }, { label: 'B', detail: 'second' }], { title: 'Framework' }]);
        assert.deepEqual(calls[2], ['multi', [{ label: 'CSS' }, { label: 'I18n' }, { label: 'Tests' }], { title: 'Features' }]);
        assert.equal(readFileSync(join(destination, 'result.txt'), 'utf8'), 'WIDGET|second|CSS,Tests');
        assert.deepEqual(errors, []);
    } finally {
        GenericServer.instance = previousServer;
        TemplateScript.memory = previousMemory;
        ProjectManager.instance = previousProjects;
        FilesManager.instance = previousFiles;
        rmSync(root, { recursive: true, force: true });
    }
});
