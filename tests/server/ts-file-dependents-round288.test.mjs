import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, , { AventusTsFile }, , , { pathToUri }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'language-services/ts/File.ts',
    'language-services/ts/package/File.ts', 'project/DependencyManager.ts', 'tools.ts',
]);

function entry(uri, source, dependencies = []) {
    const validations = [];
    const tsFile = Object.create(AventusTsFile.prototype);
    tsFile.fileParsed = {
        document: { getText: () => source },
        classes: dependencies.length ? { C: { dependencies: Object.fromEntries(dependencies.map((dependency, index) => [index, { uri: dependency }])) } } : {},
        functions: {}, enums: {},
    };
    tsFile._file = { uri, validate: async () => validations.push(uri) };
    tsFile.refreshFileParsed = () => validations.push(`refresh:${uri}`);
    return { tsFile, validations };
}

test('TS dependent validation traverses imports and parsed dependencies once after a source change', async () => {
    const a = pathToUri('D:\\demo\\src\\a.lib.avt');
    const b = pathToUri('D:\\demo\\src\\b.lib.avt');
    const c = pathToUri('D:\\demo\\src\\c.lib.avt');
    const unrelated = pathToUri('D:\\demo\\src\\unrelated.lib.avt');
    const files = {
        [a]: entry(a, 'export const a = 1;', [c]), // A cycle must not revalidate the source.
        [b]: entry(b, "import { a } from './a.lib.avt'; export const b = a;"),
        [c]: entry(c, 'export const c = 1;', [b]),
        [unrelated]: entry(unrelated, 'export const other = 1;'),
    };
    const build = {
        tsFiles: Object.fromEntries(Object.entries(files).map(([uri, value]) => [uri, value.tsFile])),
        project: { resolveAlias: name => name },
    };
    for (const { tsFile } of Object.values(files)) tsFile._build = build;

    await files[a].tsFile.validateDependents(new Set([a]));
    assert.deepEqual(files[a].validations, []);
    assert.deepEqual(files[b].validations, [`refresh:${b}`, b]);
    assert.deepEqual(files[c].validations, [`refresh:${c}`, c]);
    assert.deepEqual(files[unrelated].validations, []);
});
