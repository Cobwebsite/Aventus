import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('successive builds remove only unmodified i18n outputs they created', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-i18n-rebuild-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, logLevel: 99,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    t.after(() => { GenericServer.instance = previous; });

    const single = join(root, 'single');
    const separate = join(root, 'separate');
    mkdirSync(separate);
    writeFileSync(join(separate, 'legacy_fr.json'), '{"external":"before build"}');
    writeFileSync(join(separate, 'unrelated.json'), '{"external":true}');
    const build = Object.create(Build.prototype);
    build.publishedI18nOutputs = new Map();
    build.publishedJsOutputs = new Map();
    Object.assign(build, {
        initDone: true, _allowBuild: true, buildRevision: 0, diagnostics: new Map(),
        buildConfig: {
            fullname: 'Demo@web', module: 'Demo', i18n: { locales: ['en', 'fr'] },
            compile: [{
                i18n: [
                    { mode: 'singleFile', output: [single] },
                    { mode: 'oneToOne', output: [separate] },
                ],
                output: [], package: [], outputNpm: { live: false },
            }],
        },
        tsLanguageService: { i18nFiles: {
            shared: { file: { name: '@shared.i18n.avt' }, exported: {
                en: { shared: 'First' }, fr: { shared: 'Premier' },
            } },
            legacy: { file: { name: '@legacy.i18n.avt' }, exported: {
                en: { legacy: 'Old' }, fr: { legacy: 'Ancien' },
            } },
        } },
        i18nComponentsFiles: {}, tsFiles: {},
    });
    build.writeFile = async (path, content) => {
        if (build.pendingOutputs) {
            build.pendingOutputs.set(path, content);
            return;
        }
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    build.buildLocalCode = async () => ({ codeRenderInJs: [], codeNotRenderInJs: [] });
    build.writeBuildCode = async () => [];
    build.writeBuildDocumentation = async () => {};
    const output = (folder, name) => join(folder, name).toLowerCase();
    const json = (folder, name) => JSON.parse(readFileSync(output(folder, name), 'utf8'));

    await build.build();
    assert.deepEqual(json(single, 'en.json'), { shared: 'First', legacy: 'Old' });
    assert.deepEqual(json(single, 'fr.json'), { shared: 'Premier', legacy: 'Ancien' });
    assert.deepEqual(json(separate, 'shared_en.json'), { shared: 'First' });
    assert.deepEqual(json(separate, 'legacy_fr.json'), { legacy: 'Ancien' });

    writeFileSync(output(separate, 'legacy_en.json'), '{"external":"edited"}');
    build.tsLanguageService.i18nFiles.shared.exported.en.shared = 'Updated';
    delete build.tsLanguageService.i18nFiles.legacy;
    build.buildConfig.i18n.locales = ['en'];
    await build.build();
    assert.deepEqual(json(single, 'en.json'), { shared: 'Updated' });
    assert.deepEqual(json(separate, 'shared_en.json'), { shared: 'Updated' });
    assert.equal(existsSync(output(single, 'fr.json')), false);
    assert.equal(existsSync(output(separate, 'shared_fr.json')), false);
    assert.deepEqual(json(separate, 'legacy_en.json'), { external: 'edited' });
    assert.equal(existsSync(output(separate, 'legacy_fr.json')), true);
    assert.deepEqual(json(separate, 'unrelated.json'), { external: true });
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 2);

    build.buildConfig.i18n.locales = ['en', 'fr'];
    build.tsLanguageService.i18nFiles.shared.exported.fr.shared = 'Mis à jour';
    await build.build();
    assert.deepEqual(json(single, 'fr.json'), { shared: 'Mis à jour' });
    assert.deepEqual(json(separate, 'shared_fr.json'), { shared: 'Mis à jour' });
    assert.deepEqual(json(separate, 'legacy_fr.json'), { legacy: 'Ancien' });
    assert.deepEqual(json(separate, 'legacy_en.json'), { external: 'edited' });

    build.buildConfig.compile[0].i18n = [{ mode: 'singleFile', output: [single] }];
    await build.build();
    assert.equal(existsSync(output(separate, 'shared_en.json')), false);
    assert.equal(existsSync(output(separate, 'shared_fr.json')), false);
    assert.deepEqual(json(separate, 'legacy_en.json'), { external: 'edited' });
    assert.deepEqual(json(separate, 'legacy_fr.json'), { legacy: 'Ancien' });
    assert.deepEqual(json(separate, 'unrelated.json'), { external: true });
});
