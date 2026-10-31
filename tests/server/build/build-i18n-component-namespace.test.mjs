import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'project/Build.ts', 'language-services/ts/component/File.ts',
]);

test('one-to-one component translations include the namespace in the file name across revisions', async t => {
    const output = mkdtempSync(join(tmpdir(), 'aventus-i18n-component-namespace-'));
    t.after(() => rmSync(output, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.buildConfig = { i18n: { locales: ['en'] } };
    build.tsLanguageService = { i18nFiles: {} };
    build.writeFile = async (path, content) => writeFileSync(path, content);
    const i18nUri = 'file:///D:/widgets/Card.i18n.avt';
    const logical = Object.create(AventusWebComponentLogicalFile.prototype);
    logical._componentClassName = 'Card';
    logical.fileParsed = { classes: { Card: { namespace: 'Demo.Widgets' } } };
    build.tsFiles = { [i18nUri.replace('.i18n.avt', '.wcl.avt')]: logical };
    const translation = {
        file: { name: 'Card.i18n.avt' },
        exported: { en: { title: 'First' } },
    };
    build.i18nComponentsFiles = { [i18nUri]: translation };
    const options = [{ mode: 'oneToOne', output: [output] }];

    await build.writeBuildI18n(options);
    const rootFile = join(output, 'demo_widgets_card_en.json');
    const namespaceFolder = join(output, 'Demo', 'Widgets');
    assert.deepEqual(JSON.parse(readFileSync(rootFile, 'utf8')), { title: 'First' });
    assert.equal(existsSync(namespaceFolder), false);

    translation.exported.en = { title: 'Second' };
    await build.writeBuildI18n(options);
    assert.deepEqual(JSON.parse(readFileSync(rootFile, 'utf8')), { title: 'Second' });
    assert.equal(existsSync(namespaceFolder), false);
});

test('one-to-one components with equal names in distinct namespaces write separate files', async t => {
    const output = mkdtempSync(join(tmpdir(), 'aventus-i18n-component-collision-'));
    t.after(() => rmSync(output, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.buildConfig = { i18n: { locales: ['en'] } };
    build.tsLanguageService = { i18nFiles: {} };
    build.tsFiles = {};
    build.i18nComponentsFiles = {};
    build.writeFile = async (path, content) => writeFileSync(path, content);
    const add = (folder, namespace, title) => {
        const uri = `file:///D:/${folder}/Card.i18n.avt`;
        const logical = Object.create(AventusWebComponentLogicalFile.prototype);
        logical._componentClassName = 'Card';
        logical.fileParsed = { classes: { Card: { namespace } } };
        build.tsFiles[uri.replace('.i18n.avt', '.wcl.avt')] = logical;
        build.i18nComponentsFiles[uri] = {
            file: { name: 'Card.i18n.avt' }, exported: { en: { title } },
        };
    };
    add('widgets', 'Demo.Widgets', 'Widget');
    add('pages', 'Demo.Pages', 'Page');

    await build.writeBuildI18n([{ mode: 'oneToOne', output: [output] }]);
    assert.deepEqual(JSON.parse(readFileSync(join(output, 'demo_widgets_card_en.json'), 'utf8')),
        { title: 'Widget' });
    assert.deepEqual(JSON.parse(readFileSync(join(output, 'demo_pages_card_en.json'), 'utf8')),
        { title: 'Page' });
});
