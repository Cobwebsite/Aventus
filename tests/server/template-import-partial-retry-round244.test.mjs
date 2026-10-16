import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('multi-template import can recover after second destination fails, while first installation precedes reload', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-partial-import-'));
    const sourceRoot = join(root, 'extension', 'templates', 'templates');
    const destination = join(root, 'installed');
    for (const name of ['first', 'second']) {
        const source = join(sourceRoot, name);
        mkdirSync(source, { recursive: true });
        writeFileSync(join(source, 'template.avt.ts'), name);
        writeFileSync(join(source, 'content.txt'), `${name} content`);
    }
    mkdirSync(destination);
    writeFileSync(join(destination, 'collision'), 'occupied');

    const oldServer = GenericServer.instance;
    const oldCreate = TemplateScript.create;
    t.after(() => {
        GenericServer.instance = oldServer;
        TemplateScript.create = oldCreate;
        rmSync(root, { recursive: true, force: true });
    });

    const messages = [];
    let reloads = 0;
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'),
        _template: { workspaces: [root] },
        logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => items,
            showInformationMessage: message => messages.push(message),
        },
    };
    TemplateScript.create = async config => ({
        name: readFileSync(config, 'utf8'),
        installationFolder: config.includes('second') ? 'collision/second' : 'first',
    });
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [destination];
    manager.reloadTemplates = async () => { reloads++; };

    await assert.rejects(manager.selectTemplateToImport());
    assert.equal(readFileSync(join(destination, 'first', 'content.txt'), 'utf8'), 'first content');
    assert.equal(existsSync(join(destination, 'collision', 'second')), false);
    assert.equal(reloads, 0);
    assert.deepEqual(messages, []);

    unlinkSync(join(destination, 'collision'));
    mkdirSync(join(destination, 'collision'));
    await manager.selectTemplateToImport();
    assert.equal(readFileSync(join(destination, 'first', 'content.txt'), 'utf8'), 'first content');
    assert.equal(readFileSync(join(destination, 'collision', 'second', 'content.txt'), 'utf8'), 'second content');
    assert.equal(reloads, 1);
    assert.deepEqual(messages, ['Templates installed']);
});
