// import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
// import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
// import { AventusTsFile } from '../File';
// import { Build } from '../../../project/Build';
// import { AventusWebComponentLogicalFile } from './File';
// import { TextDocument } from 'vscode-languageserver-textdocument';
// import { AventusExtension, AventusLanguageId } from '../../../definition';
// import { AventusBaseFile } from '../../BaseFile';
// import { AventusHTMLFile } from '../../html/File';
// import { EOL } from 'os';
// import { GenericServer } from '../../../GenericServer';
// import { SemicolonPreference } from 'typescript';
// import { setFormationOptions } from '../LanguageService';

// export class AventusWebComponentViewLogicalFile extends AventusTsFile {

// 	private methodsStart: number[] = [];
// 	private positionsMapper: { local: { start: number, end: number }, real: { start: number, end: number } }[] = []
// 	private fromFile: AventusFile;

// 	public get HTMLFile(): AventusHTMLFile | undefined {
// 		return this.build.htmlFiles[this.file.uri.replace(".generated" + AventusExtension.ComponentLogic, AventusExtension.ComponentView)];
// 	}

// 	constructor(file: AventusFile, build: Build) {
// 		let doc = TextDocument.create(file.uri.replace(AventusExtension.ComponentLogic, ".generated" + AventusExtension.ComponentLogic), AventusExtension.ComponentLogic, file.version, "");
// 		let f = new InternalAventusFile(doc);
// 		super(f, build);
// 		this.fromFile = file;
// 	}

// 	public generateFile(file: AventusWebComponentLogicalFile) {
// 		let txt: string[] = [];
// 		let htmlVersion = 0;
// 		if (file.fileParsed && file.compilationResult) {
// 			let parsed = file.fileParsed;

// 			for (let imp of parsed.importsTxt) {
// 				txt.push(imp)
// 			}

// 			let _class = parsed.classes[file.compilationResult.componentName];

// 			txt.push(`class ${_class.name} {`)

// 			for (let name in _class.properties) {
// 				let offsetStart = (txt.join(EOL) + EOL).length;
// 				let txtTemp = _class.properties[name].fullContent
// 				txt.push(txtTemp);
// 				let offsetEnd = offsetStart + txtTemp.length;
// 				this.positionsMapper.push({
// 					local: { start: offsetStart, end: offsetEnd },
// 					real: { start: _class.properties[name].fullStart, end: _class.properties[name].end }
// 				})
// 			}
// 			for (let name in _class.methods) {
// 				let offsetStart = (txt.join(EOL) + EOL).length;
// 				let txtTemp = `public ${name}() {}`
// 				txt.push(txtTemp);
// 				let offsetEnd = offsetStart + txtTemp.length;
// 				this.positionsMapper.push({
// 					local: { start: offsetStart, end: offsetEnd },
// 					real: { start: _class.methods[name].start, end: _class.methods[name].end }
// 				})
// 			}

// 			let htmlFile = file.getHTMLFile();
// 			let methods = htmlFile?.fileParsed?.fcts ?? [];
// 			this.methodsStart = [];
// 			for (let i = 0; i < methods.length; i++) {
// 				let method = methods[i];
// 				txt.push(`public __private_method${i}() {`);
// 				let offsetStart = (txt.join(EOL) + EOL).length;
// 				this.methodsStart.push(offsetStart);
// 				txt.push(method.txt);
// 				txt.push('}');
// 			}

// 			txt.push(`}`)

// 			htmlVersion = htmlFile?.compiledVersion ?? 0;
// 		}

// 		let version = file.file.version + htmlVersion;
// 		let doc = TextDocument.create(this.file.document.uri, "", version, txt.join(EOL));


// 		(this.file as InternalAventusFile).triggerContentChange(doc);
// 	}


// 	protected get extension(): string {
// 		return "";
// 	}
// 	protected async onContentChange(): Promise<void> {
// 		this.refreshFileParsed();
// 	}

// 	protected async onValidate(): Promise<Diagnostic[]> {
// 		let html = this.HTMLFile;
// 		if (html) {
// 			let diagnostics = await this.tsLanguageService.doValidation(this.file);
// 			let result: Diagnostic[] = [];
// 			let methods = html?.fileParsed?.fcts ?? [];
// 			let convertedRanges: Range[] = [];
// 			for (let diag of diagnostics) {
// 				let diagStart = this.file.document.offsetAt(diag.range.start);
// 				let diagEnd = this.file.document.offsetAt(diag.range.end);
// 				for (let i = 0; i < methods.length; i++) {
// 					let start = this.methodsStart[i];
// 					let end = start + methods[i].txt.length;

// 					if (diagStart > start && diagEnd < end) {
// 						// it's inside the {{ }}
// 						diag.source = AventusLanguageId.HTML;

// 						if (convertedRanges.indexOf(diag.range) == -1) {
// 							convertedRanges.push(diag.range);
// 							let offsetStart = this.file.document.offsetAt(diag.range.start) - this.methodsStart[i]
// 							let offsetEnd = this.file.document.offsetAt(diag.range.end) - this.methodsStart[i]

// 							diag.range.start = html.file.document.positionAt(methods[i].start + 2 + offsetStart);
// 							diag.range.end = html.file.document.positionAt(methods[i].start + 2 + offsetEnd);
// 						}
// 						result.push(diag);
// 						break;
// 					}
// 				}
// 			}

// 			this.diagnostics = result;
// 		}

// 		return [];
// 	}
// 	protected async onSave(): Promise<void> {
// 	}


// 	public async doCompleteMethod(html: AventusHTMLFile, position: Position): Promise<CompletionList | null> {
// 		if (html.fileParsed && html.tsFile) {
// 			let offsetFrom = html.file.document.offsetAt(position);
// 			for (let i = 0; i < html.fileParsed.fcts.length; i++) {
// 				let fct = html.fileParsed.fcts[i];
// 				if (offsetFrom >= fct.start + 2 && offsetFrom <= fct.end - 2) {
// 					let offset = offsetFrom - fct.start - 2;
// 					let positionOnFile = this.file.document.positionAt(this.methodsStart[i] + offset);
// 					let resultTemp = await this.onCompletion(this.file, positionOnFile);
// 					let result: CompletionItem[] = [];
// 					let convertedRanges: Range[] = [];
// 					for (let item of resultTemp.items) {
// 						if (item.label.startsWith("__private_method")) {
// 							continue
// 						}
// 						if (item.data && item.data.uri) {
// 							item.data.languageId = AventusLanguageId.HTML;
// 							item.data.uri = html.file.uri;
// 						}
// 						if (item.textEdit) {
// 							let textEdit = item.textEdit as TextEdit;
// 							if (textEdit.range) {
// 								if (convertedRanges.indexOf(textEdit.range) == -1) {
// 									convertedRanges.push(textEdit.range);
// 									let offsetStart = this.file.document.offsetAt(textEdit.range.start) - this.methodsStart[i]
// 									let offsetEnd = this.file.document.offsetAt(textEdit.range.end) - this.methodsStart[i]

// 									textEdit.range.start = html.file.document.positionAt(fct.start + 2 + offsetStart);
// 									textEdit.range.end = html.file.document.positionAt(fct.start + 2 + offsetEnd);

// 								}
// 							}
// 						}
// 						result.push(item);
// 					}
// 					resultTemp.items = result;
// 					return resultTemp
// 				}
// 			}
// 		}
// 		return null;
// 	}
// 	protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
// 		return await this.tsLanguageService.doComplete(this.file, position);
// 	}
// 	protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
// 		return item;
// 	}


// 	public async doHoverMethod(html: AventusHTMLFile, position: Position): Promise<Hover | null> {
// 		if (html.fileParsed && html.tsFile) {
// 			let offsetFrom = html.file.document.offsetAt(position);
// 			for (let i = 0; i < html.fileParsed.fcts.length; i++) {
// 				let fct = html.fileParsed.fcts[i];
// 				if (offsetFrom >= fct.start + 2 && offsetFrom <= fct.end - 2) {
// 					let offset = offsetFrom - fct.start - 2;
// 					let positionOnFile = this.file.document.positionAt(this.methodsStart[i] + offset);
// 					let resultTemp = await this.onHover(this.file, positionOnFile);
// 					if (resultTemp?.range) {
// 						let offsetStart = this.file.document.offsetAt(resultTemp.range.start) - this.methodsStart[i]
// 						let offsetEnd = this.file.document.offsetAt(resultTemp.range.end) - this.methodsStart[i]

// 						resultTemp.range.start = html.file.document.positionAt(fct.start + 2 + offsetStart);
// 						resultTemp.range.end = html.file.document.positionAt(fct.start + 2 + offsetEnd);
// 					}
// 					return resultTemp
// 				}
// 			}
// 		}
// 		return null;
// 	}
// 	protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
// 		return await this.tsLanguageService.doHover(this.file, position);
// 	}

// 	public async doDefinitionMethod(html: AventusHTMLFile, position: Position): Promise<Location[] | null> {
// 		if (html.fileParsed && html.tsFile) {
// 			let offsetFrom = html.file.document.offsetAt(position);
// 			for (let i = 0; i < html.fileParsed.fcts.length; i++) {
// 				let fct = html.fileParsed.fcts[i];
// 				if (offsetFrom >= fct.start + 2 && offsetFrom <= fct.end - 2) {
// 					let offset = offsetFrom - fct.start - 2;
// 					let positionOnFile = this.file.document.positionAt(this.methodsStart[i] + offset);
// 					let resultTemp: Location[] | null = await this.onDefinition(this.file, positionOnFile);
// 					if (resultTemp) {
// 						if (!Array.isArray(resultTemp)) {
// 							resultTemp.uri = this.fromFile.uri
// 							let newRangeStart = this.localPositionToRealPosition(resultTemp.range.start)
// 							let newRangeEnd = this.localPositionToRealPosition(resultTemp.range.end)
// 							if (newRangeStart && newRangeEnd) {
// 								resultTemp.range = {
// 									start: newRangeStart,
// 									end: newRangeEnd,
// 								}
// 							}
// 							else {
// 								resultTemp = null;
// 							}

// 						}
// 					}
// 					return resultTemp
// 				}
// 			}
// 		}
// 		return null;
// 	}
// 	protected async onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
// 		return await this.tsLanguageService.findDefinition(this.file, position);
// 	}


// 	public async doFormatingMethod(html: AventusHTMLFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
// 		let result: TextEdit[] = [];
// 		if (html.fileParsed && html.tsFile) {
// 			let convertedRange: Range = {
// 				start: this.file.document.positionAt(0),
// 				end: this.file.document.positionAt(this.file.content.length)
// 			}

// 			setFormationOptions({
// 				semicolons: SemicolonPreference.Remove
// 			});
// 			let formattings = await this.onFormatting(this.file, convertedRange, options);
// 			setFormationOptions({});
// 			let methods = html?.fileParsed?.fcts ?? [];
// 			let convertedRanges: Range[] = [];

// 			for (let formatting of formattings) {
// 				let formattingStart = this.file.document.offsetAt(formatting.range.start);
// 				let formattingEnd = this.file.document.offsetAt(formatting.range.end);

// 				for (let i = 0; i < methods.length; i++) {
// 					let start = this.methodsStart[i];
// 					let end = start + methods[i].txt.length;
// 					if (formattingStart > start && formattingEnd < end) {
// 						// it's inside the {{ }}

// 						if (convertedRanges.indexOf(formatting.range) == -1) {
// 							convertedRanges.push(formatting.range);
// 							let offsetStart = this.file.document.offsetAt(formatting.range.start) - this.methodsStart[i]
// 							let offsetEnd = this.file.document.offsetAt(formatting.range.end) - this.methodsStart[i]

// 							formatting.range.start = html.file.document.positionAt(methods[i].start + 2 + offsetStart);
// 							formatting.range.end = html.file.document.positionAt(methods[i].start + 2 + offsetEnd);
// 						}
// 						result.push(formatting);
// 						break;
// 					}
// 				}
// 			}
// 		}
// 		return result;
// 	}
// 	protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
// 		return this.tsLanguageService.format(document, range, options);
// 	}


// 	protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
// 		return [];
// 	}
// 	protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
// 		return [];
// 	}
// 	protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
// 		return [];
// 	}
// 	protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
// 		return null;
// 	}


// 	private localOffsetToRealOffset(offset: number) {
// 		for (let position of this.positionsMapper) {
// 			if (offset >= position.local.start && offset <= position.local.end) {
// 				let current = this.file.content.slice(position.local.start, position.local.end);
// 				let rea = this.fromFile.content.slice(position.real.start, position.real.end);
// 				let diff = offset - position.local.start;
// 				return position.real.start + diff
// 			}
// 		}
// 		return null;
// 	}
// 	private localOffsetToRealPosition(offset: number) {
// 		let realOffset = this.localOffsetToRealOffset(offset)
// 		if (!realOffset) {
// 			return null;
// 		}
// 		return this.fromFile.document.positionAt(realOffset);
// 	}

// 	private localPositionToRealPosition(position: Position) {
// 		let offset = this.file.document.offsetAt(position);
// 		let content = this.file.content.slice(offset, offset + 5);
// 		return this.localOffsetToRealPosition(offset)
// 	}
// }