import { EOL } from 'os';
import { join, normalize, sep } from 'path';
import { CodeFixAction, CompilerOptions, CompletionInfo, createLanguageService, Diagnostic as DiagnosticTs, displayPartsToString, Extension, flattenDiagnosticMessageText, FormatCodeSettings, GetCompletionsAtPositionOptions, IndentStyle, JsxEmit, LanguageService, LanguageServiceHost, ModuleDetectionKind, ModuleResolutionKind, RenameInfo, ResolvedModule, ResolvedModuleFull, resolveModuleName, ScriptKind, ScriptTarget, SemicolonPreference, transpile, WithMetadata, UserPreferences, getTokenAtPosition, createSourceFile, isTypeReferenceNode, SourceFile, TypeFormatFlags, ResolvedProjectReference } from 'typescript';
import { CodeAction, CodeLens, CompletionItem, CompletionItemKind, CompletionList, Definition, Diagnostic, DiagnosticSeverity, DiagnosticTag, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { AventusExtension, AventusLanguageId } from '../../definition';
import { AventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { convertRange, getWordAtText, normalizePath, normalizeUri, uriToPath } from '../../tools';
import { AventusTsFile } from './File';
import { loadLibrary, loadNodeModules, loadTypescriptLib } from './libLoader';
import { BaseInfo, InfoType } from './parser/BaseInfo';
import { ClassInfo } from './parser/ClassInfo';
import { DebuggerDecorator } from './parser/decorators/DebuggerDecorator';
import { RequiredDecorator } from './parser/decorators/RequiredDecorator';
import { DefinitionCorrector } from './parser/DefinitionCorrector';
import { TypeInfo } from './parser/TypeInfo';
import { ForeignKeyDecorator } from './parser/decorators/ForeignKeyDecorator';
import { ParserTs } from './parser/ParserTs';
import { existsSync } from 'fs';
import { FilesManager } from '../../files/FilesManager';
import { VariableInfo } from './parser/VariableInfo';
import { EnumInfo } from './parser/EnumInfo';
import { HttpServer } from '../../live-server/HttpServer';
import { AventusPackageNamespaceFileTs } from './package/File';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SettingsManager } from '../../settings/Settings';



export class AventusTsLanguageService {
    private languageService: LanguageService;
    private languageServiceNamespace: LanguageService;
    private build: Build;
    private filesNeeded: string[] = [];
    private filesNpm: string[] = [];
    private filesNpmLoaded: boolean = false;
    private filesLoaded: { [uri: string]: AventusTsFile } = {}

    public constructor(build: Build) {
        this.build = build;
        loadTypescriptLib();
        this.onSettingsChanged(build);
        SettingsManager.getInstance().onSettingsChange(() => {
            this.onSettingsChanged(build);
        })
        this.languageService = createLanguageService(this.createHost());
        this.languageServiceNamespace = createLanguageService(this.createHostNamespace());
    }

    protected onSettingsChanged(build: Build) {
        const read = SettingsManager.getInstance().settings.readNodeModules;
        if (read != this.filesNpmLoaded) {
            if (read) {
                this.filesNpm = loadNodeModules(join(build.project.getConfigFile().folderPath, "node_modules"));
            }
            else {
                this.filesNpm = [];
            }
            this.filesNpmLoaded = read;
        }
    }

    private createHostNamespace(): LanguageServiceHost {
        const that = this;
        const host: LanguageServiceHost = {
            getCompilationSettings: () => compilerOptionsRead,
            getScriptFileNames: () => {
                return [...this.filesNeeded, ...this.filesNpm]
            },
            getScriptKind: (fileName) => {
                return ScriptKind.TS;
            },
            getScriptVersion: (fileName: string) => {
                if (this.filesLoaded[fileName]) {
                    return String(this.filesLoaded[fileName].file.versionUser + 1);
                }
                return '1';
            },
            getScriptSnapshot: (fileName: string) => {
                let text: string | undefined = '';
                if (this.filesLoaded[fileName]) {
                    text = this.filesLoaded[fileName].file.contentInternal;
                } else {
                    text = loadLibrary(fileName);
                }
                if (text === undefined) {
                    return undefined;
                }
                return {
                    getText: (start, end) => text?.substring(start, end) || '',
                    getLength: () => text?.length || 0,
                    getChangeRange: () => undefined
                };
            },
            getCurrentDirectory: () => '',
            getDefaultLibFileName: (_options: CompilerOptions) => 'es2022.full',
            readFile: (fileName: string, _encoding?: string | undefined): string | undefined => {
                if (this.filesLoaded[fileName]) {
                    return this.filesLoaded[fileName].file.contentInternal;
                } else {
                    return loadLibrary(fileName);
                }
            },
            fileExists: (fileName: string): boolean => {
                if (fileName.endsWith(AventusExtension.Base + ".ts")) {
                    fileName = fileName.replace(AventusExtension.Base + ".ts", AventusExtension.Base);
                }
                if (this.filesLoaded[fileName]) {
                    return true;
                } else {
                    return !!loadLibrary(fileName);
                }
            },
            directoryExists: (uri: string): boolean => {
                return existsSync(uriToPath(uri));
            },
            resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile?) {
                const result = that.resolveModuleNames(this, moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile);
                return result;
            },
        };
        return host;
    }
    private createHost(): LanguageServiceHost {
        const that = this;
        const host: LanguageServiceHost = {
            getCompilationSettings: () => compilerOptionsRead,
            getScriptFileNames: () => {
                return [...this.filesNeeded, ...this.filesNpm]
            },
            getScriptKind: (fileName) => {
                return ScriptKind.TS;
            },
            getScriptVersion: (fileName: string) => {
                if (this.filesLoaded[fileName]) {
                    return String(this.filesLoaded[fileName].version + 1);
                }
                return '1';
            },
            getScriptSnapshot: (fileName: string) => {
                let text: string | undefined = '';
                if (this.filesLoaded[fileName]) {
                    text = this.filesLoaded[fileName].contentForLanguageService;
                } else {
                    text = loadLibrary(fileName);
                }
                if (text === undefined) {
                    return undefined;
                }
                return {
                    getText: (start, end) => text?.substring(start, end) || '',
                    getLength: () => text?.length || 0,
                    getChangeRange: () => undefined
                };
            },
            getCurrentDirectory: () => '',
            getDefaultLibFileName: (_options: CompilerOptions) => 'es2022.full',
            readFile: (fileName: string, _encoding?: string | undefined): string | undefined => {
                let result: string | undefined = undefined;
                if (this.filesLoaded[fileName]) {
                    result = this.filesLoaded[fileName].contentForLanguageService;
                } else {
                    result = loadLibrary(fileName);
                }
                return result;
            },
            fileExists: (fileName: string): boolean => {
                let result = false;
                if (fileName.endsWith(AventusExtension.Base + ".ts")) {
                    fileName = fileName.replace(AventusExtension.Base + ".ts", AventusExtension.Base);
                }
                if (this.filesLoaded[fileName]) {
                    result = true;
                } else {
                    result = !!loadLibrary(fileName);
                }
                return result;
            },
            directoryExists: (uri: string): boolean => {
                return existsSync(uriToPath(uri));

            },
            resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile?) {
                const result = that.resolveModuleNames(this, moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile);
                return result;
            },
        };
        return host;
    }
    private resolveModuleNames(host: LanguageServiceHost, moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions, containingSourceFile?: SourceFile): (ResolvedModule | undefined)[] {
        const resolvedModules: ResolvedModule[] = [];
        for (let moduleName of moduleNames) {
            if (!moduleName.startsWith(".") && moduleName.endsWith(AventusExtension.Package)) {
                let temp: ResolvedModuleFull = {
                    extension: Extension.Ts,
                    resolvedFileName: "file:///" + moduleName,
                }
                resolvedModules.push(temp);
                continue;
            }
            let file = FilesManager.getInstance().getByUri(containingFile);
            if (file) {
                moduleName = this.build.project.resolveAlias(moduleName, file);
            }
            let result = resolveModuleName(moduleName, containingFile, compilerOptionsRead, host)
            if (result.resolvedModule) {
                if (result.resolvedModule.resolvedFileName.endsWith(".avt.ts")) {
                    result.resolvedModule.resolvedFileName = result.resolvedModule.resolvedFileName.replace(".avt.ts", ".avt");
                }
                resolvedModules.push(result.resolvedModule);
            }
            else {
                let temp: ResolvedModuleFull = {
                    extension: Extension.Ts,
                    resolvedFileName: moduleName,
                }
                resolvedModules.push(temp);
            }
        }
        return resolvedModules;
    }

    public addFile(tsFile: AventusTsFile) {
        if (this.filesNeeded.indexOf(tsFile.file.uri) == -1) {
            this.filesNeeded.push(tsFile.file.uri);
            this.filesLoaded[tsFile.file.uri] = tsFile;
        }
    }
    public removeFile(tsFile: AventusTsFile) {
        let index = this.filesNeeded.indexOf(tsFile.file.uri);
        if (index != -1) {
            this.filesNeeded.splice(index, 1);
            delete this.filesLoaded[tsFile.file.uri];
        }
    }



    public doValidation(file: AventusFile): Diagnostic[] {
        try {
            const avoidCodes = [1206, 1249, 2612];
            let result: Diagnostic[] = [];
            const syntaxDiagnostics: DiagnosticTs[] = this.languageService.getSyntacticDiagnostics(file.uri);
            const semanticDiagnostics: DiagnosticTs[] = this.languageService.getSemanticDiagnostics(file.uri);
            const allNormalDiagnostics: DiagnosticTs[] = syntaxDiagnostics.concat(semanticDiagnostics);
            for (let diag of allNormalDiagnostics) {
                if (avoidCodes.includes(diag.code)) { continue; } // Decorators not valid
                let msg = `${flattenDiagnosticMessageText(diag.messageText, '\n')}`
                if (diag.reportsUnnecessary) {
                    result.push({
                        range: convertRange(file.documentInternal, diag),
                        severity: DiagnosticSeverity.Hint,
                        source: AventusLanguageId.TypeScript,
                        message: msg,
                        tags: [DiagnosticTag.Unnecessary]
                    })
                }
                else {
                    result.push({
                        range: convertRange(file.documentInternal, diag),
                        severity: DiagnosticSeverity.Error,
                        source: AventusLanguageId.TypeScript,
                        message: msg,
                    })
                }
            }
            return result;
        } catch (e) {
            this.printCatchError(e);
        }
        return [];
    }

    public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
        try {

            let document = file.documentInternal;

            let offset = document.offsetAt(position);
            let replaceRange = convertRange(document, getWordAtText(document.getText(), offset));
            let completions: WithMetadata<CompletionInfo> | undefined;
            try {
                completions = this.languageService.getCompletionsAtPosition(document.uri, offset, completionOptions);
            } catch (e) {
                this.printCatchError(e);
            }
            if (!completions) {
                return { isIncomplete: false, items: [] };
            }
            let items: CompletionItem[] = [];
            for (let i = 0; i < completions.entries.length; i++) {
                let entry = completions.entries[i];
                let remplacement = entry.insertText ? entry.insertText : entry.name
                remplacement = remplacement.replace(/\.\?\./g, "?.");
                let additionalTextEdits: TextEdit[] | undefined = undefined;
                if (remplacement.startsWith("?")) {
                    let offsetMinusOne = document.offsetAt(replaceRange.start) - 1;
                    if (document.getText()[offsetMinusOne] == ".") {
                        additionalTextEdits = [{
                            newText: "",
                            range: {
                                start: { line: replaceRange.start.line, character: replaceRange.start.character - 1 },
                                end: { line: replaceRange.start.line, character: replaceRange.start.character },
                            }
                        }]
                    }
                }

                let customData = {
                    languageId: AventusLanguageId.TypeScript,
                    offset: offset,
                    uri: document.uri
                }

                let completionEntry: CompletionItem = {
                    label: entry.name,
                    sortText: entry.sortText,
                    kind: convertKind(entry.kind),
                    textEdit: TextEdit.replace(replaceRange, remplacement),
                    additionalTextEdits: additionalTextEdits,
                    data: { // data used for resolving item details (see 'doResolve')
                        ...entry.data,
                        ...customData
                    },
                }
                items.push(completionEntry)
            }
            return { isIncomplete: false, items: items };
        } catch (e) {
            this.printCatchError(e);
        }
        return { isIncomplete: false, items: [] };
    }

    public async doResolve(item: CompletionItem): Promise<CompletionItem> {
        try {

            if (item.data) {
                let tsFile = this.build.tsFiles[item.data.uri];
                if (tsFile != null) {
                    let myData = {
                        languageId: item.data.languageIdJs,
                        offset: item.data.offset,
                        uri: item.data.uri
                    }
                    delete item.data.languageId;
                    delete item.data.offset;
                    delete item.data.uri;
                    if (Object.keys(item.data).length == 0) {
                        item.data = undefined
                    }

                    let details = this.languageService.getCompletionEntryDetails(
                        myData.uri,
                        myData.offset,
                        item.label,
                        {},
                        tsFile.file.contentInternal,
                        completionOptions,
                        item.data);

                    if (details) {
                        // let additionalTextEdits: TextEdit[] | undefined = undefined;
                        // if (remplacement.startsWith("?")) {
                        //     let offsetMinusOne = document.offsetAt(replaceRange.start) - 1;
                        //     if (document.getText()[offsetMinusOne] == ".") {
                        //         additionalTextEdits = [];
                        //         let removeRange = {
                        //             start: document.positionAt(offsetMinusOne),
                        //             end: replaceRange.start
                        //         }
                        //         additionalTextEdits.push(TextEdit.replace(removeRange, ""));
                        //     }
                        // }
                        item.detail = displayPartsToString(details.displayParts);
                        item.documentation = displayPartsToString(details.documentation);
                        item.additionalTextEdits = [];
                        if (details.codeActions) {
                            for (let i = 0; i < details.codeActions.length; i++) {
                                for (let change of details.codeActions[i].changes) {
                                    for (let txtChange of change.textChanges) {
                                        txtChange.newText = normalizePath(txtChange.newText.replace(/'/g, '"'));
                                        let newImport = /"(.*)"/g.exec(txtChange.newText);
                                        if (newImport && newImport.length > 1) {
                                            if (!newImport[0].includes(AventusExtension.Package)) {
                                                if (newImport[1].startsWith(".")) {
                                                    let finalPath = simplifyPath(newImport[1], tsFile.file.uri);
                                                    item.detail += "\r\nimport from " + finalPath;
                                                    txtChange.newText = txtChange.newText.replace(newImport[1], finalPath);
                                                }

                                            }
                                            else {
                                                let finalPath = newImport[1];
                                                finalPath = this.filesNeeded.find(p => p.toLowerCase() == finalPath) ?? finalPath;
                                                finalPath = finalPath.replace("file:///", "");
                                                txtChange.newText = txtChange.newText.replace(newImport[1], finalPath);
                                            }
                                        }

                                        item.additionalTextEdits.push({
                                            newText: txtChange.newText,
                                            range: convertRange(tsFile.file.documentInternal, txtChange.span)
                                        });
                                    }
                                }
                            }
                        }
                        delete item.data;
                    }
                }
            }
        } catch (e) {
            this.printCatchError(e);
        }
        return item;
    }


    public async doHover(file: AventusFile, position: Position): Promise<Hover | null> {
        try {

            let info = this.languageService.getQuickInfoAtPosition(file.uri, file.documentInternal.offsetAt(position));
            if (info) {

                let textDoc: string[] = []
                let simpleDoc: string[] = [];
                if (info.documentation) {
                    for (let doc of info.documentation) {
                        textDoc.push(`${doc.text.trim()}`);
                        simpleDoc.push(doc.text.trim());
                    }
                }

                // Extract and format JSDoc tags
                if (info.tags) {
                    simpleDoc.push("&nbsp;");
                    for (let tag of info.tags) {
                        if (tag.name === "inheritdoc") {
                            continue;
                        }
                        let goOn = true;
                        const texts: string[] = [];
                        if (tag.text) {
                            for (let t of tag.text) {
                                if (t.kind == 'text') {
                                    if (t.text == simpleDoc.join('')) {
                                        goOn = false;
                                        break;
                                    }
                                }
                                texts.push(t.text);
                            }
                        }
                        if (!goOn) continue;

                        let tagContent = texts.join('').trim();

                        if (tag.name === "example") {
                            textDoc.push(`\`@${tag.name}\`\n\`\`\`typescript\n${tagContent}\n\`\`\``);
                        } else {
                            textDoc.push(`\`@${tag.name}\` ${tagContent}`);
                        }
                    }
                }

                let value: string = "";
                if (info.displayParts) {
                    value += '\n```typescript\n';
                    value += displayPartsToString(info.displayParts).trim();
                    value += '\n```\n***\n';
                }

                value += textDoc.join('\n\n');
                return {
                    range: convertRange(file.documentInternal, info.textSpan),
                    contents: {
                        kind: 'markdown',
                        value: value
                    }
                };
            }
        } catch (e) {
            this.printCatchError(e);
        }
        return null;
    }

    public getType(tsFile: AventusTsFile, offset: number): string | undefined {
        try {
            let program = this.languageService.getProgram();
            if (!program) return undefined;

            let srcFile = program.getSourceFile(tsFile.file.uri);
            if (!srcFile) return undefined;
            let typeChecker = program.getTypeChecker();

            let node = getTokenAtPosition(srcFile, offset);
            let type = typeChecker.getTypeAtLocation(node);
            let typeName = typeChecker.typeToString(type, node, TypeFormatFlags.UseFullyQualifiedType);
            if (typeName.includes(".")) {
                //its an external type => we can return
                return typeName;
            }
            if (tsFile.fileParsed) {
                // we must check type alias inside imports
                for (let importName in tsFile.fileParsed.importsLocal) {
                    if (importName == typeName) {
                        return typeName;
                    }
                    let importInfo = tsFile.fileParsed.importsLocal[importName];
                    if (importInfo.realName === undefined) {
                        let nodeImported = getTokenAtPosition(srcFile, (importInfo.nameEnd + importInfo.nameStart) / 2);
                        let typeImported = typeChecker.getTypeAtLocation(nodeImported);
                        importInfo.realName = typeChecker.typeToString(typeImported);
                    }
                    if (typeName == importInfo.realName) {
                        return importName;
                    }
                }
            }
            return typeName;
        } catch (e) {
            this.printCatchError(e);
        }
        return undefined;
    }

    public async findDefinition(file: AventusFile, position: Position): Promise<Definition | null> {
        try {

            let definition = this.languageService.getDefinitionAtPosition(file.uri, file.documentInternal.offsetAt(position));
            if (definition && definition.length > 0) {
                let d = definition[0];
                if (d.fileName.endsWith(".avt.ts")) {
                    d.fileName = d.fileName.replace(".avt.ts", ".avt");
                }
                let realDoc = this.filesLoaded[d.fileName];
                if (realDoc instanceof AventusPackageNamespaceFileTs) {
                    return realDoc.goToDefinition(convertRange(realDoc.file.documentInternal, d.textSpan));
                }
                if (realDoc) {
                    return {
                        uri: realDoc.file.uri,
                        range: convertRange(realDoc.file.documentInternal, d.textSpan)
                    };
                }
                else {
                    let content = loadLibrary(d.fileName);
                    if (content) {
                        const doc = TextDocument.create(d.fileName, "typescript", 1, content)
                        return {
                            uri: d.fileName,
                            range: convertRange(doc, d.textSpan)
                        }
                    }
                }
            }
        } catch (e) {
            this.printCatchError(e);
        }
        return null;
    }
    public async format(file: AventusFile, range: Range, formatParams: FormattingOptions, semiColon: boolean = true): Promise<TextEdit[]> {
        try {

            let document = file.documentInternal;
            let start = document.offsetAt(range.start);
            let end = document.offsetAt(range.end);
            let lastLineRange: null | Range = null;
            if (range.end.line > range.start.line && (range.end.character === 0 || isWhitespaceOnly(document.getText().substr(end - range.end.character, range.end.character)))) {
                end -= range.end.character;
                lastLineRange = Range.create(Position.create(range.end.line, 0), range.end);
            }
            let options = { ...formatingOptions };
            if (semiColon) {
                options.semicolons = SemicolonPreference.Insert;
            }
            else {
                options.semicolons = SemicolonPreference.Remove;
            }

            let edits = this.languageServiceNamespace.getFormattingEditsForRange(document.uri, start, end, options);
            if (edits) {
                let result: TextEdit[] = [];
                for (let edit of edits) {
                    if (edit.span.start >= start && edit.span.start + edit.span.length <= end) {
                        result.push({
                            range: convertRange(document, edit.span),
                            newText: edit.newText
                        });
                    }
                }
                if (lastLineRange) {
                    result.push({
                        range: lastLineRange,
                        newText: generateIndent(0, formatParams)
                    });
                }
                return result;
            }
        } catch (e) {
            this.printCatchError(e);
        }
        return [];
    }
    public async doCodeAction(file: AventusFile, range: Range): Promise<CodeAction[]> {

        let result: CodeAction[] = [];
        try {

            let parsedFile = ParserTs.parse(file, false, this.build);
            let document = file.documentInternal;
            const syntaxDiagnostics: DiagnosticTs[] = this.languageService.getSyntacticDiagnostics(document.uri);
            const semanticDiagnostics: DiagnosticTs[] = this.languageService.getSemanticDiagnostics(document.uri);
            let codes: number[] = [];
            for (let diag of syntaxDiagnostics) {
                codes.push(diag.code)
            }
            for (let diag of semanticDiagnostics) {
                if (diag.code != 6133) { // 6133 = unused code
                    codes.push(diag.code)
                }
            }
            let actions: readonly CodeFixAction[] = [];
            try {
                actions = this.languageService.getCodeFixesAtPosition(document.uri, document.offsetAt(range.start), document.offsetAt(range.end), codes, formatingOptions, completionOptions);
            } catch (e) {

            }
            for (let action of actions) {
                let changes: TextEdit[] = [];
                let workspaceEdit: WorkspaceEdit = {
                    changes: {
                        [document.uri]: changes
                    }
                }
                for (let change of action.changes) {
                    for (let textChange of change.textChanges) {
                        if (action.description.startsWith("Add import from")) {
                            textChange.newText = textChange.newText.replace(/'/g, '"');
                            let newImport = /"(.*)"/g.exec(textChange.newText);
                            if (newImport && newImport.length > 1) {
                                let finalPath = simplifyPath(newImport[1], document.uri);
                                action.description = "Add import from " + finalPath;
                                textChange.newText = textChange.newText.replace(newImport[1], finalPath);
                            }
                        }
                        else if (action.fixName === "fixClassDoesntImplementInheritedAbstractMember") {
                            let isInsideClass = false;
                            for (let shortName in parsedFile.classes) {
                                let classInfo = parsedFile.classes[shortName];
                                if (textChange.span.start >= classInfo.start && textChange.span.start <= classInfo.end) {
                                    isInsideClass = true;
                                }
                            }
                            if (isInsideClass) {
                                let index = getSectionStart(file, "methods")
                                if (index != -1) {
                                    textChange.span.start = index;
                                }
                                // check modifier
                                if (!textChange.newText.match(/ (public|protected) /g)) {
                                    textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1public $2")
                                }

                                // check override
                                if (!textChange.newText.match(/(public|protected)[ ]*?override/g)) {
                                    textChange.newText = textChange.newText.replace(/((public|protected)[ ]*?)([a-z])/g, "$1override $3");
                                }

                                // add doc
                                textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1/**$1 * @inheritdoc$1 */$1$2")

                            }
                            else if (textChange.newText.startsWith("import ")) {
                                textChange.newText = textChange.newText.replace(/'/g, '"');
                                let newImport = /"(.*)"/g.exec(textChange.newText);
                                if (newImport && newImport.length > 1) {
                                    let finalPath = simplifyPath(newImport[1], document.uri);
                                    textChange.newText = textChange.newText.replace(newImport[1], finalPath);
                                }
                            }
                        }
                        // same as fixClassDoesntImplementInheritedAbstractMember without override keyword
                        else if (action.fixName == "fixClassIncorrectlyImplementsInterface") {
                            let isInsideClass = false;
                            for (let shortName in parsedFile.classes) {
                                let classInfo = parsedFile.classes[shortName];
                                if (textChange.span.start >= classInfo.start && textChange.span.start <= classInfo.end) {
                                    isInsideClass = true;
                                }
                            }
                            if (isInsideClass) {
                                let index = getSectionStart(file, "methods")
                                if (index != -1) {
                                    textChange.span.start = index;
                                }
                                // check modifier
                                if (!textChange.newText.includes(" protected ") && !textChange.newText.includes(" public ")) {
                                    textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1public $2")
                                }

                                // add doc
                                textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1/**$1 * @inheritdoc$1 */$1$2")

                            }
                            else if (textChange.newText.startsWith("import ")) {
                                textChange.newText = textChange.newText.replace(/'/g, '"');
                                let newImport = /"(.*)"/g.exec(textChange.newText);
                                if (newImport && newImport.length > 1) {
                                    let finalPath = simplifyPath(newImport[1], document.uri);
                                    textChange.newText = textChange.newText.replace(newImport[1], finalPath);
                                }
                            }
                        }
                        changes.push({
                            newText: textChange.newText,
                            range: convertRange(document, textChange.span),
                        })
                    }
                }

                result.push({
                    title: action.description,
                    // command:action.commands,
                    edit: workspaceEdit,
                })
            }
        } catch (e) {
            this.printCatchError(e);
        }
        return result;
    }

    public async onReferences(file: AventusFile, position: Position): Promise<Location[]> {
        let result: Location[] = []
        try {

            let offset = file.documentInternal.offsetAt(position);
            let referencedSymbols = this.languageService.findReferences(file.uri, offset);
            if (referencedSymbols) {
                for (let referencedSymbol of referencedSymbols) {
                    for (let reference of referencedSymbol.references) {
                        if (this.filesLoaded[reference.fileName]) {
                            let startPos = this.filesLoaded[reference.fileName].file.documentInternal.positionAt(reference.textSpan.start)
                            let endPos = this.filesLoaded[reference.fileName].file.documentInternal.positionAt(reference.textSpan.start + reference.textSpan.length)
                            result.push(Location.create(reference.fileName, {
                                start: startPos,
                                end: endPos
                            }));
                        }
                    }
                }
            }
        } catch (e) {
            this.printCatchError(e);
        }
        return result;
    }

    public async onCodeLens(file: AventusFile): Promise<CodeLens[]> {
        let result: CodeLens[] = []
        try {

            let currentFile = this.filesLoaded[file.uri]
            if (currentFile && currentFile.fileParsed) {
                let _createCodeLens = async (instances: BaseInfo[]) => {
                    for (let instance of instances) {
                        let startPos = file.documentInternal.positionAt(instance.start)
                        let refs = await this.onReferences(file, startPos);
                        let title = refs.length > 1 ? refs.length + ' references' : refs.length + ' reference';
                        result.push({
                            range: {
                                start: startPos,
                                end: startPos,
                            },
                            command: {
                                title: title,
                                command: refs.length ? 'editor.action.showReferences' : '',
                                arguments: [file.uri, startPos, refs]
                            }
                        });
                    }
                }
                await _createCodeLens(Object.values(currentFile.fileParsed.classes));
                await _createCodeLens(Object.values(currentFile.fileParsed.enums));
                await _createCodeLens(Object.values(currentFile.fileParsed.aliases));

            }

            let propSection = getSectionStart(file, 'props');
            if (propSection != -1) {
                let position = file.documentInternal.positionAt(propSection)
                result.push({
                    range: {
                        start: position,
                        end: position,
                    },
                    command: {
                        title: "Add property | attribute",
                        command: 'editor.action.showReferences',
                        arguments: [file.uri]
                    }
                })
            }
        } catch (e) {
            this.printCatchError(e);
        }
        return result;
    }
    public async onRename(file: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {

        let references = this.languageService.getFileReferences(file.uri);
        let offset: number = file.documentInternal.offsetAt(position);
        let pref: UserPreferences = {};
        let renameInfo: RenameInfo = this.languageService.getRenameInfo(file.uri, offset, pref)
        if (!renameInfo.canRename) {
            return null;
        }
        let renameLocations = this.languageService.findRenameLocations(file.uri, offset, false, false, pref);
        if (!renameLocations) {
            return null;
        }
        let res: WorkspaceEdit = {
            changes: {

            }
        };
        if (res.changes) {
            for (let renameLocation of renameLocations) {
                let file = this.filesLoaded[renameLocation.fileName];
                if (file) {
                    if (!res.changes[renameLocation.fileName]) {
                        res.changes[renameLocation.fileName] = []
                    }
                    let textEdit: TextEdit = {
                        newText: newName,
                        range: {
                            start: this.filesLoaded[renameLocation.fileName].file.documentInternal.positionAt(renameLocation.textSpan.start),
                            end: this.filesLoaded[renameLocation.fileName].file.documentInternal.positionAt(renameLocation.textSpan.start + renameLocation.textSpan.length)
                        }
                    }
                    res.changes[renameLocation.fileName].push(textEdit);
                }
            }
        }
        return res;
    }

    public async onRenameFile(oldUri: string, newUri: string): Promise<{ [uri: string]: TextEdit[] }> {

        let result = {};
        let references = this.languageService.getFileReferences(oldUri);

        for (let reference of references) {
            let file = FilesManager.getInstance().getByUri(reference.fileName);
            if (file) {
                let textEdits: TextEdit[] = [];
                let splittedFile = file.folderUri.split("/");
                let splittedNewUri = newUri.split("/");

                while (splittedFile.length > 0 && splittedNewUri.length > 0) {
                    if (splittedFile[0] == splittedNewUri[0]) {
                        splittedFile.splice(0, 1);
                        splittedNewUri.splice(0, 1);
                    }
                    else {
                        break;
                    }
                }

                let newTextArr: string[] = [];
                if (splittedFile.length > 0) {
                    for (let i = 0; i < splittedFile.length; i++) {
                        newTextArr.push("..");
                    }
                }
                else {
                    newTextArr.push(".");
                }

                for (let newUriPart of splittedNewUri) {
                    newTextArr.push(newUriPart);
                }

                textEdits.push({
                    newText: newTextArr.join("/"),
                    range: {
                        start: file.documentInternal.positionAt(reference.textSpan.start),
                        end: file.documentInternal.positionAt(reference.textSpan.start + reference.textSpan.length)
                    }
                })

                result[file.uri] = textEdits;
            }
        }



        return result;
    }

    private static removeComments(txt: string): string {
        let regex = /(\".*?\"|\'.*?\')|(\/\*.*?\*\/|\/\/[^(\r\n|\n)]*$)/gm
        txt = txt.replace(regex, (match, grp1, grp2) => {
            if (grp2) {
                return "";
            }
            return grp1;
        })
        return txt;
    }

    private static replaceFirstExport(txt: string): string {
        return txt.replace(/^\s*export\s+(class|interface|enum|type|abstract|function)/m, "$1");
    }
    private static prepareDataSchema(classInfo: ClassInfo, moduleName: string, npm?: boolean): string {
        let template: { [prop: string]: string } = {};
        const _loadType = (type: TypeInfo) => {
            if (type.kind == "boolean") {
                return 'boolean';
            }
            else if (type.kind == "number") {
                return 'number';
            }
            else if (type.kind == "string") {
                return "string";
            }
            else if (type.kind == "type") {
                if (type.value.includes(".")) {
                    return type.value;
                }
                else {
                    let importInfo = classInfo.parserInfo.importsLocal[type.value]?.info
                    if (importInfo) {
                        let name = npm ? importInfo.name : moduleName + '.' + importInfo.fullName
                        return name;
                    }
                    return type.value;
                }
            }
            else if (type.kind == "literal" || type.kind == "typeLiteral") {
                return 'literal'
            }
            return null;
        }
        for (let propName in classInfo.properties) {
            let prop = classInfo.properties[propName];
            if (prop.isStatic) {
                continue;
            }
            let found = false;
            for (let decorator of prop.decorators) {
                let foreignKey = ForeignKeyDecorator.is(decorator);
                if (foreignKey) {
                    found = true;
                    let importInfo = classInfo.parserInfo.importsLocal[foreignKey.refType]?.info;
                    if (foreignKey.refType.includes(".")) {
                        template[propName] = 'ref:' + foreignKey.refType;
                    }
                    else if (importInfo) {
                        let name = npm ? importInfo.name : moduleName + '.' + importInfo.fullName
                        template[propName] = 'ref:' + name;
                    }
                    else {
                        template[propName] = 'ref:' + foreignKey.refType;
                    }
                }
            }
            if (!found) {
                let resultTemp = _loadType(prop.type);
                if (resultTemp) {
                    template[propName] = resultTemp;
                }
            }
        }
        let result = JSON.stringify(template).replace(/\\"/g, '"');
        if (classInfo.parentClass) {
            let name = npm ? classInfo.extendsNpm[0] : classInfo.parentClass.fullName;
            result = `{...(${name}?.$schema ?? {}), ${result.slice(1)}`;
        }
        return result;
    }


    public static compileTs(element: BaseInfo, file: AventusTsFile): CompileTsResult {
        let result: CompileTsResult = {
            compiled: "",
            hotReload: "",
            docVisible: "",
            docInvisible: "",
            dependances: element.dependances,
            classScript: "",
            classDoc: "",
            debugTxt: "",
            uri: file.file.uri,
            required: false,
            type: element.infoType,
            isExported: {
                external: element.isExported,
                internal: element.isInternalExported
            },
            convertibleName: '',
            npm: {
                defTs: "",
                namespace: "",
                exportPath: "",
                uri: file.file.uri,
                src: ""
            },
            story: {}
        }
        try {
            let additionContent = "";
            let additionContentNpm = "";
            // prepare content
            let txt = element.compiledContent;
            let txtHotReload = element.compiledContentHotReload;
            let moduleName = file.build.module;
            if (element instanceof ClassInfo && !element.isInterface) {
                let currentNamespaceWithDot = "";
                if (element.namespace) {
                    currentNamespaceWithDot = "." + element.namespace
                }
                additionContent += element.fullName + ".Namespace=`" + moduleName + currentNamespaceWithDot + "`;" + EOL;
                additionContentNpm += element.name + ".Namespace=`" + moduleName + currentNamespaceWithDot + "`;" + EOL;
                if (element.implements.includes('Aventus.IData')) {
                    result.type = InfoType.classData;
                }
                if (element.convertibleName) {
                    additionContent += element.fullName + ".$schema=" + this.prepareDataSchema(element, moduleName) + ";" + EOL;
                    additionContentNpm += element.name + ".$schema=" + this.prepareDataSchema(element, moduleName) + ";" + EOL;
                    additionContent += "Aventus.Converter.register(" + element.fullName + "." + element.convertibleName + ", " + element.fullName + ");" + EOL
                    additionContentNpm += "Aventus.Converter.register(" + element.fullName + "." + element.convertibleName + ", " + element.fullName + ");" + EOL
                }
                else if (element.implements.includes('Aventus.IData')) {
                    additionContent += element.fullName + ".$schema=" + this.prepareDataSchema(element, moduleName) + ";" + EOL;
                    additionContentNpm += element.name + ".$schema=" + this.prepareDataSchema(element, moduleName) + ";" + EOL;
                    additionContent += "Aventus.Converter.register(" + element.fullName + ".Fullname, " + element.fullName + ");" + EOL;
                    additionContentNpm += "Aventus.Converter.register(" + element.fullName + ".Fullname, " + element.fullName + ");" + EOL;
                }
                result.convertibleName = element.convertibleName;

            }
            else if (element instanceof VariableInfo) {
                txt = element.type + " " + element.compiledContent;
                txtHotReload = element.type + " " + element.compiledContentHotReload;
            }


            txt = this.removeComments(txt);
            txt = this.replaceFirstExport(txt);
            const transpiled = transpile(txt, compilerOptionsCompile);
            result.compiled = transpiled + additionContent;

            if (HttpServer.isRunning) {
                txtHotReload = this.removeComments(txtHotReload);
                txtHotReload = this.replaceFirstExport(txtHotReload);
                result.hotReload = transpile(txtHotReload, compilerOptionsCompile);
            }

            let rawDoc = this.compileDocTs(txt, element);
            let doc = DefinitionCorrector.correct(rawDoc, element);

            let buildNpm = this.compileTsToNpm(element, file);
            if (buildNpm) {
                result.npm = buildNpm;
            }

            if (doc.length > 0) {
                let namespaceTxt = element.namespace;
                if (namespaceTxt.length > 0) {
                    rawDoc = "namespace " + namespaceTxt + " {\r\n" + rawDoc + "}\r\n";
                    doc = "namespace " + namespaceTxt + " {\r\n" + doc + "}\r\n";
                }
                if (element.isExported) {
                    result.docVisible = doc;
                }
                else {
                    result.docInvisible = doc;
                }
            }

            const wrapToNamespace = () => {
                let resultWithNamespace = "";
                let hasNamespace = file.build.namespaces.includes(element.fullName);
                if (hasNamespace) {
                    resultWithNamespace += '_n = ' + element.fullName + ';' + EOL
                }

                let finalCompiled = result.compiled;
                if (element instanceof VariableInfo) {
                    finalCompiled = finalCompiled.slice(finalCompiled.indexOf("=") + 1);
                    if (element.fullName.includes(".")) {
                        finalCompiled = element.fullName + "=" + finalCompiled;
                    }
                    else {
                        finalCompiled = "let " + element.fullName + "=" + finalCompiled;
                    }
                }
                else if (element instanceof EnumInfo) {
                    let toReplace = `})(${element.name} || (${element.name} = {}))`
                    let replacement = `})(${element.fullName} || (${element.fullName} = {}))`
                    finalCompiled = finalCompiled.replaceAll(toReplace, replacement);
                    if (element.fullName.includes(".")) {
                        let splitted = finalCompiled.split("\n");
                        splitted.splice(0, 1);
                        finalCompiled = splitted.join("\n");
                    }
                }
                else {
                    finalCompiled = element.fullName + "=" + result.compiled;
                    if (!element.fullName.includes(".")) {
                        finalCompiled = `let ${finalCompiled}`;
                    }

                }
                if (element.isExported) {
                    finalCompiled += "_." + element.fullName + "=" + element.fullName + ";";
                    finalCompiled += EOL;
                }

                resultWithNamespace += finalCompiled;

                if (hasNamespace) {
                    resultWithNamespace += EOL + 'Object.assign(' + element.fullName + ', _n);' + EOL
                }
                return resultWithNamespace;
            }

            let debugTxt = result.compiled;
            if (result.compiled.length > 0) {
                result.classScript = element.fullName;
                result.compiled = wrapToNamespace();
            }
            if (result.docVisible.length > 0 || result.docInvisible.length > 0) {
                result.classDoc = element.fullName;
            }


            for (let decorator of element.decorators) {
                let debugInfo = DebuggerDecorator.is(decorator);
                if (debugInfo && debugInfo.writeCompiled) {
                    result.debugTxt = debugTxt
                }
                if (RequiredDecorator.is(decorator)) {
                    result.required = true;
                }
            }
        } catch (e: any) {
            this.printCatchError(e);
        }
        return result;
    }

    public static compileTsToNpm(element: BaseInfo, file: AventusTsFile): CompileTsResultNpm | null {
        try {
            if (!file.build.hasNpmOutput) return null;
            const result: CompileTsResultNpm = {
                defTs: "",
                namespace: "",
                exportPath: "",
                uri: file.file.uri,
                src: ""
            }
            let additionContentNpm = "";
            // prepare content
            let txt = element.compiledContentNpm;
            let moduleName = file.build.module;
            if (element instanceof ClassInfo && !element.isInterface) {
                let currentNamespaceWithDot = "";
                if (element.namespace) {
                    currentNamespaceWithDot = "." + element.namespace
                }
                additionContentNpm += element.name + ".Namespace=`" + moduleName + currentNamespaceWithDot + "`;" + EOL;
                if (element.convertibleName) {
                    additionContentNpm += element.name + ".$schema=" + this.prepareDataSchema(element, moduleName, true) + ";" + EOL;
                    const converterName = file.build.getNpmReplacementName("", "Aventus.Converter")
                    additionContentNpm += converterName + ".register(" + element.name + "." + element.convertibleName + ", " + element.name + ");" + EOL
                    if (file.fileParsed) {
                        file.fileParsed.registerGeneratedImport({
                            uri: '@aventusjs/main/Aventus',
                            name: "Converter",
                            compiled: true,
                            alias: converterName,
                            forced: false
                        });
                    }
                }
                else if (element.implements.includes('Aventus.IData')) {
                    additionContentNpm += element.name + ".$schema=" + this.prepareDataSchema(element, moduleName, true) + ";" + EOL;
                    const converterName = file.build.getNpmReplacementName("", "Aventus.Converter")
                    additionContentNpm += converterName + ".register(" + element.name + ".Fullname, " + element.name + ");" + EOL;
                    if (file.fileParsed) {
                        file.fileParsed.registerGeneratedImport({
                            uri: '@aventusjs/main/Aventus',
                            name: "Converter",
                            compiled: true,
                            alias: converterName,
                            forced: false
                        });
                    }
                }
            }
            else if (element instanceof VariableInfo) {
                txt = element.type + " " + element.compiledContentNpm;
            }

            txt = this.removeComments(txt);
            txt = this.replaceFirstExport(txt);
            const transpiled = transpile(txt, compilerOptionsCompile);

            const rawDoc = this.compileDocTs(txt, element);

            result.namespace = file.build.module;
            if (element.namespace.length > 0) {
                result.namespace += "." + element.namespace
            }
            result.defTs = rawDoc;
            result.src = transpiled + additionContentNpm;

            let pathFileTemp = file.file.path.replace(file.build.project.getConfigFile().path.replace(AventusExtension.Config, ""), "")
            pathFileTemp = pathFileTemp.replace(AventusExtension.Base, ".js");
            result.exportPath = pathFileTemp;

            return result;

        } catch (e: any) {
            this.printCatchError(e);
        }
        return null;
    }

    public static compileDocTs(txt: string, element: BaseInfo): string {
        try {
            const host: LanguageServiceHost = {
                getCompilationSettings: () => {
                    return {
                        allowJs: true,
                        declaration: true
                    }
                },
                getScriptFileNames: () => ["temp.js"],
                getScriptKind: (fileName) => {
                    return ScriptKind.TS;
                },
                getScriptVersion: (fileName: string) => {
                    return '1';
                },
                getScriptSnapshot: (fileName: string) => {
                    let text = txt;
                    return {
                        getText: (start, end) => text?.substring(start, end) || '',
                        getLength: () => text?.length || 0,
                        getChangeRange: () => undefined
                    };
                },
                getCurrentDirectory: () => '',
                getDefaultLibFileName: (_options: CompilerOptions) => '',
                readFile: (path: string, _encoding?: string | undefined): string | undefined => {
                    return txt;
                },
                fileExists: (path: string): boolean => {
                    return true;
                },
                directoryExists: (path: string): boolean => {
                    // typescript tries to first find libraries in node_modules/@types and node_modules/@typescript
                    // there's no node_modules in our setup
                    if (path.startsWith('node_modules')) {
                        return false;
                    }
                    return true;

                },

            };
            let ls: LanguageService = createLanguageService(host);
            let result = ls.getEmitOutput("temp.js", true, true).outputFiles[0].text.replace(/^declare /g, '');
            if(element instanceof ClassInfo && !element.constructorBody && element.extraConstructorCode.length > 0) {
                result = result.replace(/^ *constructor\(.*\);$/gm, "");
            }
            return result;
        } catch (e) {
            this.printCatchError(e);
        }
        return "";
    }
    public static removeUnusedImport(txt: string, forcedDependances: string[]): string {
        try {
            let document = TextDocument.create("temp.js", "js", 1, txt);
            const host: LanguageServiceHost = {
                getCompilationSettings: () => {
                    return {
                        noUnusedLocals: true,
                        allowNonTsExtensions: true,
                        allowJs: true
                    }
                },
                getScriptFileNames: () => ["temp.js"],
                getScriptKind: (fileName) => {
                    return ScriptKind.TS;
                },
                getScriptVersion: (fileName: string) => {
                    return '1';
                },
                getScriptSnapshot: (fileName: string) => {
                    let text = txt;
                    return {
                        getText: (start, end) => text?.substring(start, end) || '',
                        getLength: () => text?.length || 0,
                        getChangeRange: () => undefined
                    };
                },
                getCurrentDirectory: () => '',
                getDefaultLibFileName: (_options: CompilerOptions) => '',
                readFile: (path: string, _encoding?: string | undefined): string | undefined => {
                    if (path == "temp.js")
                        return txt;
                    return ""
                },
                fileExists: (path: string): boolean => {
                    return false;
                },
                directoryExists: (path: string): boolean => {
                    return false;
                },

            };
            let ls: LanguageService = createLanguageService(host);
            const semanticDiagnostics: DiagnosticTs[] = ls.getSemanticDiagnostics("temp.js");
            const unusedRanges: { start: number, length: number }[] = [];
            for (let diag of semanticDiagnostics) {
                if (diag.reportsUnnecessary && diag.start != undefined) {
                    const position = document.positionAt(diag.start);
                    const start: Position = { line: position.line, character: 0 }
                    const end: Position = { line: position.line, character: 6 }
                    const isImport = txt.slice(document.offsetAt(start), document.offsetAt(end)) == "import";
                    if (isImport) {
                        const execResult = /'(\S*)'/.exec(diag.messageText + '');
                        if (execResult && execResult[1]) {
                            if (forcedDependances.includes(execResult[1]))
                                continue;
                        }
                        unusedRanges.push({
                            start: diag.start!,
                            length: diag.length!
                        });
                    }
                }
            }
            unusedRanges.sort((a, b) => b.start - a.start);

            for (let range of unusedRanges) {
                txt = txt.slice(0, range.start) + txt.slice(range.start + range.length);
            }

            // Nettoyage des importations
            txt = txt.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];\s*/g, (importStatement) => {
                // Supprimer les virgules résiduelles
                // Nettoyage des alias vides
                let cleanedImport = importStatement.replace(/(,|{)(?:\s*(\S+)\s+as\s+)(?=,|})/g, '$1');
                cleanedImport = cleanedImport
                    .replace(/(,\s*)+/g, ', ') // Remplace les doubles virgules par une seule
                    .replace(/,\s*}/g, ' }') // Supprime la virgule avant la fermeture d'accolade
                    .replace(/{\s*,/g, '{ '); // Supprime la premiere virgule


                // Si l'import est vide, supprimer l'importation entière
                if (cleanedImport.match(/\{\s*\}/)) {
                    return '';
                }

                return cleanedImport;
            });
            return txt
        } catch (e) {
            this.printCatchError(e);
        }
        return "";
    }
    public static getCompilerOptionsCompile(): CompilerOptions {
        return compilerOptionsCompile;
    }

    private printCatchError(e: any) {
        AventusTsLanguageService.printCatchError(e);
    }
    private static printCatchError(e: any) {
        let regex = /^Debug Failure\. Expected \d+ <= \d+$/g;
        if (!regex.test(e.message))
            console.error(e);
    }
}
//#region definition const + tools function
export type CompileDependance = {
    fullName: string,
    uri: string,
    isStrong: boolean,
}
export type CompileTsResultNpm = {
    namespace: string,
    defTs: string,
    exportPath: string,
    uri: string,
    src: string
}
export type CompileTsResultStory = {

}
export type CompileTsResult = {
    compiled: string,
    hotReload: string,
    docVisible: string,
    docInvisible: string,
    dependances: CompileDependance[],
    classScript: string,
    classDoc: string,
    debugTxt: string,
    uri: string,
    required: boolean,
    type: InfoType,
    isExported: {
        internal: boolean,
        external: boolean
    },
    convertibleName: string,
    tagName?: string,
    npm: CompileTsResultNpm;
    story: CompileTsResultStory
}


const compilerOptionsRead: CompilerOptions = {
    allowNonTsExtensions: true,
    jsx: JsxEmit.None,
    importHelpers: false,
    allowJs: true,
    checkJs: false,
    lib: ['lib.es2022.full.d.ts'],
    target: ScriptTarget.ES2022,
    moduleDetection: ModuleDetectionKind.Force,
    moduleResolution: ModuleResolutionKind.NodeNext,
    experimentalDecorators: true,
    noImplicitOverride: true,
    strictPropertyInitialization: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    strictNullChecks: true,
    verbatimModuleSyntax: true
};
const compilerOptionsCompile: CompilerOptions = {
    allowNonTsExtensions: true,
    jsx: JsxEmit.None,
    importHelpers: false,
    allowJs: true,
    checkJs: false,
    lib: ['lib.es2022.full.d.ts'],
    target: ScriptTarget.ES2022,
    moduleDetection: ModuleDetectionKind.Auto,
    moduleResolution: ModuleResolutionKind.NodeNext,
    experimentalDecorators: true,
    noImplicitOverride: true,
    strictPropertyInitialization: true,
    noImplicitReturns: true,
    strictNullChecks: true,
    verbatimModuleSyntax: true
};
const completionOptions: GetCompletionsAtPositionOptions = {
    includeExternalModuleExports: true,
    includeInsertTextCompletions: true,
    includeCompletionsWithClassMemberSnippets: true,
    includeAutomaticOptionalChainCompletions: true,
    includeCompletionsForImportStatements: true,
    includeCompletionsForModuleExports: true,
    includeCompletionsWithInsertText: true,
    // includeCompletionsWithObjectLiteralMethodSnippets:true, => create double 
    // includeCompletionsWithSnippetText:true, => $0 appear in fct
    includeInlayEnumMemberValueHints: true,
    includeInlayFunctionLikeReturnTypeHints: true,
    includeInlayFunctionParameterTypeHints: true,
    includeInlayParameterNameHints: "all",
    includeInlayParameterNameHintsWhenArgumentMatchesName: true,
    includeInlayPropertyDeclarationTypeHints: true,
    //includeInlayVariableTypeHints:true,
    useLabelDetailsInCompletionEntries: true,
    importModuleSpecifierEnding: "index",
    importModuleSpecifierPreference: "relative",
}
const formatingOptions: FormatCodeSettings = {
    convertTabsToSpaces: true,
    tabSize: 4,
    indentSize: 4,
    indentStyle: IndentStyle.Smart,
    newLineCharacter: '\n',
    baseIndentSize: 0,
    insertSpaceAfterCommaDelimiter: true,
    insertSpaceAfterConstructor: false,
    insertSpaceAfterSemicolonInForStatements: true,
    insertSpaceBeforeAndAfterBinaryOperators: true,
    insertSpaceAfterKeywordsInControlFlowStatements: false,
    insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
    insertSpaceBeforeFunctionParenthesis: false,
    // insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: true,
    // insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: true,
    // insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
    // insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: true,
    // insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: true,
    // insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: true,
    insertSpaceAfterTypeAssertion: true,
    placeOpenBraceOnNewLineForControlBlocks: false,
    placeOpenBraceOnNewLineForFunctions: false,
    semicolons: SemicolonPreference.Insert,
    insertSpaceBeforeTypeAnnotation: false,
}
const enum Kind {
    alias = 'alias',
    callSignature = 'call',
    class = 'class',
    const = 'const',
    constructorImplementation = 'constructor',
    constructSignature = 'construct',
    directory = 'directory',
    enum = 'enum',
    enumMember = 'enum member',
    externalModuleName = 'external module name',
    function = 'function',
    indexSignature = 'index',
    interface = 'interface',
    keyword = 'keyword',
    let = 'let',
    localFunction = 'local function',
    localVariable = 'local var',
    method = 'method',
    memberGetAccessor = 'getter',
    memberSetAccessor = 'setter',
    memberVariable = 'property',
    module = 'module',
    primitiveType = 'primitive type',
    script = 'script',
    type = 'type',
    variable = 'var',
    warning = 'warning',
    string = 'string',
    parameter = 'parameter',
    typeParameter = 'type parameter'
}
function convertKind(kind: string): CompletionItemKind {
    switch (kind) {
        case Kind.primitiveType:
        case Kind.keyword:
            return CompletionItemKind.Keyword;

        case Kind.const:
        case Kind.let:
        case Kind.variable:
        case Kind.localVariable:
        case Kind.alias:
        case Kind.parameter:
            return CompletionItemKind.Variable;

        case Kind.memberVariable:
        case Kind.memberGetAccessor:
        case Kind.memberSetAccessor:
            return CompletionItemKind.Field;

        case Kind.function:
        case Kind.localFunction:
            return CompletionItemKind.Function;

        case Kind.method:
        case Kind.constructSignature:
        case Kind.callSignature:
        case Kind.indexSignature:
            return CompletionItemKind.Method;

        case Kind.enum:
            return CompletionItemKind.Enum;

        case Kind.enumMember:
            return CompletionItemKind.EnumMember;

        case Kind.module:
        case Kind.externalModuleName:
            return CompletionItemKind.Module;

        case Kind.class:
        case Kind.type:
            return CompletionItemKind.Class;

        case Kind.interface:
            return CompletionItemKind.Interface;

        case Kind.warning:
            return CompletionItemKind.Text;

        case Kind.script:
            return CompletionItemKind.File;

        case Kind.directory:
            return CompletionItemKind.Folder;

        case Kind.string:
            return CompletionItemKind.Constant;

        default:
            return CompletionItemKind.Property;
    }
}


export function simplifyPath(importPathTxt, currentPath) {
    importPathTxt = decodeURIComponent(importPathTxt);
    if (importPathTxt.startsWith("custom://")) {
        return importPathTxt;
    }
    let currentDir: string[] = [];
    if (sep === "/") {
        currentDir = decodeURIComponent(currentPath).replace("file://", "").split("/");
    }
    else {
        currentDir = decodeURIComponent(currentPath).replace("file:///", "").split("/");
    }
    currentDir.pop();
    let currentDirPath = normalize(currentDir.join("/")).split(sep);
    let finalImportPath = normalize(currentDir.join("/") + "/" + importPathTxt);
    let importPath = finalImportPath.split(sep);
    for (let i = 0; i < currentDirPath.length; i++) {
        if (importPath.length > i) {
            if (currentDirPath[i] == importPath[i]) {
                currentDirPath.splice(i, 1);
                importPath.splice(i, 1);
                i--;
            }
            else {
                break;
            }
        }
    }
    let finalPathToImport = "";
    for (let i = 0; i < currentDirPath.length; i++) {
        finalPathToImport += '../';
    }
    if (finalPathToImport == "") {
        finalPathToImport += "./";
    }
    finalPathToImport += importPath.join("/");
    return finalPathToImport;
}
function isWhitespaceOnly(str: string) {
    return /^\s*$/.test(str);
}
function generateIndent(level: number, options: FormattingOptions) {
    if (options.insertSpaces) {
        return repeat(' ', level * options.tabSize);
    } else {
        return repeat('\t', level);
    }
}
function repeat(value: string, count: number) {
    let s = '';
    while (count > 0) {
        if ((count & 1) === 1) {
            s += value;
        }
        value += value;
        count = count >>> 1;
    }
    return s;
}
export type SectionType = "static" | "props" | "variables" | "states" | "constructor" | "methods";
export function getSectionStart(file: AventusFile, sectionName: SectionType): number {
    let regex = new RegExp("//#region " + sectionName + "(\\s|\\S)*?//#endregion")
    let match = regex.exec(file.documentInternal.getText());
    if (match) {
        return match.index + 10 + sectionName.length;
    }
    return -1
}
//#endregion