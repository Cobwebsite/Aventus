import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }] = await loadServerModules(['project/Project.ts']);

test('alias resolution treats differently cased Windows paths as the same folder', () => {
    const project = Object.create(Project.prototype);
    project.configFile = { folderPath: 'C:\\Workspace\\Project' };
    project.config = { aliases: { '@src': 'src' } };

    assert.equal(project.resolveAlias('@src/item', 'C:\\Workspace\\Project\\src'), './item');
    assert.equal(project.resolveAlias('@src/item', 'c:\\workspace\\project\\src'), './item');
});
