import { CompilerOptions, createLanguageService, Extension, Diagnostic as DiagnosticTs, JsxEmit, LanguageService, LanguageServiceHost, ModuleDetectionKind, ModuleResolutionKind, ResolvedModule, ResolvedModuleFull, ResolvedProjectReference, resolveModuleName, ScriptKind, ScriptTarget, SourceFile, flattenDiagnosticMessageText, WithMetadata, CompletionInfo, GetCompletionsAtPositionOptions, displayPartsToString, SemicolonPreference, IndentStyle, FormatCodeSettings, CodeFixAction, ModuleKind } from 'typescript';
import { Build } from '../../../project/Build';
import { AventusFile } from '../../../files/AventusFile';
import { existsSync } from 'fs';
import { convertRange, getWordAtText, pathToUri, uriToPath } from '../../../tools';
import { loadLibrary, NODE_MODULES, serverFolder } from '../libLoader';
import { CodeAction, CodeLens, CompletionItem, CompletionList, Definition, Diagnostic, DiagnosticSeverity, DiagnosticTag, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { AventusLanguageId } from '../../../definition';
import { join } from 'path';
import { AventusTsLanguageService, convertKind, generateIndent, isWhitespaceOnly } from '../LanguageService';
import { TextDocument } from 'vscode-languageserver-textdocument';

export class AventusTemplateLanguageService {
	private languageService: LanguageService;
	private filesLoaded: { [uri: string]: { versionInternal: number, contentInternal: string } } = {}
	private filesNeeded: string[] = [];
	private filesNpm: string[] = [];

	public constructor() {
		this.filesNeeded = [pathToUri(join(serverFolder(), 'lib/templateScript/AventusTemplate.d.ts'))]
		let content = loadLibrary(join(serverFolder(), 'lib/templateScript/AventusTemplate.d.ts'))!;
		this.filesLoaded[this.filesNeeded[0]] = {
			contentInternal: content,
			versionInternal: 1
		};
		this.languageService = createLanguageService(this.createHost());
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
					return String(this.filesLoaded[fileName].versionInternal + 1);
				}
				return '1';
			},
			getScriptSnapshot: (fileName: string) => {
				let text: string | undefined = '';
				if (this.filesLoaded[fileName]) {
					text = this.filesLoaded[fileName].contentInternal;
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
					result = this.filesLoaded[fileName].contentInternal;
				} else {
					result = loadLibrary(fileName);
				}
				return result;
			},
			fileExists: (fileName: string): boolean => {
				let result = false;
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
			if (require('module').builtinModules.includes(moduleName)) {
				const resolvePath = join(NODE_MODULES(), `@types/node/${moduleName}.d.ts`);
				let temp: ResolvedModuleFull = {
					extension: Extension.Ts,
					resolvedFileName: resolvePath,
					isExternalLibraryImport: true
				}
				resolvedModules.push(temp);
				continue;
			}

			let result = resolveModuleName(moduleName, containingFile, compilerOptionsRead, host)
			if (result.resolvedModule) {
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

	public addFile(file: AventusFile) {
		if (this.filesNeeded.indexOf(file.uri) == -1) {
			this.filesNeeded.push(file.uri);
			this.filesLoaded[file.uri] = file;
		}
	}
	public removeFile(file: AventusFile) {
		let index = this.filesNeeded.indexOf(file.uri);
		if (index != -1) {
			this.filesNeeded.splice(index, 1);
			delete this.filesLoaded[file.uri];
		}
	}



	public doValidation(file: AventusFile): Diagnostic[] {
		try {
			const avoidCodes: number[] = [1206, 1249, 2612];
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
	public async findDefinition(file: AventusFile, position: Position): Promise<Definition | null> {
		try {

			let definition = this.languageService.getDefinitionAtPosition(file.uri, file.documentInternal.offsetAt(position));
			if (definition && definition.length > 0) {
				let d = definition[0];

				let content = loadLibrary(d.fileName);
				if (content) {
					const doc = TextDocument.create(d.fileName, "typescript", 1, content)
					return {
						uri: d.fileName,
						range: convertRange(doc, d.textSpan)
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

			let edits = this.languageService.getFormattingEditsForRange(document.uri, start, end, options);
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

		} catch (e) {
			this.printCatchError(e);
		}
		return result;
	}

	public async onCodeLens(file: AventusFile): Promise<CodeLens[]> {
		let result: CodeLens[] = []
		try {

		} catch (e) {
			this.printCatchError(e);
		}
		return result;
	}
	public async onRename(file: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
		return null;
	}


	private printCatchError(e: any) {
		AventusTemplateLanguageService.printCatchError(e);
	}
	private static printCatchError(e: any) {
		let regex = /^Debug Failure\. Expected \d+ <= \d+$/g;
		if (!regex.test(e.message))
			console.error(e);
	}
}

const compilerOptionsRead: CompilerOptions = {
	types: ["node"],
	module: ModuleKind.ES2022,
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
	verbatimModuleSyntax: false
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