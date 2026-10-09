import Module from 'node:module';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));

export async function loadServerModule(relativePath) {
    const input = resolve(projectRoot, 'server/src', relativePath);
    const output = await esbuild.build({
        entryPoints: [input],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        write: false,
    });
    const filename = `${input}.test-bundle.cjs`;
    const bundledModule = new Module(filename);
    bundledModule.filename = filename;
    bundledModule.paths = Module._nodeModulePaths(dirname(filename));
    bundledModule._compile(output.outputFiles[0].text, filename);
    return bundledModule.exports;
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
        write: false,
    });
    const filename = resolve(projectRoot, 'tests/server/test-entry.cjs');
    const bundledModule = new Module(filename);
    bundledModule.filename = filename;
    bundledModule.paths = Module._nodeModulePaths(dirname(filename));
    bundledModule._compile(output.outputFiles[0].text, filename);
    return relativePaths.map((_, index) => bundledModule.exports[`module${index}`]);
}
