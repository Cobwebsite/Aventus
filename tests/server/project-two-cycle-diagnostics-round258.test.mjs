import assert from 'node:assert/strict';
import test from 'node:test';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { AventusJSONLanguageService }] = await loadServerModules([
    'project/Project.ts', 'language-services/json/LanguageService.ts',
]);

test('two build cycles retain separate JSON key diagnostics across independent revisions', async t => {
    const service = AventusJSONLanguageService.getInstance();
    const previousValidate = service.validate;
    service.validate = async () => [];
    t.after(() => { service.validate = previousValidate; });

    const uri = 'file:///workspace/aventus.conf.avt';
    const file = { documentUser: null };
    const project = Object.create(Project.prototype);
    const alpha = { buildConfig: { name: 'alpha' }, dependencyCycle: ['Shared', 'Alpha', 'Shared'] };
    const beta = { buildConfig: { name: 'beta' }, dependencyCycle: ['Shared', 'Beta', 'Shared'] };
    Object.assign(project, { configFile: file, builds: [alpha, beta] });
    const setConfig = (version, alphaDeps, betaDeps) => {
        file.documentUser = TextDocument.create(uri, 'json', version, JSON.stringify({
            module: 'Demo', build: [
                { name: 'alpha', src: [], dependencies: alphaDeps },
                { name: 'beta', src: [], dependencies: betaDeps },
            ],
        }, null, 2));
    };
    const verify = (diagnostic, key, buildName) => {
        assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
        assert.equal(diagnostic.source, 'Aventus');
        assert.equal(file.documentUser.getText(diagnostic.range), `"${key}"`);
        const text = file.documentUser.getText();
        const buildStart = text.indexOf(`"name": "${buildName}"`);
        const nextBuild = text.indexOf('"name":', buildStart + 1);
        const offset = file.documentUser.offsetAt(diagnostic.range.start);
        assert.ok(offset > buildStart && (nextBuild < 0 || offset < nextBuild));
    };

    setConfig(1, { Shared: 'a.package.avt', Alpha: 'b.package.avt' },
        { Shared: 'c.package.avt', Beta: 'd.package.avt' });
    const first = await project.onValidate();
    assert.equal(first.length, 2);
    verify(first[0], 'Shared', 'alpha');
    verify(first[1], 'Shared', 'beta');
    assert.notDeepEqual(first[0].range, first[1].range);

    alpha.dependencyCycle = undefined;
    setConfig(2, { Repaired: 'a.package.avt' },
        { Unrelated: 'x.package.avt', Beta: 'd.package.avt' });
    const second = await project.onValidate();
    assert.equal(second.length, 1);
    verify(second[0], 'Beta', 'beta');

    beta.dependencyCycle = undefined;
    assert.deepEqual(await project.onValidate(), []);
});
