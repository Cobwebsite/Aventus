import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('multi-template import reports successful and failed items separately, then retries', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-partial-import-'));
    const sourceRoot = join(root, 'extension', 'templates', 'templates');
    const destination = join(root, 'installed');
    for (const name of ['first', 'second', 'third']) {
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
    const errors = [];
    let reloads = 0;
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'),
        _template: { workspaces: [root] },
        logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => items,
            showInformationMessage: message => messages.push(message),
            showErrorMessage: message => errors.push(message),
        },
    };
    TemplateScript.create = async config => ({
        name: readFileSync(config, 'utf8'),
        installationFolder: config.includes('second') ? 'collision/second'
            : config.includes('third') ? 'collision/third' : 'first',
    });
    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [destination];
    manager.reloadTemplates = async () => { reloads++; };

    await manager.selectTemplateToImport();
    assert.equal(readFileSync(join(destination, 'first', 'content.txt'), 'utf8'), 'first content');
    assert.equal(existsSync(join(destination, 'collision', 'second')), false);
    assert.equal(existsSync(join(destination, 'collision', 'third')), false);
    assert.equal(reloads, 1);
    assert.deepEqual(messages, ['Templates installed: first']);
    assert.equal(errors.length, 2);
    assert.match(errors[0], /^Template second failed: /);
    assert.match(errors[1], /^Template third failed: /);

    unlinkSync(join(destination, 'collision'));
    mkdirSync(join(destination, 'collision'));
    await manager.selectTemplateToImport();
    assert.equal(readFileSync(join(destination, 'first', 'content.txt'), 'utf8'), 'first content');
    assert.equal(readFileSync(join(destination, 'collision', 'second', 'content.txt'), 'utf8'), 'second content');
    assert.equal(readFileSync(join(destination, 'collision', 'third', 'content.txt'), 'utf8'), 'third content');
    assert.equal(reloads, 2);
    assert.deepEqual(messages, ['Templates installed: first', 'Templates installed']);
    assert.equal(errors.length, 2);
});
