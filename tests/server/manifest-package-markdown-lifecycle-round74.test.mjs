import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ManifestPackage, ManifestPackageMd } = await loadServerModule('manifest/ManifestPackage.ts');

function packageFile(className = 'Card', functionName = 'select') {
    const source = ts.createSourceFile('exports.ts', `
        export class ${className}<T extends string = string> {
            choose<U extends number = number>(value: U): T | U { throw 0; }
        }
        export function ${functionName}(value?: string): string | undefined { return value; }
    `, ts.ScriptTarget.Latest, true);
    const [classNode, functionNode] = source.statements;
    const methodNode = classNode.members[0];
    const fullName = `Demo.${className}`;
    return {
        name: 'widgets', description: 'Widget library',
        file: { uri: 'file:///widgets.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [{ type: 1, fullName }, { type: 4, fullName: functionName }] },
        fileParsed: {
            classes: { [fullName]: {
                fullName, name: className, namespace: 'Demo', node: classNode,
                isWebcomponent: false, isInterface: false, parentClass: null,
                implementsType: [], properties: {}, propertiesStatic: {},
                methods: { choose: { name: 'choose', node: methodNode, isPrivate: false,
                    isProtected: false, isAbstract: false,
                    documentation: { definitions: ['Chooses a value'] } } },
                methodsStatic: {},
            } },
            functions: { [functionName]: { fullName: functionName, node: functionNode,
                documentation: { definitions: ['Selects a value'] } } },
        },
    };
}

test('package Markdown keeps generic class and method signatures, escaped unions, imports and overview links', () => {
    const markdown = new ManifestPackageMd(packageFile()).getContent();
    assert.match(markdown, /^# widgets/m);
    assert.match(markdown, /\| \[Demo\.Card\]\(demo\.card\) \| Class \|/);
    assert.match(markdown, /## Demo\.Card<T extends string = string>/);
    assert.match(markdown, /Import : import \{ Card \} from "widgets:Demo\.package\.avt"/);
    assert.match(markdown, /\| choose<U extends number = number>\(value: U\) \| T &vert; U \| Chooses a value \|/);
    assert.match(markdown, /## select\(value: string\)/);
    assert.match(markdown, /Return : string &vert; undefined/);
});

test('package Markdown recalculates renamed and removed exports from the current package snapshot', () => {
    const file = packageFile();
    const first = new ManifestPackageMd(file).getContent();
    assert.match(first, /Demo\.Card/);
    assert.match(first, /select\(value/);

    const renamed = packageFile('Panel', 'choose');
    file.srcInfo = renamed.srcInfo;
    file.fileParsed = renamed.fileParsed;
    const second = new ManifestPackageMd(file).getContent();
    assert.match(second, /Demo\.Panel/);
    assert.match(second, /choose\(value/);
    assert.doesNotMatch(second, /Demo\.Card|select\(value/);

    file.srcInfo.available = file.srcInfo.available.filter(info => info.type === 1);
    const third = new ManifestPackageMd(file).getContent();
    assert.match(third, /Demo\.Panel/);
    assert.doesNotMatch(third, /## choose\(value/);
});

test('getMarkdown reads the current registered package and clears after unregistration', () => {
    const oldFiles = ManifestPackage.files;
    const file = packageFile();
    ManifestPackage.files = { [file.file.uri]: file };
    try {
        assert.match(ManifestPackage.getMarkdown(file.file.uri), /Demo\.Card/);
        file.srcInfo.available = [];
        assert.equal(ManifestPackage.getMarkdown(file.file.uri), '');
        delete ManifestPackage.files[file.file.uri];
        assert.equal(ManifestPackage.getMarkdown(file.file.uri), '');
    } finally {
        ManifestPackage.files = oldFiles;
    }
});
