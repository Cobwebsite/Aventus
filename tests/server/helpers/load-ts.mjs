import Module from 'node:module';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));

function loadBundle(contents, filename) {
    if (process.env.AVENTUS_TEST_COVERAGE) {
        filename = resolve(dirname(filename), `.coverage-bundle-${process.pid}-${randomUUID()}.cjs`);
        contents = contents.replace(/sourceMappingURL=data:application\/json;base64,([^\s]+)/, (_, encoded) => {
            const map = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
            map.sources = map.sources.map(source => resolve(projectRoot, source));
            return `sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`;
        });
        writeFileSync(filename, contents);
        return require(filename);
    }
    const bundledModule = new Module(filename);
    bundledModule.filename = filename;
    bundledModule.paths = Module._nodeModulePaths(dirname(filename));
    bundledModule._compile(contents, filename);
    return bundledModule.exports;
}

export async function loadServerModule(relativePath) {
    const input = resolve(projectRoot, 'server/src', relativePath);
    const output = await esbuild.build({
        entryPoints: [input],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        sourcemap: process.env.AVENTUS_TEST_COVERAGE ? 'inline' : false,
        write: false,
    });
    const filename = `${input}.test-bundle.cjs`;
    return loadBundle(output.outputFiles[0].text, filename);
}

export async function loadServerModules(relativePaths) {
    const contents = relativePaths.map((path, index) =>
        `export * as module${index} from './server/src/${path}';`
    ).join('\n');
    const output = await esbuild.build({
        stdin: { contents, resolveDir: projectRoot, sourcefile: 'test-entry.ts' },
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        sourcemap: process.env.AVENTUS_TEST_COVERAGE ? 'inline' : false,
        write: false,
    });
    const filename = resolve(projectRoot, 'tests/server/test-entry.cjs');
    const bundledModule = loadBundle(output.outputFiles[0].text, filename);
    return relativePaths.map((_, index) => bundledModule[`module${index}`]);
}
