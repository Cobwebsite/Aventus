import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('template import ignores an unknown serialized selection, then accepts the current item on retry', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-selection-retry-'));
    const source = join(root, 'extension', 'templates', 'templates', 'sample');
    const destination = join(root, 'installed');
    mkdirSync(source, { recursive: true });
    mkdirSync(destination);
    writeFileSync(join(source, 'template.avt.ts'), 'sample');
    writeFileSync(join(source, 'payload.txt'), 'current');

    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    t.after(() => {
        GenericServer.instance = previousServer;
        TemplateScript.create = previousCreate;
        rmSync(root, { recursive: true, force: true });
    });

    let selections = 0;
    let reloads = 0;
    const messages = [];
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'),
        _template: { workspaces: [root] },
        logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => {
                selections++;
                assert.equal(items.length, 1);
                if (selections === 1) {
                    return [{ label: items[0].label, detail: items[0].detail, id: join(root, 'foreign') }];
                }
                return [{ label: items[0].label, detail: items[0].detail, id: items[0].id }];
            },
            showInformationMessage: message => messages.push(message),
            showErrorMessage: message => { throw new Error(message); },
        },
    };
    TemplateScript.create = async () => ({ name: 'Sample', installationFolder: 'sample' });

    const manager = Object.create(TemplateManager.prototype);
    manager.templatePath = [destination];
    manager.reloadTemplates = async () => { reloads++; };

    await manager.selectTemplateToImport();
    assert.equal(existsSync(join(destination, 'sample')), false);
    assert.equal(reloads, 0);
    assert.deepEqual(messages, []);

    await manager.selectTemplateToImport();
    assert.equal(readFileSync(join(destination, 'sample', 'payload.txt'), 'utf8'), 'current');
    assert.equal(selections, 2);
    assert.equal(reloads, 1);
    assert.deepEqual(messages, ['Templates installed']);
});
