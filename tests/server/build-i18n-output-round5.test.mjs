import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function fixture(t) {
    const output = mkdtempSync(join(import.meta.dirname, '.i18n-output-round5-'));
    t.after(() => rmSync(output, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildConfig = { i18n: { locales: ['en', 'fr'] } };
    build.tsLanguageService = { i18nFiles: {
        'file:///shared.i18n.avt': { file: { name: '@shared.i18n.avt' }, exported: { en: { shared: 'Shared', collision: 'global' }, fr: { shared: 'Commun' } } },
    } };
    build.i18nComponentsFiles = {
        'file:///widget.i18n.avt': { file: { name: 'widget.i18n.avt' }, exported: { en: { widget: 'Widget', collision: 'component' }, fr: { widget: 'Composant' } } },
    };
    const written = new Map();
    build.writeFile = async (path, content) => written.set(path, JSON.parse(content));
    return { build, output, written };
}

test('single-file i18n output combines global and component keys for every configured locale', async t => {
    const { build, output, written } = fixture(t);
    await build.writeBuildI18n([{ mode: 'singleFile', output: [output] }]);
    assert.deepEqual(written.get(join(output, 'en.json').toLowerCase()), {
        shared: 'Shared', collision: 'component', widget: 'Widget',
    });
    assert.deepEqual(written.get(join(output, 'fr.json').toLowerCase()), {
        shared: 'Commun', widget: 'Composant',
    });
    assert.equal(written.size, 2);
});

test('grouped component i18n output keeps shared and component translations separate', async t => {
    const { build, output, written } = fixture(t);
    await build.writeBuildI18n([{ mode: 'groupComponent', output: [output] }]);
    assert.deepEqual(written.get(join(output, 'shared_en.json').toLowerCase()), { shared: 'Shared', collision: 'global' });
    assert.deepEqual(written.get(join(output, '_components_en.json').toLowerCase()), { widget: 'Widget', collision: 'component' });
    assert.deepEqual(written.get(join(output, 'shared_fr.json').toLowerCase()), { shared: 'Commun' });
    assert.deepEqual(written.get(join(output, '_components_fr.json').toLowerCase()), { widget: 'Composant' });
    assert.equal(written.size, 4);
});

test('one-to-one i18n output names global files after their source and locale', async t => {
    const { build, output, written } = fixture(t);
    build.i18nComponentsFiles = {};
    await build.writeBuildI18n([{ mode: 'oneToOne', output: [output] }]);
    assert.deepEqual(written.get(join(output, 'shared_en.json').toLowerCase()), { shared: 'Shared', collision: 'global' });
    assert.deepEqual(written.get(join(output, 'shared_fr.json').toLowerCase()), { shared: 'Commun' });
    assert.equal(written.size, 2);
});
