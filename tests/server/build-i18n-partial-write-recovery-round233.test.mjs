import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

test('i18n publication resumes after its second locale fails and exposes the partial first locale', async t => {
    const output = mkdtempSync(join(tmpdir(), 'aventus-i18n-write-recovery-'));
    t.after(() => rmSync(output, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildConfig = { i18n: { locales: ['en', 'fr'] } };
    build.i18nComponentsFiles = {};
    const translation = { exported: { en: { title: 'First' }, fr: { title: 'Premier' } } };
    build.tsLanguageService = { i18nFiles: { 'file:///messages.i18n.avt': translation } };
    let failFrench = false;
    build.writeFile = async (path, content) => {
        if (failFrench && path.endsWith('fr.json')) throw new Error('French output failed');
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = [{ mode: 'singleFile', output: [output] }];
    const read = locale => JSON.parse(readFileSync(join(output, `${locale}.json`), 'utf8'));

    await build.writeBuildI18n(options);
    assert.deepEqual(read('en'), { title: 'First' });
    assert.deepEqual(read('fr'), { title: 'Premier' });

    translation.exported = { en: { title: 'Second' }, fr: { title: 'Deuxième' } };
    failFrench = true;
    await assert.rejects(build.writeBuildI18n(options), /French output failed/);
    assert.deepEqual(read('en'), { title: 'Second' });
    assert.deepEqual(read('fr'), { title: 'Premier' });

    translation.exported = { en: { title: 'Third' }, fr: { title: 'Troisième' } };
    failFrench = false;
    await build.writeBuildI18n(options);
    assert.deepEqual(read('en'), { title: 'Third' });
    assert.deepEqual(read('fr'), { title: 'Troisième' });
});
