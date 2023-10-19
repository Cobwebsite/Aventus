import { EOL } from 'os';
import { normalize, sep } from 'path';
import { CodeFixAction, CompilerOptions, CompletionInfo, createLanguageService, Diagnostic as DiagnosticTs, displayPartsToString, Extension, flattenDiagnosticMessageText, FormatCodeSettings, GetCompletionsAtPositionOptions, IndentStyle, JsxEmit, LanguageService, LanguageServiceHost, ModuleDetectionKind, ModuleResolutionKind, RenameInfo, ResolvedModule, ResolvedModuleFull, resolveModuleName, ScriptKind, ScriptTarget, SemicolonPreference, transpile, WithMetadata } from 'typescript';
import { CodeAction, CodeLens, CompletionItem, CompletionItemKind, CompletionList, Definition, Diagnostic, DiagnosticSeverity, DiagnosticTag, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { AventusExtension, AventusLanguageId } from '../../definition';
import { AventusFile, InternalAventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { convertRange, uriToPath } from '../../tools';
import { AventusTsFile } from './File';
import { loadLibrary, loadTypescriptLib } from './libLoader';
import { BaseInfo, InfoType } from './parser/BaseInfo';
import { ClassInfo } from './parser/ClassInfo';
import { DecoratorInfo } from './parser/DecoratorInfo';
import { DebuggerDecorator } from './parser/decorators/DebuggerDecorator';
import { RequiredDecorator } from './parser/decorators/RequiredDecorator';
import { DefinitionCorrector } from './parser/DefinitionCorrector';
import { TypeInfo } from './parser/TypeInfo';
import { ForeignKeyDecorator } from './parser/decorators/ForeignKeyDecorator';
import { ParserTs } from './parser/ParserTs';
import { existsSync, writeFileSync } from 'fs';
import { FilesManager } from '../../files/FilesManager';
import { EditFile } from '../../notification/EditFile';
import { VariableInfo } from './parser/VariableInfo';
import { BindThisDecorator } from './parser/decorators/BindThisDecorator';
import { EnumInfo } from './parser/EnumInfo';



export class AventusTsLanguageService {
    private languageService: LanguageService;
    private languageServiceNamespace: LanguageService;
    private build: Build;
    private filesNeeded: string[] = [];
    private filesLoaded: { [uri: string]: AventusTsFile } = {}

    public constructor(build: Build) {
        this.build = build;
        loadTypescriptLib();
        this.languageService = createLanguageService(this.createHost());
        this.languageServiceNamespace = createLanguageService(this.createHostNamespace());
    }

    private createHostNamespace(): LanguageServiceHost {
        const that = this;
        const host: LanguageServiceHost = {
            getCompilationSettings: () => compilerOptionsRead,
            getScriptFileNames: () => {
                return this.filesNeeded
            },
            getScriptKind: (fileName) => {
                return ScriptKind.TS;
            },
            getScriptVersion: (fileName: string) => {
                if (this.filesLoaded[fileName]) {
                    return String(this.filesLoaded[fileName].file.version);
                }
                return '1';
            },
            getScriptSnapshot: (fileName: string) => {
                let text = '';
                if (this.filesLoaded[fileName]) {
                    text = this.filesLoaded[fileName].file.content;
                } else {
                    text = loadLibrary(fileName);
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
                    return this.filesLoaded[fileName].file.content;
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
                const resolvedModules: ResolvedModule[] = [];
                for (let moduleName of moduleNames) {
                    let file = FilesManager.getInstance().getByUri(containingFile);
                    if (file) {
                        moduleName = that.build.project.resolveAlias(moduleName, file);
                    }
                    let result = resolveModuleName(moduleName, containingFile, compilerOptionsRead, this)
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
            },
        };
        return host;
    }
    private createHost(): LanguageServiceHost {
        const that = this;
        const host: LanguageServiceHost = {
            getCompilationSettings: () => compilerOptionsRead,
            getScriptFileNames: () => {
                return this.filesNeeded
            },
            getScriptKind: (fileName) => {
                return ScriptKind.TS;
            },
            getScriptVersion: (fileName: string) => {
                if (this.filesLoaded[fileName]) {
                    return String(this.filesLoaded[fileName].file.version);
                }
                return '1';
            },
            getScriptSnapshot: (fileName: string) => {
                let text = '';
                if (this.filesLoaded[fileName]) {
                    text = this.filesLoaded[fileName].contentForLanguageService;
                } else {
                    text = loadLibrary(fileName);
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
                    return this.filesLoaded[fileName].contentForLanguageService;
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
                const resolvedModules: ResolvedModule[] = [];
                for (let moduleName of moduleNames) {
                    let file = FilesManager.getInstance().getByUri(containingFile);
                    if (file) {
                        moduleName = that.build.project.resolveAlias(moduleName, file);
                    }
                    let result = resolveModuleName(moduleName, containingFile, compilerOptionsRead, this)
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
            },
        };
        return host;
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
            let result: Diagnostic[] = [];
            const syntaxDiagnostics: DiagnosticTs[] = this.languageService.getSyntacticDiagnostics(file.uri);
            const semanticDiagnostics: DiagnosticTs[] = this.languageService.getSemanticDiagnostics(file.uri);
            const allNormalDiagnostics: DiagnosticTs[] = syntaxDiagnostics.concat(semanticDiagnostics);
            for (let diag of allNormalDiagnostics) {
                if (diag.code == 1206) { continue; } // Decorators not valid
                let msg = `${flattenDiagnosticMessageText(diag.messageText, '\n')}`
                if (diag.reportsUnnecessary) {
                    result.push({
                        range: convertRange(file.document, diag),
                        severity: DiagnosticSeverity.Hint,
                        source: AventusLanguageId.TypeScript,
                        message: msg,
                        tags: [DiagnosticTag.Unnecessary]
                    })
                }
                else {
                    result.push({
                        range: convertRange(file.document, diag),
                        severity: DiagnosticSeverity.Error,
                        source: AventusLanguageId.TypeScript,
                        message: msg,
                    })
                }
            }
            return result;
        } catch (e) {
            console.error(e);
        }
        return [];
    }

    public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
        try {
            let document = file.document;

            let offset = document.offsetAt(position);
            let replaceRange = convertRange(document, getWordAtText(document.getText(), offset, JS_WORD_REGEX));
            let completions: WithMetadata<CompletionInfo> | undefined;
            try {
                completions = this.languageService.getCompletionsAtPosition(document.uri, offset, completionOptions);
            } catch (e) {
                console.error(e);
            }

            if (!completions) {
                return { isIncomplete: false, items: [] };
            }

            let items: CompletionItem[] = [];
            for (let i = 0; i < completions.entries.length; i++) {
                let entry = completions.entries[i];
                let remplacement = entry.insertText ? entry.insertText : entry.name
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
                    data: { // data used for resolving item details (see 'doResolve')
                        ...entry.data,
                        ...customData
                    },
                }
                items.push(completionEntry)
            }
            return { isIncomplete: false, items: items };
        } catch (e) {
            console.error(e);
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
                        tsFile.file.content,
                        completionOptions,
                        item.data);

                    if (details) {
                        item.detail = displayPartsToString(details.displayParts);
                        item.documentation = displayPartsToString(details.documentation);
                        item.additionalTextEdits = [];
                        if (details.codeActions) {
                            for (let i = 0; i < details.codeActions.length; i++) {
                                for (let change of details.codeActions[i].changes) {
                                    for (let txtChange of change.textChanges) {
                                        txtChange.newText = txtChange.newText.replace(/'/g, '"');
                                        let newImport = /"(.*)"/g.exec(txtChange.newText);
                                        if (newImport && newImport.length > 1) {
                                            let finalPath = simplifyPath(newImport[1], tsFile.file.uri);
                                            item.detail += "\r\nimport from " + finalPath;
                                            txtChange.newText = txtChange.newText.replace(newImport[1], finalPath);
                                        }

                                        item.additionalTextEdits.push({
                                            newText: txtChange.newText,
                                            range: convertRange(tsFile.file.document, txtChange.span)
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
            console.error(e);
        }
        return item;
    }


    public async doHover(file: AventusFile, position: Position): Promise<Hover | null> {
        try {
            let info = this.languageService.getQuickInfoAtPosition(file.uri, file.document.offsetAt(position));
            if (info) {

                let textDoc: string[] = []
                if (info.documentation) {
                    for (let doc of info.documentation) {
                        let parts = doc.text.split("\n");
                        for (let part of parts) {
                            textDoc.push(part);
                        }
                    }
                }
                // if (info.tags) {
                //     for (let tag of info.tags) {
                //         let tagInfo: string[] = [];
                //         if (tag.text) {
                //             let txt = tag.text.map(t => t.text).join("");
                //             let parts = txt.split("\n");
                //             for (let part of parts) {
                //                 part = part.trim();
                //                 if (part.length > 0) {
                //                     tagInfo.push(part);
                //                 }
                //             }
                //         }
                //         if (tagInfo.length > 1) {
                //             textDoc.push("***" + tag.name + "*** \r\n \r\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + tagInfo.join('\r\n \r\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'))
                //         }
                //         else if (tagInfo.length == 1) {
                //             textDoc.push("***" + tag.name + "*** - " + tagInfo[0])
                //         }
                //     }
                // }

                let value: string = "";
                if (info.displayParts) {
                    value += '\n```';
                    value += "typescript";
                    value += '\n';
                    value += displayPartsToString(info.displayParts);
                    value += '\n```\n*** \n';
                }

                value += textDoc.join(' \n');
                return {
                    range: convertRange(file.document, info.textSpan),
                    contents: {
                        kind: 'markdown',
                        value: value
                    }
                };
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    public async findDefinition(file: AventusFile, position: Position): Promise<Definition | null> {
        try {
            let definition = this.languageService.getDefinitionAtPosition(file.uri, file.document.offsetAt(position));
            if (definition && definition.length > 0) {
                let d = definition[0];
                if (d.fileName.endsWith(".avt.ts")) {
                    d.fileName = d.fileName.replace(".avt.ts", ".avt");
                }
                let realDoc = this.filesLoaded[d.fileName];
                if (realDoc) {
                    return {
                        uri: realDoc.file.uri,
                        range: convertRange(realDoc.file.document, d.textSpan)
                    };
                }
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }
    public async format(file: AventusFile, range: Range, formatParams: FormattingOptions): Promise<TextEdit[]> {
        try {
            let document = file.document;
            let start = document.offsetAt(range.start);
            let end = document.offsetAt(range.end);
            let lastLineRange: null | Range = null;
            if (range.end.line > range.start.line && (range.end.character === 0 || isWhitespaceOnly(document.getText().substr(end - range.end.character, range.end.character)))) {
                end -= range.end.character;
                lastLineRange = Range.create(Position.create(range.end.line, 0), range.end);
            }
            let options = { ...formatingOptions };

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
            console.error(e);
        }
        return [];
    }
    public async doCodeAction(file: AventusFile, range: Range): Promise<CodeAction[]> {

        let result: CodeAction[] = [];
        try {
            let parsedFile = ParserTs.parse(file, false, this.build);
            let document = file.document;
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
                                if (!textChange.newText.includes(" protected ")) {
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
            console.error(e);
        }
        return result;
    }

    public async onReferences(file: AventusFile, position: Position): Promise<Location[]> {
        let result: Location[] = []
        try {
            let offset = file.document.offsetAt(position);
            let referencedSymbols = this.languageService.findReferences(file.uri, offset);
            if (referencedSymbols) {
                for (let referencedSymbol of referencedSymbols) {
                    for (let reference of referencedSymbol.references) {
                        if (this.filesLoaded[reference.fileName]) {
                            let startPos = this.filesLoaded[reference.fileName].file.document.positionAt(reference.textSpan.start)
                            let endPos = this.filesLoaded[reference.fileName].file.document.positionAt(reference.textSpan.start + reference.textSpan.length)
                            result.push(Location.create(reference.fileName, {
                                start: startPos,
                                end: endPos
                            }));
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
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
                        let startPos = file.document.positionAt(instance.start)
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
                let position = file.document.positionAt(propSection)
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
            console.error(e);
        }
        return result;
    }
    public async onRename(file: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        let references = this.languageService.getFileReferences(file.uri);
        let offset: number = file.document.offsetAt(position);
        let renameInfo: RenameInfo = this.languageService.getRenameInfo(file.uri, offset)
        if (!renameInfo.canRename) {
            return null;
        }
        let renameLocations = this.languageService.findRenameLocations(file.uri, offset, false, false);
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
                            start: this.filesLoaded[renameLocation.fileName].file.document.positionAt(renameLocation.textSpan.start),
                            end: this.filesLoaded[renameLocation.fileName].file.document.positionAt(renameLocation.textSpan.start + renameLocation.textSpan.length)
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
                let oldEnd = file.document.positionAt(file.content.length);
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
                        start: file.document.positionAt(reference.textSpan.start),
                        end: file.document.positionAt(reference.textSpan.start + reference.textSpan.length)
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
    public static removeDecoratorFromContent(txt: string, decorators: DecoratorInfo[], manualDecorator: string[] = []) {
        txt = txt.trim();
        let decoratorNames = decorators.map(d => d.name).concat(manualDecorator);
        for (let decoratorName of decoratorNames) {
            txt = txt.replace(new RegExp("@" + decoratorName + "\\s*(\\([^)]*\\))?", "g"), "");
        }
        return txt.trim();
    }
    private static replaceFirstExport(txt: string): string {
        return txt.replace(/^\s*export\s+(class|interface|enum|type|abstract|function)/m, "$1");
    }
    private static prepareDataSchema(classInfo: ClassInfo) {
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
                    if (classInfo.parserInfo.imports[type.value]) {
                        return '"+moduleName+".' + classInfo.parserInfo.imports[type.value].fullName;
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
                    if (foreignKey.refType.includes(".")) {
                        template[propName] = 'ref:' + foreignKey.refType;
                    }
                    else if (classInfo.parserInfo.imports[foreignKey.refType]) {
                        template[propName] = 'ref:"+moduleName+".' + classInfo.parserInfo.imports[foreignKey.refType].fullName;
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
        return JSON.stringify(template).replace(/\\"/g, '"');
    }

    private static addBindThis(element: ClassInfo, txt: string, additionalDecorator: string[]) {
        let extraConstructorCode: string[] = [];
        for (let methodName in element.methods) {
            for (let deco of element.methods[methodName].decorators) {
                if (BindThisDecorator.is(deco)) {
                    extraConstructorCode.push(`this.${methodName}=this.${methodName}.bind(this)`);
                }
            }
        }

        if (extraConstructorCode.length > 0) {
            additionalDecorator.push("BindThis");
            if (element.constructorBody.length > 0) {
                let constructorBodyTxt = element.constructorBody;
                constructorBodyTxt = constructorBodyTxt.slice(0, constructorBodyTxt.length - 1);
                constructorBodyTxt += EOL + extraConstructorCode.join(EOL);
                constructorBodyTxt += ' }'

                txt = txt.replace(element.constructorBody, constructorBodyTxt);
            }
            else {
                let start = Object.values(element.methods)[0].fullStart;
                let part = txt.slice(0, start) + EOL;
                part += 'constructor() { super(); ' + EOL + extraConstructorCode.join(EOL) + ' }'
                part += txt.slice(start);
                txt = part;
            }
        }

        return txt;
    }
    public static compileTs(element: BaseInfo, file: AventusTsFile): CompileTsResult {
        let result: CompileTsResult = {
            compiled: "",
            docVisible: "",
            docInvisible: "",
            dependances: element.dependances,
            classScript: "",
            classDoc: "",
            debugTxt: "",
            uri: file.file.uri,
            required: false,
            type: element.infoType,
            isExported: element.isExported,
            convertibleName: ''
        }
        try {
            let additionContent = "";
            // prepare content
            let txt = element.compiledContent;
            let additionalDecorator: string[] = [];
            if (element instanceof ClassInfo && !element.isInterface) {
                if (element.implements.includes('Aventus.IData')) {
                    additionContent += element.fullName + ".$schema=" + this.prepareDataSchema(element) + ";";
                    additionContent += `Aventus.DataManager.register("");`
                    additionContent += "Aventus.DataManager.register(" + element.fullName + ".Fullname, " + element.fullName + ");";
                    additionalDecorator.push("ForeignKey");
                    result.type = InfoType.classData;
                }
                let currentNamespaceWithDot = "";
                if (element.namespace) {
                    currentNamespaceWithDot = "." + element.namespace
                }
                additionContent += element.fullName + ".Namespace=`${moduleName}" + currentNamespaceWithDot + "`;";
                if (element.convertibleName) {
                    additionContent += "Aventus.Converter.register(" + element.fullName + "." + element.convertibleName + ", " + element.fullName + ");"
                }
                result.convertibleName = element.convertibleName;

                txt = this.addBindThis(element, txt, additionalDecorator);
            }

            txt = this.removeDecoratorFromContent(txt, element.decorators, additionalDecorator);
            txt = this.removeComments(txt);
            txt = this.replaceFirstExport(txt);


            result.compiled = transpile(txt, compilerOptionsCompile) + additionContent;
            if (element instanceof VariableInfo) {
                result.compiled = element.type + " " + result.compiled;
            }
            let doc = DefinitionCorrector.correct(this.compileDocTs(txt), element);

            let namespaceTxt = element.namespace;
            if (namespaceTxt.length > 0 && element.isExported) {
                if (doc.length > 0) {
                    result.docVisible = "namespace " + namespaceTxt + " {\r\n" + doc + "}\r\n";
                }
            }
            else {
                if (element.isExported) {
                    result.docVisible = doc;
                }
                else {
                    result.docInvisible = doc;
                }
            }

            const wrapToNamespace = () => {
                let finalCompiled = result.compiled;
                if (element instanceof VariableInfo) {
                    finalCompiled = finalCompiled.slice(finalCompiled.indexOf("=") + 1);
                    if (element.fullName.includes(".")) {
                        finalCompiled = element.fullName + "=" + finalCompiled;
                    }
                    else {
                        finalCompiled = "const " + element.fullName + "=" + finalCompiled;
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
                        finalCompiled = `const ${finalCompiled}`;
                    }

                }

                if (element.isExported) {
                    finalCompiled += EOL;
                    finalCompiled += "_." + element.fullName + "=" + element.fullName + ";";
                }
                return finalCompiled;
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
        } catch (e) {
            console.error(e);
        }
        return result;
    }

    public static compileDocTs(txt: string): string {
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
            return ls.getEmitOutput("temp.js", true, true).outputFiles[0].text.replace(/^declare /g, '');
        } catch (e) {
            console.error(e);
        }
        return "";
    }
    public static getCompilerOptionsCompile(): CompilerOptions {
        return compilerOptionsCompile;
    }
}
//#region definition const + tools function
export type CompileTsResult = {
    compiled: string,
    docVisible: string,
    docInvisible: string,
    dependances: {
        fullName: string,
        uri: string,
        isStrong: boolean,
    }[],
    classScript: string,
    classDoc: string,
    debugTxt: string,
    uri: string,
    required: boolean,
    type: InfoType,
    isExported: boolean,
    convertibleName: string
}

const JS_WORD_REGEX = /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g;

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
    strictNullChecks: true
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
    strictNullChecks: true
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
function isNewlineCharacter(charCode: number) {
    return charCode === '\r'.charCodeAt(0) || charCode === '\n'.charCodeAt(0);
}
function getWordAtText(text: string, offset: number, wordDefinition: RegExp): { start: number; length: number } {
    let lineStart = offset;
    while (lineStart > 0 && !isNewlineCharacter(text.charCodeAt(lineStart - 1))) {
        lineStart--;
    }
    const offsetInLine = offset - lineStart;
    const lineText = text.substr(lineStart);

    // make a copy of the regex as to not keep the state
    const flags = wordDefinition.ignoreCase ? 'gi' : 'g';
    wordDefinition = new RegExp(wordDefinition.source, flags);

    let match = wordDefinition.exec(lineText);
    while (match && match.index + match[0].length < offsetInLine) {
        match = wordDefinition.exec(lineText);
    }
    if (match && match.index <= offsetInLine) {
        return { start: match.index + lineStart, length: match[0].length };
    }

    return { start: offset, length: 0 };
}
function simplifyPath(importPathTxt, currentPath) {
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
    // TODO: use by WC but maybe we can remove it later
    // let finalImportPathComponent = finalImportPath.replace(AventusExtension.ComponentLogic, AventusExtension.Component);
    // if (wcMode.getDocumentByUri(pathToUri(finalImportPathComponent))) {
    //     finalImportPath = finalImportPathComponent;
    // }
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
    let match = regex.exec(file.document.getText());
    if (match) {
        return match.index + 10 + sectionName.length;
    }
    return -1
}
//#endregion