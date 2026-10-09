import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { Emmet }, { ManifestPackage }] = await loadServerModules([
    'cmds/index.ts', 'cmds/Emmet.ts', 'manifest/ManifestPackage.ts',
]);

test('Emmet command writes the package manifest with forced output', async () => {
    const original = ManifestPackage.write;
    const argumentsSeen = [];
    ManifestPackage.write = async (...args) => { argumentsSeen.push(args); };
    try {
        assert.equal(Emmet.cmd, 'aventus.emmet');
        await Commands.execute({ command: Emmet.cmd, arguments: ['ignored'] });
        assert.deepEqual(argumentsSeen, [[true]]);
    } finally {
        ManifestPackage.write = original;
    }
});

test('Emmet command waits for manifest write and propagates its failure', async () => {
    const original = ManifestPackage.write;
    const failure = new Error('manifest output failed');
    ManifestPackage.write = async () => { throw failure; };
    try {
        await assert.rejects(Commands.execute({ command: Emmet.cmd }), error => error === failure);
    } finally {
        ManifestPackage.write = original;
    }
});
