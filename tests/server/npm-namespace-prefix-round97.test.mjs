import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

test('npm namespace entry points include children without importing prefix-sharing siblings', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-prefix-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'package');
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Catalog@web', module: 'Catalog', name: 'web', version: '1.0.0' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = { filesUri: [], getByUri: () => undefined };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };

    await build.writeBuildNpm({ path: [output], packageJson: false, manifest: false }, {
        npm: {
            'Catalog.UI': { content: ['export interface UiMarker {}'], imports: {} },
            'Catalog.UIExtra.Widget': { content: ['export interface WidgetMarker {}'], imports: {} },
        },
        npmsrc: {},
    });

    const uiJs = readFileSync(join(output, 'Catalog', 'UI', 'index.js'), 'utf8');
    const uiTypes = readFileSync(join(output, 'Catalog', 'UI', 'index.d.ts'), 'utf8');
    const siblingJs = readFileSync(join(output, 'Catalog', 'UIExtra', 'index.js'), 'utf8');
    assert.doesNotMatch(uiJs, /Widget/);
    assert.doesNotMatch(uiTypes, /Widget/);
    assert.match(siblingJs, /import \* as Widget from "\.\/Widget\/index\.js"/);
    const siblingTypes = readFileSync(join(output, 'Catalog', 'UIExtra', 'index.d.ts'), 'utf8');
    assert.match(siblingTypes, /import \* as Widget from "\.\/Widget"/);
});
