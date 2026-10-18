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

test('real template pairs sequential progress notifications around generation', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-progress-'));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(templateDir);
    mkdirSync(destination);
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(templateDir, 'result.wcl.avt'), '${{state}}');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Progress fixture' }; }",
        '  async run() {',
        "    await this.runWithProgress('Preparing', async () => { this.registerVar('state', 'ready'); });",
        "    await this.runWithProgress('Writing', async () => { await this.writeFile(); });",
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
        rmSync(root, { recursive: true, force: true });
    });
    const notifications = [];
    const events = [];
    const registered = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            sendNotification: (method, params) => {
                notifications.push([method, params]);
                events.push(method);
            },
            error: value => errors.push(String(value)),
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => {
        registered.push(uri);
        events.push('registerFile');
    } };

    const script = await TemplateScript.create(config);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);

    assert.equal(readFileSync(join(destination, 'result.wcl.avt'), 'utf8'), 'ready');
    assert.equal(notifications.length, 4);
    assert.deepEqual(notifications.map(([method]) => method), [
        'aventus/progress_start', 'aventus/progress_stop',
        'aventus/progress_start', 'aventus/progress_stop',
    ]);
    assert.equal(notifications[0][1][1], 'Preparing');
    assert.equal(notifications[2][1][1], 'Writing');
    assert.match(notifications[0][1][0], /^[\da-f-]{36}$/i);
    assert.match(notifications[2][1][0], /^[\da-f-]{36}$/i);
    assert.notEqual(notifications[0][1][0], notifications[2][1][0]);
    assert.equal(notifications[1][1][0], notifications[0][1][0]);
    assert.equal(notifications[3][1][0], notifications[2][1][0]);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['result.wcl.avt']);
    assert.deepEqual(events, [
        'aventus/progress_start', 'aventus/progress_stop',
        'aventus/progress_start', 'registerFile', 'aventus/progress_stop',
    ]);
    assert.deepEqual(errors, []);
});
