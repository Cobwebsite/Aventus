import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';

const require = createRequire(import.meta.url);
const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'coverage/server');
const nyc = resolve(root, 'node_modules/nyc/bin/nyc.js');
const bundlePattern = /^\.coverage-bundle-.*\.cjs$/;
const tests = process.argv.length > 2
    ? process.argv.slice(2)
    : readdirSync(resolve(root, 'tests/server'), { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.endsWith('.test.mjs'))
        .map(entry => `${entry.parentPath.replace(root + sep, '').replaceAll('\\', '/')}/${entry.name}`)
        .sort()
const shardSize = 40;
const coverage = createCoverageMap({});
let failed = false;

function bundles() {
    const found = [];
    for (const directory of [root, resolve(root, 'server/src'), resolve(root, 'tests/server')]) {
        for (const entry of readdirSync(directory, { recursive: directory !== root, withFileTypes: true })) {
            if (entry.isFile() && bundlePattern.test(entry.name)) {
                found.push(resolve(entry.parentPath, entry.name));
            }
        }
    }
    return found;
}

for (let start = 0; start < tests.length; start += shardSize) {
    const shard = Math.floor(start / shardSize) + 1;
    const shardOutput = resolve(output, `shard-${shard}`);
    const existing = new Set(bundles());
    process.stdout.write(`\nCouverture serveur : lot ${shard}/${Math.ceil(tests.length / shardSize)}\n`);
    try {
        const result = spawnSync(process.execPath, [
            nyc,
            '--exclude=**/node_modules/**',
            '--reporter=json',
            `--report-dir=${shardOutput}`,
            `--temp-dir=${resolve(root, `.nyc_output/server-${shard}`)}`,
            process.execPath,
            '--experimental-transform-types',
            '--test',
            ...tests.slice(start, start + shardSize),
        ], {
            cwd: root,
            env: { ...process.env, AVENTUS_TEST_COVERAGE: '1' },
            stdio: 'inherit',
        });
        if (result.error) throw result.error;
        if (result.status !== 0) failed = true;
        const files = JSON.parse(readFileSync(resolve(shardOutput, 'coverage-final.json'), 'utf8'));
        const sourceRoot = resolve(root, 'server/src').toLowerCase();
        for (const filename of Object.keys(files)) {
            if (!filename.toLowerCase().startsWith(`${sourceRoot}${sep}`)) delete files[filename];
        }
        coverage.merge(files);
    } finally {
        for (const filename of bundles()) {
            if (!existing.has(filename)) rmSync(filename);
        }
        rmSync(shardOutput, { recursive: true, force: true });
        rmSync(resolve(root, `.nyc_output/server-${shard}`), { recursive: true, force: true });
    }
}

const context = createContext({ dir: output, coverageMap: coverage });
for (const reporter of ['json-summary', 'lcovonly', 'text-summary']) {
    reports.create(reporter).execute(context);
}
process.exitCode = failed ? 1 : 0;
