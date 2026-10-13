import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTsLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function fixture() {
    const root = 'file:///D:/test/round67-';
    const ownerUri = `${root}owner.lib.avt`;
    const consumerUri = `${root}consumer.lib.avt`;
    const sources = {
        [ownerUri]: 'namespace Shared { export function send(value: string) { return value; } }',
        [consumerUri]: 'Shared.send("hello");',
    };
    const versions = Object.fromEntries(Object.keys(sources).map(uri => [uri, 1]));
    const files = {};
    function refresh(uri, source) {
        if (source === undefined) {
            delete sources[uri];
            delete files[uri];
            delete versions[uri];
            return;
        }
        sources[uri] = source;
        versions[uri] = (versions[uri] ?? 0) + 1;
        const document = TextDocument.create(uri, 'typescript', versions[uri], source);
        const file = { uri, documentInternal: document, documentUser: document, contentInternal: source, versionInternal: versions[uri] };
        files[uri] = { file, versionInternal: versions[uri], contentForLanguageService: source };
    }
    for (const [uri, source] of Object.entries(sources)) refresh(uri, source);
    const host = {
        getCompilationSettings: () => ({ noLib: true, target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10 }),
        getScriptFileNames: () => Object.keys(sources), getScriptKind: () => ts.ScriptKind.TS,
        getScriptVersion: uri => String(versions[uri] ?? 0),
        getScriptSnapshot: uri => sources[uri] === undefined ? undefined : ts.ScriptSnapshot.fromString(sources[uri]),
        getCurrentDirectory: () => '/', getDefaultLibFileName: () => '',
        fileExists: uri => uri in sources, readFile: uri => sources[uri], readDirectory: () => [],
    };
    const languageService = ts.createLanguageService(host);
    const service = Object.create(AventusTsLanguageService.prototype);
    service.languageService = languageService;
    service.languageServiceNamespace = languageService;
    service.filesLoaded = files;
    service.filesNeeded = Object.keys(files);
    service.i18nFiles = {};
    service.build = { tsFiles: files };
    const position = () => {
        const doc = files[consumerUri].file.documentInternal;
        return doc.positionAt(doc.getText().lastIndexOf('send') + 1);
    };
    return { service, files, ownerUri, consumerUri, refresh, position, dispose: () => languageService.dispose() };
}

test('navigation TS: les plages inter-fichiers suivent une édition de la déclaration', async () => {
    const f = fixture();
    try {
        const before = await f.service.findDefinition(f.files[f.consumerUri].file, f.position());
        assert.equal(before?.[0]?.uri, f.ownerUri);
        f.refresh(f.ownerUri, '\n\nnamespace Shared { export function send(value: string) { return value; } }');
        const owner = f.files[f.ownerUri].file.documentInternal;
        const after = await f.service.findDefinition(f.files[f.consumerUri].file, f.position());
        assert.equal(after?.[0]?.uri, f.ownerUri);
        assert.equal(owner.getText(after[0].range), 'send');
        assert.equal(after[0].range.start.line, 2);
        const references = await f.service.onReferences(f.files[f.consumerUri].file, f.position());
        assert.deepEqual(new Set(references.map(ref => ref.uri)), new Set([f.ownerUri, f.consumerUri]));
        assert.equal(owner.getText(references.find(ref => ref.uri === f.ownerUri).range), 'send');
    } finally { f.dispose(); }
});

test('navigation TS: supprimer puis restaurer la source retire puis rétablit les références', async () => {
    const f = fixture();
    try {
        assert.equal((await f.service.findDefinition(f.files[f.consumerUri].file, f.position()))?.[0]?.uri, f.ownerUri);
        const source = f.files[f.ownerUri].file.documentInternal.getText();
        f.refresh(f.ownerUri, undefined);
        const removedDefinition = await f.service.findDefinition(f.files[f.consumerUri].file, f.position());
        assert.ok(!removedDefinition?.some(location => location.uri === f.ownerUri));
        const removedRefs = await f.service.onReferences(f.files[f.consumerUri].file, f.position());
        assert.ok(removedRefs.every(ref => ref.uri !== f.ownerUri));
        f.refresh(f.ownerUri, source);
        const restored = await f.service.findDefinition(f.files[f.consumerUri].file, f.position());
        assert.equal(restored?.[0]?.uri, f.ownerUri);
    } finally { f.dispose(); }
});

test('navigation TS: une déclaration locale masque un symbole homonyme d’un autre fichier', async () => {
    const f = fixture();
    try {
        f.refresh(f.consumerUri, 'function use(Shared: { send(): string }) { return Shared.send(); }');
        const consumer = f.files[f.consumerUri].file.documentInternal;
        const definition = await f.service.findDefinition(f.files[f.consumerUri].file, f.position());
        assert.equal(definition?.[0]?.uri, f.consumerUri);
        assert.equal(consumer.getText(definition[0].range), 'send');
        const references = await f.service.onReferences(f.files[f.consumerUri].file, f.position());
        assert.ok(references.length >= 2);
        assert.ok(references.every(ref => ref.uri === f.consumerUri));
        const edits = await f.service.onRename(f.files[f.consumerUri].file, f.position(), 'localSend');
        assert.deepEqual(Object.keys(edits?.changes ?? {}), [f.consumerUri]);
        assert.ok(edits.changes[f.consumerUri].every(edit => consumer.getText(edit.range) === 'send'));
    } finally { f.dispose(); }
});

test('navigation TS: completion, hover et renommage suivent plusieurs usages après édition de la signature', async () => {
    const f = fixture();
    try {
        f.refresh(f.ownerUri, 'namespace Shared {\n/** Sends a message */\nexport function send(value: number) { return value; }\n}');
        f.refresh(f.consumerUri, 'Shared.se\nShared.send(1); Shared.send(2);');
        const consumer = f.files[f.consumerUri].file.documentInternal;
        const completion = await f.service.doComplete(f.files[f.consumerUri].file, consumer.positionAt('Shared.se'.length));
        const send = completion.items.find(item => item.label === 'send');
        assert.ok(send);
        assert.equal(consumer.getText(send.textEdit.range), 'se');

        const callPosition = consumer.positionAt(consumer.getText().indexOf('send(1)') + 1);
        const hover = await f.service.doHover(f.files[f.consumerUri].file, callPosition);
        assert.match(hover?.contents?.value ?? '', /value: number/);
        assert.match(hover?.contents?.value ?? '', /Sends a message/);
        const edits = await f.service.onRename(f.files[f.consumerUri].file, callPosition, 'dispatch');
        assert.deepEqual(new Set(Object.keys(edits?.changes ?? {})), new Set([f.ownerUri, f.consumerUri]));
        assert.deepEqual(edits.changes[f.consumerUri].map(edit => consumer.getText(edit.range)), ['send', 'send']);
        assert.deepEqual(edits.changes[f.ownerUri].map(edit => f.files[f.ownerUri].file.documentInternal.getText(edit.range)), ['send']);
        assert.ok(Object.values(edits.changes).flat().every(edit => edit.newText === 'dispatch'));
    } finally { f.dispose(); }
});

test('navigation TS: le renommage inter-fichiers suit le remplacement d’un symbole local homonyme', async () => {
    const f = fixture();
    try {
        const thirdUri = f.ownerUri.replace('owner.lib.avt', 'third.lib.avt');
        f.refresh(thirdUri, 'function use(Shared: { send(): string }) { return Shared.send(); }');
        f.service.filesNeeded.push(thirdUri);
        const first = await f.service.onRename(f.files[f.consumerUri].file, f.position(), 'dispatch');
        assert.deepEqual(new Set(Object.keys(first?.changes ?? {})), new Set([f.ownerUri, f.consumerUri]));
        f.refresh(thirdUri, 'Shared.send("third");');
        const third = f.files[thirdUri].file.documentInternal;
        const second = await f.service.onRename(f.files[f.consumerUri].file, f.position(), 'dispatch');
        assert.deepEqual(new Set(Object.keys(second?.changes ?? {})), new Set([f.ownerUri, f.consumerUri, thirdUri]));
        assert.deepEqual(second.changes[thirdUri].map(edit => third.getText(edit.range)), ['send']);
        assert.ok(Object.values(second.changes).flat().every(edit => edit.newText === 'dispatch'));
    } finally { f.dispose(); }
});
