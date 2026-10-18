import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }] = await loadServerModules(['project/Build.ts']);

test('oneToOne global translations with the same basename overwrite each other after reordering', async t => {
    const output = mkdtempSync(join(tmpdir(), 'aventus-i18n-global-collision-'));
    t.after(() => rmSync(output, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.buildConfig = { i18n: { locales: ['en', 'fr'] } };
    build.i18nComponentsFiles = {};
    build.writeFile = async (path, content) => writeFileSync(path, content);
    const first = { file: { name: '@common.i18n.avt' }, exported: {
        en: { origin: 'first en' }, fr: { origin: 'first fr' },
    } };
    const second = { file: { name: '@common.i18n.avt' }, exported: {
        en: { origin: 'second en' }, fr: { origin: 'second fr' },
    } };
    const options = [{ mode: 'oneToOne', output: [output] }];
    const json = locale => JSON.parse(readFileSync(join(output, `common_${locale}.json`), 'utf8'));

    build.tsLanguageService = { i18nFiles: {
        'file:///D:/one/@common.i18n.avt': first,
        'file:///D:/two/@common.i18n.avt': second,
    } };
    await build.writeBuildI18n(options);
    assert.deepEqual(json('en'), { origin: 'second en' });
    assert.deepEqual(json('fr'), { origin: 'second fr' });

    build.tsLanguageService.i18nFiles = {
        'file:///D:/two/@common.i18n.avt': second,
        'file:///D:/one/@common.i18n.avt': first,
    };
    await build.writeBuildI18n(options);
    assert.deepEqual(json('en'), { origin: 'first en' });
    assert.deepEqual(json('fr'), { origin: 'first fr' });
});
