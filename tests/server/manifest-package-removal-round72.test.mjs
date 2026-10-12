import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ManifestPackage }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'manifest/ManifestPackage.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

function setup(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-removal-'));
    const prior = {
        server: GenericServer.instance, settings: SettingsManager.instance,
        files: ManifestPackage.files, done: ManifestPackage.done,
    };
    t.after(() => {
        GenericServer.instance = prior.server;
        SettingsManager.instance = prior.settings;
        ManifestPackage.files = prior.files;
        ManifestPackage.done = prior.done;
        rmSync(root, { recursive: true, force: true });
    });
    GenericServer.instance = { workspaces: [pathToFileURL(root).href] };
    SettingsManager.instance = { settings: { useStats: false } };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    const output = join(root, '.aventus', 'emmet', 'snippets.json');
    const makeFile = (name, tagName) => {
        const uri = pathToFileURL(join(root, `${name}.package.avt`)).href;
        return { file: { uri }, srcInfo: { available: [{ tagName }] } };
    };
    return { output, makeFile };
}

test('removing one of two package exports keeps only the remaining Emmet tag', async t => {
    const { output, makeFile } = setup(t);
    const alpha = makeFile('alpha', 'demo-alpha');
    const beta = makeFile('beta', 'demo-beta');
    ManifestPackage.files[alpha.file.uri] = alpha;
    ManifestPackage.files[beta.file.uri] = beta;
    await ManifestPackage.write(true);
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(output, 'utf8')).html.snippets).sort(),
        ['block', 'demo-alpha', 'demo-beta']);

    delete ManifestPackage.files[alpha.file.uri];
    await ManifestPackage.write();
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(output, 'utf8')).html.snippets).sort(),
        ['block', 'demo-beta']);
});

test('removing the last package tag currently leaves the previous Emmet file unchanged', async t => {
    const { output, makeFile } = setup(t);
    const alpha = makeFile('alpha', 'demo-alpha');
    ManifestPackage.files[alpha.file.uri] = alpha;
    await ManifestPackage.write(true);
    const before = readFileSync(output, 'utf8');

    delete ManifestPackage.files[alpha.file.uri];
    await ManifestPackage.write();
    assert.equal(readFileSync(output, 'utf8'), before);
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(output, 'utf8')).html.snippets),
        ['block', 'demo-alpha']);
});

test('renaming the only package tag replaces the snippet at its existing destination', async t => {
    const { output, makeFile } = setup(t);
    const alpha = makeFile('alpha', 'demo-alpha');
    ManifestPackage.files[alpha.file.uri] = alpha;
    await ManifestPackage.write(true);
    alpha.srcInfo.available = [{ tagName: 'demo-renamed' }];
    await ManifestPackage.write();
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(output, 'utf8')).html.snippets).sort(),
        ['block', 'demo-renamed']);
});
