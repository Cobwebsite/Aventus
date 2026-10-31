import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const categories = ['server', 'client', 'cli', 'runtime'];
const selected = process.argv.slice(2);
if (selected.some(category => !categories.includes(category))) {
    process.stderr.write(`Usage: node tests/run-tests.mjs [${categories.join('|')} ...]\n`);
    process.exit(1);
}

const totals = { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
const failures = [];
const batchSize = 40;

for (const category of selected.length ? [...new Set(selected)] : categories) {
    const directory = resolve(root, 'tests', category);
    const tests = readdirSync(directory, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.endsWith('.test.mjs'))
        .map(entry => resolve(entry.parentPath, entry.name))
        .sort();
    if (!tests.length) {
        process.stdout.write(`\n${category}: no tests found\n`);
        continue;
    }
    const batches = Math.ceil(tests.length / batchSize);
    for (let start = 0; start < tests.length; start += batchSize) {
        const batch = Math.floor(start / batchSize) + 1;
        process.stdout.write(`\n${category}: batch ${batch}/${batches}\n`);
        const result = spawnSync(process.execPath, [
            '--experimental-transform-types', '--test', ...tests.slice(start, start + batchSize),
        ], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
        if (result.error) throw result.error;
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
        const lines = result.stdout.split(/\r?\n/);
        for (const key of Object.keys(totals)) {
            const match = lines.find(line => line.startsWith(`ℹ ${key} `))?.match(/\d+$/);
            if (match) totals[key] += Number(match[0]);
        }
        const failureSection = lines.findIndex(line => line.startsWith('✖ failing tests:'));
        if (failureSection !== -1) {
            for (const line of lines.slice(failureSection + 1)) {
                if (line.startsWith('✖ ') && !line.startsWith('✖ test at ')) {
                    failures.push(`${category}: ${line.slice(2)}`);
                }
            }
        }
        if (result.status !== 0) process.exitCode = 1;
    }
}

process.stdout.write('\nTest summary\n');
process.stdout.write(`${totals.tests} tests: ${totals.pass} passed, ${totals.fail} failed, ${totals.cancelled} cancelled, ${totals.skipped} skipped, ${totals.todo} todo.\n`);
if (failures.length) {
    process.stdout.write('Failures:\n');
    for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
}
if (process.exitCode) process.stdout.write('Result: failed\n');
else if (totals.tests === 0) process.stdout.write('Result: no tests found\n');
else process.stdout.write('Result: passed\n');
