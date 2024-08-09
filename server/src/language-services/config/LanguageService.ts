// import { CompilerOptions, CompletionInfo, Diagnostic as DiagnosticTs, FormatCodeSettings, GetCompletionsAtPositionOptions, IndentStyle, JsxEmit, LanguageService, LanguageServiceHost, ModuleDetectionKind, ModuleResolutionKind, ScriptKind, ScriptTarget, SemicolonPreference, WithMetadata, createLanguageService, displayPartsToString, flattenDiagnosticMessageText } from 'typescript';
// import { AventusTsFile } from '../ts/File';
// import { AventusFile } from '../../files/AventusFile';
// import { CompletionItem, CompletionItemKind, CompletionList, Definition, Diagnostic, DiagnosticSeverity, DiagnosticTag, FormattingOptions, Hover, Location, Position, Range, TextEdit } from 'vscode-languageserver';
// import { convertRange, getWordAtText } from '../../tools';
// import { AventusLanguageId } from '../../definition';

// export class AventusConfigLanguageService {
//     private languageService: LanguageService;
// 	private filesLoaded: { [uri: string]: AventusTsFile } = {}

// 	public constructor() {
//         this.languageService = createLanguageService(this.createHost());
//     }

// 	private createHost(): LanguageServiceHost {
//         const host: LanguageServiceHost = {
//             getCompilationSettings: () => compilerOptionsRead,
//             getScriptFileNames: () => {
//                 return Object.keys(this.filesLoaded);
//             },
//             getScriptKind: (fileName) => {
//                 return ScriptKind.TS;
//             },
//             getScriptVersion: (fileName: string) => {
//                 if (this.filesLoaded[fileName]) {
//                     return String(this.filesLoaded[fileName].version + 1);
//                 }
//                 return '1';
//             },
//             getScriptSnapshot: (fileName: string) => {
//                 let text: string | undefined = '';
//                 if (this.filesLoaded[fileName]) {
//                     text = this.filesLoaded[fileName].contentForLanguageService;
//                 }
//                 if (text === undefined) {
//                     return undefined;
//                 }
//                 return {
//                     getText: (start, end) => text?.substring(start, end) || '',
//                     getLength: () => text?.length || 0,
//                     getChangeRange: () => undefined
//                 };
//             },
//             getCurrentDirectory: () => '',
//             getDefaultLibFileName: (_options: CompilerOptions) => 'es2022.full',
//             readFile: (fileName: string, _encoding?: string | undefined): string | undefined => {
//                 let result: string | undefined = undefined;
//                 if (this.filesLoaded[fileName]) {
//                     result = this.filesLoaded[fileName].contentForLanguageService;
//                 }
//                 return result;
//             },
// 			fileExists: (fileName: string): boolean => {
//                 return true;
//             },
//             directoryExists: (uri: string): boolean => {
//                 return true;

//             },
//         };
//         return host;
//     }

// 	public doValidation(file: AventusFile): Diagnostic[] {
//         try {
//             let result: Diagnostic[] = [];
//             const syntaxDiagnostics: DiagnosticTs[] = this.languageService.getSyntacticDiagnostics(file.uri);
//             const semanticDiagnostics: DiagnosticTs[] = this.languageService.getSemanticDiagnostics(file.uri);
//             const allNormalDiagnostics: DiagnosticTs[] = syntaxDiagnostics.concat(semanticDiagnostics);
//             for (let diag of allNormalDiagnostics) {
//                 let msg = `${flattenDiagnosticMessageText(diag.messageText, '\n')}`
//                 if (diag.reportsUnnecessary) {
//                     result.push({
//                         range: convertRange(file.documentInternal, diag),
//                         severity: DiagnosticSeverity.Hint,
//                         source: AventusLanguageId.TypeScript,
//                         message: msg,
//                         tags: [DiagnosticTag.Unnecessary]
//                     })
//                 }
//                 else {
//                     result.push({
//                         range: convertRange(file.documentInternal, diag),
//                         severity: DiagnosticSeverity.Error,
//                         source: AventusLanguageId.TypeScript,
//                         message: msg,
//                     })
//                 }
//             }
//             return result;
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return [];
//     }

//     public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
//         try {

//             let document = file.documentInternal;

//             let offset = document.offsetAt(position);
//             let replaceRange = convertRange(document, getWordAtText(document.getText(), offset));
//             let completions: WithMetadata<CompletionInfo> | undefined;
//             try {
//                 completions = this.languageService.getCompletionsAtPosition(document.uri, offset, completionOptions);
//             } catch (e) {
//                 this.printCatchError(e);
//             }
//             if (!completions) {
//                 return { isIncomplete: false, items: [] };
//             }
//             let items: CompletionItem[] = [];
//             for (let i = 0; i < completions.entries.length; i++) {
//                 let entry = completions.entries[i];
//                 let remplacement = entry.insertText ? entry.insertText : entry.name
//                 remplacement = remplacement.replace(/\.\?\./g, "?.");
//                 let additionalTextEdits: TextEdit[] | undefined = undefined;
//                 if (remplacement.startsWith("?")) {
//                     let offsetMinusOne = document.offsetAt(replaceRange.start) - 1;
//                     if (document.getText()[offsetMinusOne] == ".") {
//                         additionalTextEdits = [{
//                             newText: "",
//                             range: {
//                                 start: { line: replaceRange.start.line, character: replaceRange.start.character - 1 },
//                                 end: { line: replaceRange.start.line, character: replaceRange.start.character },
//                             }
//                         }]
//                     }
//                 }

//                 let customData = {
//                     languageId: AventusLanguageId.TypeScript,
//                     offset: offset,
//                     uri: document.uri
//                 }

//                 let completionEntry: CompletionItem = {
//                     label: entry.name,
//                     sortText: entry.sortText,
//                     kind: convertKind(entry.kind),
//                     textEdit: TextEdit.replace(replaceRange, remplacement),
//                     additionalTextEdits: additionalTextEdits
//                 }
//                 items.push(completionEntry)
//             }
//             return { isIncomplete: false, items: items };
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return { isIncomplete: false, items: [] };
//     }

//     public async doResolve(item: CompletionItem): Promise<CompletionItem> {
//         return item;
//     }

//     public async doHover(file: AventusFile, position: Position): Promise<Hover | null> {
//         try {

//             let info = this.languageService.getQuickInfoAtPosition(file.uri, file.documentInternal.offsetAt(position));
//             if (info) {

//                 let textDoc: string[] = []
//                 let simpleDoc: string[] = [];
//                 if (info.documentation) {
//                     for (let doc of info.documentation) {
//                         textDoc.push(`${doc.text.trim()}`);
//                         simpleDoc.push(doc.text.trim());
//                     }
//                 }

//                 // Extract and format JSDoc tags
//                 if (info.tags) {
//                     simpleDoc.push("&nbsp;");
//                     for (let tag of info.tags) {
//                         let goOn = true;
//                         const texts: string[] = [];
//                         if (tag.text) {
//                             for (let t of tag.text) {
//                                 if (t.kind == 'text') {
//                                     if (t.text == simpleDoc.join('')) {
//                                         goOn = false;
//                                         break;
//                                     }
//                                 }
//                                 texts.push(t.text);
//                             }
//                         }
//                         if (!goOn) continue;

//                         let tagContent = texts.join('').trim();

//                         if (tag.name === "example") {
//                             textDoc.push(`\`@${tag.name}\`\n\`\`\`typescript\n${tagContent}\n\`\`\``);
//                         } else {
//                             textDoc.push(`\`@${tag.name}\` ${tagContent}`);
//                         }
//                     }
//                 }

//                 let value: string = "";
//                 if (info.displayParts) {
//                     value += '\n```typescript\n';
//                     value += displayPartsToString(info.displayParts).trim();
//                     value += '\n```\n***\n';
//                 }

//                 value += textDoc.join('\n\n');
//                 return {
//                     range: convertRange(file.documentInternal, info.textSpan),
//                     contents: {
//                         kind: 'markdown',
//                         value: value
//                     }
//                 };
//             }
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return null;
//     }

// 	public async findDefinition(file: AventusFile, position: Position): Promise<Definition | null> {
//         try {

//             let definition = this.languageService.getDefinitionAtPosition(file.uri, file.documentInternal.offsetAt(position));
//             if (definition && definition.length > 0) {
//                 let d = definition[0];

//                 let realDoc = this.filesLoaded[d.fileName];
//                 if (realDoc) {
//                     return {
//                         uri: realDoc.file.uri,
//                         range: convertRange(realDoc.file.documentInternal, d.textSpan)
//                     };
//                 }

//             }
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return null;
//     }
//     public async format(file: AventusFile, range: Range, formatParams: FormattingOptions, semiColon: boolean = true): Promise<TextEdit[]> {
//         try {

//             let document = file.documentInternal;
//             let start = document.offsetAt(range.start);
//             let end = document.offsetAt(range.end);
//             let lastLineRange: null | Range = null;
//             if (range.end.line > range.start.line && (range.end.character === 0 || isWhitespaceOnly(document.getText().substr(end - range.end.character, range.end.character)))) {
//                 end -= range.end.character;
//                 lastLineRange = Range.create(Position.create(range.end.line, 0), range.end);
//             }
//             let options = { ...formatingOptions };
//             if (semiColon) {
//                 options.semicolons = SemicolonPreference.Insert;
//             }
//             else {
//                 options.semicolons = SemicolonPreference.Remove;
//             }

//             let edits = this.languageService.getFormattingEditsForRange(document.uri, start, end, options);
//             if (edits) {
//                 let result: TextEdit[] = [];
//                 for (let edit of edits) {
//                     if (edit.span.start >= start && edit.span.start + edit.span.length <= end) {
//                         result.push({
//                             range: convertRange(document, edit.span),
//                             newText: edit.newText
//                         });
//                     }
//                 }
//                 if (lastLineRange) {
//                     result.push({
//                         range: lastLineRange,
//                         newText: generateIndent(0, formatParams)
//                     });
//                 }
//                 return result;
//             }
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return [];
//     }
// 	public async doCodeAction(file: AventusFile, range: Range): Promise<CodeAction[]> {

//         let result: CodeAction[] = [];
//         try {

//             let parsedFile = ParserTs.parse(file, false, this.build);
//             let document = file.documentInternal;
//             const syntaxDiagnostics: DiagnosticTs[] = this.languageService.getSyntacticDiagnostics(document.uri);
//             const semanticDiagnostics: DiagnosticTs[] = this.languageService.getSemanticDiagnostics(document.uri);
//             let codes: number[] = [];
//             for (let diag of syntaxDiagnostics) {
//                 codes.push(diag.code)
//             }
//             for (let diag of semanticDiagnostics) {
//                 if (diag.code != 6133) { // 6133 = unused code
//                     codes.push(diag.code)
//                 }
//             }
//             let actions: readonly CodeFixAction[] = [];
//             try {
//                 actions = this.languageService.getCodeFixesAtPosition(document.uri, document.offsetAt(range.start), document.offsetAt(range.end), codes, formatingOptions, completionOptions);
//             } catch (e) {

//             }
//             for (let action of actions) {
//                 let changes: TextEdit[] = [];
//                 let workspaceEdit: WorkspaceEdit = {
//                     changes: {
//                         [document.uri]: changes
//                     }
//                 }
//                 for (let change of action.changes) {
//                     for (let textChange of change.textChanges) {
//                         if (action.description.startsWith("Add import from")) {
//                             textChange.newText = textChange.newText.replace(/'/g, '"');
//                             let newImport = /"(.*)"/g.exec(textChange.newText);
//                             if (newImport && newImport.length > 1) {
//                                 let finalPath = simplifyPath(newImport[1], document.uri);
//                                 action.description = "Add import from " + finalPath;
//                                 textChange.newText = textChange.newText.replace(newImport[1], finalPath);
//                             }
//                         }
//                         else if (action.fixName === "fixClassDoesntImplementInheritedAbstractMember") {
//                             let isInsideClass = false;
//                             for (let shortName in parsedFile.classes) {
//                                 let classInfo = parsedFile.classes[shortName];
//                                 if (textChange.span.start >= classInfo.start && textChange.span.start <= classInfo.end) {
//                                     isInsideClass = true;
//                                 }
//                             }
//                             if (isInsideClass) {
//                                 let index = getSectionStart(file, "methods")
//                                 if (index != -1) {
//                                     textChange.span.start = index;
//                                 }
//                                 // check modifier
//                                 if (!textChange.newText.match(/ (public|protected) /g)) {
//                                     textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1public $2")
//                                 }

//                                 // check override
//                                 if (!textChange.newText.match(/(public|protected)[ ]*?override/g)) {
//                                     textChange.newText = textChange.newText.replace(/((public|protected)[ ]*?)([a-z])/g, "$1override $3");
//                                 }

//                                 // add doc
//                                 textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1/**$1 * @inheritdoc$1 */$1$2")

//                             }
//                             else if (textChange.newText.startsWith("import ")) {
//                                 textChange.newText = textChange.newText.replace(/'/g, '"');
//                                 let newImport = /"(.*)"/g.exec(textChange.newText);
//                                 if (newImport && newImport.length > 1) {
//                                     let finalPath = simplifyPath(newImport[1], document.uri);
//                                     textChange.newText = textChange.newText.replace(newImport[1], finalPath);
//                                 }
//                             }
//                         }
//                         // same as fixClassDoesntImplementInheritedAbstractMember without override keyword
//                         else if (action.fixName == "fixClassIncorrectlyImplementsInterface") {
//                             let isInsideClass = false;
//                             for (let shortName in parsedFile.classes) {
//                                 let classInfo = parsedFile.classes[shortName];
//                                 if (textChange.span.start >= classInfo.start && textChange.span.start <= classInfo.end) {
//                                     isInsideClass = true;
//                                 }
//                             }
//                             if (isInsideClass) {
//                                 let index = getSectionStart(file, "methods")
//                                 if (index != -1) {
//                                     textChange.span.start = index;
//                                 }
//                                 // check modifier
//                                 if (!textChange.newText.includes(" protected ") && !textChange.newText.includes(" public ")) {
//                                     textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1public $2")
//                                 }

//                                 // add doc
//                                 textChange.newText = textChange.newText.replace(/^([\s|\S]*?)([a-z])/g, "$1/**$1 * @inheritdoc$1 */$1$2")

//                             }
//                             else if (textChange.newText.startsWith("import ")) {
//                                 textChange.newText = textChange.newText.replace(/'/g, '"');
//                                 let newImport = /"(.*)"/g.exec(textChange.newText);
//                                 if (newImport && newImport.length > 1) {
//                                     let finalPath = simplifyPath(newImport[1], document.uri);
//                                     textChange.newText = textChange.newText.replace(newImport[1], finalPath);
//                                 }
//                             }
//                         }
//                         changes.push({
//                             newText: textChange.newText,
//                             range: convertRange(document, textChange.span),
//                         })
//                     }
//                 }

//                 result.push({
//                     title: action.description,
//                     // command:action.commands,
//                     edit: workspaceEdit,
//                 })
//             }
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return result;
//     }

//     public async onReferences(file: AventusFile, position: Position): Promise<Location[]> {
//         let result: Location[] = []
//         try {

//             let offset = file.documentInternal.offsetAt(position);
//             let referencedSymbols = this.languageService.findReferences(file.uri, offset);
//             if (referencedSymbols) {
//                 for (let referencedSymbol of referencedSymbols) {
//                     for (let reference of referencedSymbol.references) {
//                         if (this.filesLoaded[reference.fileName]) {
//                             let startPos = this.filesLoaded[reference.fileName].file.documentInternal.positionAt(reference.textSpan.start)
//                             let endPos = this.filesLoaded[reference.fileName].file.documentInternal.positionAt(reference.textSpan.start + reference.textSpan.length)
//                             result.push(Location.create(reference.fileName, {
//                                 start: startPos,
//                                 end: endPos
//                             }));
//                         }
//                     }
//                 }
//             }
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return result;
//     }

//     public async onCodeLens(file: AventusFile): Promise<CodeLens[]> {
//         let result: CodeLens[] = []
//         try {

//             let currentFile = this.filesLoaded[file.uri]
//             if (currentFile && currentFile.fileParsed) {
//                 let _createCodeLens = async (instances: BaseInfo[]) => {
//                     for (let instance of instances) {
//                         let startPos = file.documentInternal.positionAt(instance.start)
//                         let refs = await this.onReferences(file, startPos);
//                         let title = refs.length > 1 ? refs.length + ' references' : refs.length + ' reference';
//                         result.push({
//                             range: {
//                                 start: startPos,
//                                 end: startPos,
//                             },
//                             command: {
//                                 title: title,
//                                 command: refs.length ? 'editor.action.showReferences' : '',
//                                 arguments: [file.uri, startPos, refs]
//                             }
//                         });
//                     }
//                 }
//                 await _createCodeLens(Object.values(currentFile.fileParsed.classes));
//                 await _createCodeLens(Object.values(currentFile.fileParsed.enums));
//                 await _createCodeLens(Object.values(currentFile.fileParsed.aliases));

//             }

//             let propSection = getSectionStart(file, 'props');
//             if (propSection != -1) {
//                 let position = file.documentInternal.positionAt(propSection)
//                 result.push({
//                     range: {
//                         start: position,
//                         end: position,
//                     },
//                     command: {
//                         title: "Add property | attribute",
//                         command: 'editor.action.showReferences',
//                         arguments: [file.uri]
//                     }
//                 })
//             }
//         } catch (e) {
//             this.printCatchError(e);
//         }
//         return result;
//     }
//     public async onRename(file: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {

//         let references = this.languageService.getFileReferences(file.uri);
//         let offset: number = file.documentInternal.offsetAt(position);
//         let pref: UserPreferences = {};
//         let renameInfo: RenameInfo = this.languageService.getRenameInfo(file.uri, offset, pref)
//         if (!renameInfo.canRename) {
//             return null;
//         }
//         let renameLocations = this.languageService.findRenameLocations(file.uri, offset, false, false, pref);
//         if (!renameLocations) {
//             return null;
//         }
//         let res: WorkspaceEdit = {
//             changes: {

//             }
//         };
//         if (res.changes) {
//             for (let renameLocation of renameLocations) {
//                 let file = this.filesLoaded[renameLocation.fileName];
//                 if (file) {
//                     if (!res.changes[renameLocation.fileName]) {
//                         res.changes[renameLocation.fileName] = []
//                     }
//                     let textEdit: TextEdit = {
//                         newText: newName,
//                         range: {
//                             start: this.filesLoaded[renameLocation.fileName].file.documentInternal.positionAt(renameLocation.textSpan.start),
//                             end: this.filesLoaded[renameLocation.fileName].file.documentInternal.positionAt(renameLocation.textSpan.start + renameLocation.textSpan.length)
//                         }
//                     }
//                     res.changes[renameLocation.fileName].push(textEdit);
//                 }
//             }
//         }
//         return res;
//     }


// 	private printCatchError(e: any) {
//         AventusConfigLanguageService.printCatchError(e);
//     }
// 	private static printCatchError(e: any) {
//         let regex = /^Debug Failure\. Expected \d+ <= \d+$/g;
//         if (!regex.test(e.message))
//             console.error(e);
//     }
// }

// const compilerOptionsRead: CompilerOptions = {
//     allowNonTsExtensions: true,
//     jsx: JsxEmit.None,
//     importHelpers: false,
//     allowJs: true,
//     checkJs: false,
//     lib: ['lib.es2022.full.d.ts'],
//     target: ScriptTarget.ES2022,
//     moduleDetection: ModuleDetectionKind.Force,
//     moduleResolution: ModuleResolutionKind.NodeNext,
//     experimentalDecorators: true,
//     noImplicitOverride: true,
//     strictPropertyInitialization: true,
//     noImplicitReturns: true,
//     noUnusedLocals: true,
//     strictNullChecks: true,
//     verbatimModuleSyntax: true
// };
// const completionOptions: GetCompletionsAtPositionOptions = {
//     includeExternalModuleExports: true,
//     includeInsertTextCompletions: true,
//     includeCompletionsWithClassMemberSnippets: true,
//     includeAutomaticOptionalChainCompletions: true,
//     includeCompletionsForImportStatements: true,
//     includeCompletionsForModuleExports: true,
//     includeCompletionsWithInsertText: true,
//     // includeCompletionsWithObjectLiteralMethodSnippets:true, => create double 
//     // includeCompletionsWithSnippetText:true, => $0 appear in fct
//     includeInlayEnumMemberValueHints: true,
//     includeInlayFunctionLikeReturnTypeHints: true,
//     includeInlayFunctionParameterTypeHints: true,
//     includeInlayParameterNameHints: "all",
//     includeInlayParameterNameHintsWhenArgumentMatchesName: true,
//     includeInlayPropertyDeclarationTypeHints: true,
//     //includeInlayVariableTypeHints:true,
//     useLabelDetailsInCompletionEntries: true,
//     importModuleSpecifierEnding: "index",
//     importModuleSpecifierPreference: "relative",
// }
// const formatingOptions: FormatCodeSettings = {
//     convertTabsToSpaces: true,
//     tabSize: 4,
//     indentSize: 4,
//     indentStyle: IndentStyle.Smart,
//     newLineCharacter: '\n',
//     baseIndentSize: 0,
//     insertSpaceAfterCommaDelimiter: true,
//     insertSpaceAfterConstructor: false,
//     insertSpaceAfterSemicolonInForStatements: true,
//     insertSpaceBeforeAndAfterBinaryOperators: true,
//     insertSpaceAfterKeywordsInControlFlowStatements: false,
//     insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
//     insertSpaceBeforeFunctionParenthesis: false,
//     // insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: true,
//     // insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: true,
//     // insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
//     // insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: true,
//     // insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: true,
//     // insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: true,
//     insertSpaceAfterTypeAssertion: true,
//     placeOpenBraceOnNewLineForControlBlocks: false,
//     placeOpenBraceOnNewLineForFunctions: false,
//     semicolons: SemicolonPreference.Insert,
//     insertSpaceBeforeTypeAnnotation: false,
// }
// const enum Kind {
//     alias = 'alias',
//     callSignature = 'call',
//     class = 'class',
//     const = 'const',
//     constructorImplementation = 'constructor',
//     constructSignature = 'construct',
//     directory = 'directory',
//     enum = 'enum',
//     enumMember = 'enum member',
//     externalModuleName = 'external module name',
//     function = 'function',
//     indexSignature = 'index',
//     interface = 'interface',
//     keyword = 'keyword',
//     let = 'let',
//     localFunction = 'local function',
//     localVariable = 'local var',
//     method = 'method',
//     memberGetAccessor = 'getter',
//     memberSetAccessor = 'setter',
//     memberVariable = 'property',
//     module = 'module',
//     primitiveType = 'primitive type',
//     script = 'script',
//     type = 'type',
//     variable = 'var',
//     warning = 'warning',
//     string = 'string',
//     parameter = 'parameter',
//     typeParameter = 'type parameter'
// }
// function convertKind(kind: string): CompletionItemKind {
//     switch (kind) {
//         case Kind.primitiveType:
//         case Kind.keyword:
//             return CompletionItemKind.Keyword;

//         case Kind.const:
//         case Kind.let:
//         case Kind.variable:
//         case Kind.localVariable:
//         case Kind.alias:
//         case Kind.parameter:
//             return CompletionItemKind.Variable;

//         case Kind.memberVariable:
//         case Kind.memberGetAccessor:
//         case Kind.memberSetAccessor:
//             return CompletionItemKind.Field;

//         case Kind.function:
//         case Kind.localFunction:
//             return CompletionItemKind.Function;

//         case Kind.method:
//         case Kind.constructSignature:
//         case Kind.callSignature:
//         case Kind.indexSignature:
//             return CompletionItemKind.Method;

//         case Kind.enum:
//             return CompletionItemKind.Enum;

//         case Kind.enumMember:
//             return CompletionItemKind.EnumMember;

//         case Kind.module:
//         case Kind.externalModuleName:
//             return CompletionItemKind.Module;

//         case Kind.class:
//         case Kind.type:
//             return CompletionItemKind.Class;

//         case Kind.interface:
//             return CompletionItemKind.Interface;

//         case Kind.warning:
//             return CompletionItemKind.Text;

//         case Kind.script:
//             return CompletionItemKind.File;

//         case Kind.directory:
//             return CompletionItemKind.Folder;

//         case Kind.string:
//             return CompletionItemKind.Constant;

//         default:
//             return CompletionItemKind.Property;
//     }
// }
// function isWhitespaceOnly(str: string) {
//     return /^\s*$/.test(str);
// }
// function generateIndent(level: number, options: FormattingOptions) {
//     if (options.insertSpaces) {
//         return repeat(' ', level * options.tabSize);
//     } else {
//         return repeat('\t', level);
//     }
// }
// function repeat(value: string, count: number) {
//     let s = '';
//     while (count > 0) {
//         if ((count & 1) === 1) {
//             s += value;
//         }
//         value += value;
//         count = count >>> 1;
//     }
//     return s;
// }