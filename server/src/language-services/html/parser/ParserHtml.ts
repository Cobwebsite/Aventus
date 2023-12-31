import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../../definition';
import { LanguageService, TokenType, getLanguageService } from 'vscode-html-languageservice';
import { AttributeInfo, ContentInfo, TagInfo } from './TagInfo';
import { Build } from '../../../project/Build';
import { ActionChange, HtmlTemplateResult, InterestPoint } from './definition';
import { AventusHTMLFile } from '../File';
import { SCSSParsedRule } from '../../scss/LanguageService';
import { createErrorHTMLPos } from '../../../tools';
import { IfStatement, Node, ScriptTarget, Statement, SyntaxKind, createSourceFile, forEachChild } from 'typescript';

export class ParserHtml {
	//#region static
	private static languageService: LanguageService = getLanguageService();
	private static parsedDoc: { [uri: string]: { version: number, result: ParserHtml } } = {};
	public static getVersion(document: AventusHTMLFile): number {
		if (ParserHtml.parsedDoc[document.file.uri]) {
			return this.parsedDoc[document.file.uri].version;
		}
		return 0;
	}
	public static parse(document: AventusHTMLFile, build: Build): ParserHtml {
		if (ParserHtml.parsedDoc[document.file.uri]) {
			if (this.parsedDoc[document.file.uri].version == document.file.version) {
				return this.parsedDoc[document.file.uri].result;
			}
		}
		new ParserHtml(document, build);
		return ParserHtml.parsedDoc[document.file.uri].result;
	}
	private static currentParsingDoc: ParserHtml | null;
	public static addError(start: number, end: number, msg: string) {
		if (this.currentParsingDoc) {
			let error = {
				range: Range.create(this.currentParsingDoc.document.positionAt(start), this.currentParsingDoc.document.positionAt(end)),
				severity: DiagnosticSeverity.Error,
				source: AventusLanguageId.HTML,
				message: msg,
			}
			this.currentParsingDoc.errors.push(error);
		}
	}
	public static addWarning(start: number, end: number, msg: string) {
		if (this.currentParsingDoc) {
			let error = {
				range: Range.create(this.currentParsingDoc.document.positionAt(start), this.currentParsingDoc.document.positionAt(end)),
				severity: DiagnosticSeverity.Warning,
				source: AventusLanguageId.TypeScript,
				message: msg
			}
			this.currentParsingDoc.errors.push(error);
		}
	}
	public static mergeTemplateResult(main: HtmlTemplateResult, toMerge: HtmlTemplateResult) {
		main.events = [...main.events, ...toMerge.events];
		main.pressEvents = [...main.pressEvents, ...toMerge.pressEvents];
		main.loops = [...main.loops, ...toMerge.loops];
		main.content = {...main.content, ...toMerge.content};

		for (let mergeEl of toMerge.elements) {
			let found = false;
			for (let mainEl of main.elements) {
				if (mainEl.name == mergeEl.name) {
					found = true;
					for (let mergeId of mergeEl.ids) {
						if (!mainEl.ids.includes(mergeId)) {
							mainEl.ids.push(mergeId);
						}
					}
					for (let tagName in mergeEl.tags) {
						if (mainEl.tags[tagName]) {
							mainEl.tags[tagName] += mergeEl.tags[tagName];
						}
						else {
							mainEl.tags[tagName] = mergeEl.tags[tagName];
						}
					}
					if (!mainEl.isArray) {
						if (mergeEl.isArray) {
							mainEl.isArray = true;
						}
						else {
							let count = Object.values(mainEl.tags).reduce((s, a) => s + a, 0)
							mainEl.isArray = count > 1;
						}
					}
					mainEl.positions = [...mainEl.positions, ...mergeEl.positions];
				}
			}
			if (!found) {
				main.elements.push(mergeEl);
			}
		}

		for (let contextProp in toMerge.injection) {
			if (main.injection[contextProp]) {
				main.injection[contextProp] = [...main.injection[contextProp], ...toMerge.injection[contextProp]];
			}
			else {
				main.injection[contextProp] = toMerge.injection[contextProp]
			}
		}

		for (let contextProp in toMerge.bindings) {
			if (main.bindings[contextProp]) {
				main.bindings[contextProp] = [...main.bindings[contextProp], ...toMerge.bindings[contextProp]];
			}
			else {
				main.bindings[contextProp] = toMerge.bindings[contextProp]
			}
		}
	}
	public static addVariable(name: string, isLocal?: boolean) {
		if (this.currentParsingDoc) {
			if (isLocal) {
				if (!this.currentParsingDoc.localVars.includes(name)) {
					this.currentParsingDoc.localVars.push(name);
				}
			}
			else if (!this.currentParsingDoc.localVars.includes(name)) {
				if (!this.currentParsingDoc.globalVars.includes(name)) {
					this.currentParsingDoc.globalVars.push(name);
				}
			}
		}
	}
	public static addInterestPoint(point: InterestPoint) {
		if (this.currentParsingDoc) {
			if (point.type == "property" && this.currentParsingDoc.localVars.includes(point.name)) {
				return;
			}
			this.currentParsingDoc.interestPoints.push(point);
		}
	}
	public static addStyleLink(point: [{ start: number, end: number }, { start: number, end: number }]) {
		if (this.currentParsingDoc) {
			this.currentParsingDoc.styleLinks.push(point);
		}
	}
	public static getRules(): SCSSParsedRule {
		if (this.currentParsingDoc) {
			return this.currentParsingDoc.rules;
		}
		return new Map();
	}
	public static refreshStyle(document: AventusHTMLFile, build: Build) {
		if (ParserHtml.parsedDoc[document.file.uri]) {
			if (this.parsedDoc[document.file.uri].version == document.file.version) {
				let doc = this.parsedDoc[document.file.uri];
				doc.result.styleLinks = [];
				doc.result.rules = document.scssFile?.rules ?? new Map();
				for (let tag of doc.result.tags) {
					tag.checkStyle(doc.result.rules, (point) => {
						doc.result.styleLinks.push(point)
					});
				}
			}
		}
		this.parse(document, build);
	}
	public static idElement = 0;
	public static idLoop = 0;
	public static loopsInfo: TagInfo[] = [];
	public static createChange(fct: { start: number, end: number, txt: string }): ActionChange | null {
		if (this.currentParsingDoc) {
			let loops: { from: string, item: string, index: string }[] = [];
			for (let loopInfo of this.loopsInfo) {
				if (!loopInfo.forInstance) {
					continue;
				}
				loops.push({
					from: loopInfo.forInstance.from,
					index: loopInfo.forInstance.index,
					item: loopInfo.forInstance.item,
				})
			}

			if (this.currentParsingDoc.htmlFile.tsFile) {
				let name = this.currentParsingDoc.htmlFile.tsFile?.viewMethodName + this.currentParsingDoc.fcts.length
				let result: ActionChange = {
					name: name,
					start: fct.start,
					end: fct.end,
					txt: fct.txt,
					variablesType: {}
				}
				this.currentParsingDoc.fcts.push(result);
				return result;
			}
		}
		return null;
	}
	//#endregion

	public uri: string;
	public errors: Diagnostic[] = [];
	private document: TextDocument;

	private rootTags: TagInfo[] = [];
	private tags: TagInfo[] = [];


	public blocksInfo: { [name: string]: string } = {}
	public slotsInfo: { [name: string]: string } = {}
	public localVars: string[] = [];
	public globalVars: string[] = [];
	public resultsByClassName: { [className: string]: HtmlTemplateResult } = {};
	public interestPoints: InterestPoint[] = []
	public rules: SCSSParsedRule;
	public styleLinks: [{ start: number, end: number }, { start: number, end: number }][] = []
	public fcts: ActionChange[] = [];
	public htmlFile: AventusHTMLFile;

	public getBlocksInfoTxt() {
		let blocks: string[] = [];
		for (let name in this.blocksInfo) {
			blocks.push("'" + name + "':`" + this.blocksInfo[name] + "`")
		}
		return blocks.join(",");
	}
	public getSlotsInfoTxt() {
		let slots: string[] = [];
		for (let name in this.slotsInfo) {
			slots.push("'" + name + "':`" + this.slotsInfo[name] + "`");
		}
		return slots.join(",");
	}

	public isReady: boolean = false;
	private build: Build;

	private constructor(document: AventusHTMLFile, build: Build) {
		this.build = build;
		this.htmlFile = document;
		ParserHtml.parsedDoc[document.file.uri] = {
			version: document.file.version,
			result: this,
		}
		let fileContent = this.getFileContent(document.file.document);
		this.rules = document.scssFile?.rules ?? new Map();
		this.document = TextDocument.create(document.file.uri, document.file.document.languageId, document.file.version, fileContent);
		ParserHtml.currentParsingDoc = this;
		this.uri = document.file.uri;
		this.parse(this.document);
		ParserHtml.currentParsingDoc = null;
		this.isReady = true;
		for (let cb of this.readyCb) {
			cb();
		}
	}

	private getFileContent(document: TextDocument) {
		let txt = document.getText();
		// prevent to parse element that is escaped
		txt = txt.replace(/\\\{\{(.*?)\}\}/g, "&#123;&#123;$1&#125;&#125;");
		return txt;
	}

	private readyCb: (() => void)[] = [];
	public onReady(cb: () => void) {
		if (!this.isReady) {
			this.readyCb.push(cb);
		}
	}

	private parseJs(document: TextDocument) {
		let srcFile = createSourceFile("sample.ts", document.getText(), ScriptTarget.ESNext, true);

		type Token = { text: string, start: number, end: number }
		let info: {
			for: Token[],
			if: {

			}[]
		} = {
			for: [],
			if: []
		}

		const loop = (node: Node, lvl: number) => {
			forEachChild(node, x => {
				// console.log(SyntaxKind[x.kind])
				// console.log(x.getText());
				// console.log(x.getStart());
				// console.log(x.getEnd());
				// if (x.kind == SyntaxKind.ForOfStatement) {
				// 	let identifier: Token;
				// 	let variable: Token;
				// 	let block: Token;
				// 	forEachChild(x, y => {
				// 		if (y.kind == SyntaxKind.VariableDeclarationList) {
				// 			let _var = y.getChildAt(1);
				// 			variable = {
				// 				text: _var.getText(),
				// 				start: _var.getStart(),
				// 				end: _var.getEnd()
				// 			}
				// 		}
				// 		else if (y.kind == SyntaxKind.Identifier) {
				// 			identifier = {
				// 				text: y.getText(),
				// 				start: y.getStart(),
				// 				end: y.getEnd()
				// 			}
				// 		}
				// 		else if (y.kind == SyntaxKind.Block) {
				// 			block = {
				// 				text: "",
				// 				start: y.getStart(),
				// 				end: y.getEnd()
				// 			}
				// 		}
				// 	})
				// 	debugger
				// }
				// if (x.kind == SyntaxKind.IfStatement) {
				// 	const loadStatement = (c: IfStatement) => {
				// 		if (c.expression) {
				// 			ParserHtml.addFct({
				// 				txt: c.expression.getText(),
				// 				start: c.expression.getStart(),
				// 				end: c.expression.getEnd(),
				// 			})
				// 			if (c.elseStatement) {
				// 				loadStatement(c.elseStatement as IfStatement);
				// 			}
				// 		}
				// 		else {
				// 			// its an else
				// 		}
				// 	}
				// 	loadStatement(x as IfStatement);
				// }

				
				// avoid parsing inside {{ }}
				if (x.kind == SyntaxKind.Block && node.kind == SyntaxKind.Block) {
					return
				}
				loop(x, lvl + 1)
			})
		}

		loop(srcFile, 0);
	}


	private parse(document: TextDocument) {
		this.parseJs(document);
		ParserHtml.idElement = 0;
		ParserHtml.idLoop = 0;
		let isInAvoidTagStart: number[] = [];
		let removeNextClose = false;
		let scanner = ParserHtml.languageService.createScanner(document.getText(), 0);
		let currentTags: TagInfo[] = [];
		let currentAttribute: AttributeInfo | null = null;
		try {
			while (scanner.scan() != TokenType.EOS) {
				if (isInAvoidTagStart.length > 0) {
					if (scanner.getTokenType() == TokenType.EndTagClose && removeNextClose) {
						removeNextClose = false;
						let lastTag = currentTags.pop();
						let lastIndex = isInAvoidTagStart.pop();
						if (lastTag && lastIndex) {
							let end = scanner.getTokenEnd();
							let txt = document.getText().slice(lastIndex, end);
							lastTag.addContent(new ContentInfo(txt, lastIndex, end, lastTag, false));
						}
					}
					else if (scanner.getTokenType() == TokenType.EndTag) {
						let tagName = scanner.getTokenText();
						let lastTag = currentTags[currentTags.length - 1];
						if (lastTag && lastTag.tagName == tagName) {
							removeNextClose = true;
							lastTag.afterClose(scanner.getTokenOffset(), scanner.getTokenEnd());
						}
					}
				}
				else {
					if (scanner.getTokenType() == TokenType.StartTagOpen) {
					}
					else if (scanner.getTokenType() == TokenType.StartTagClose) {
						if (currentTags.length > 0) {
							let lastTag = currentTags[currentTags.length - 1];
							lastTag.validateAllProps(scanner.getTokenOffset());
							if (lastTag.selfClosing) {
								currentTags.pop();
								lastTag.afterClose(scanner.getTokenOffset(), scanner.getTokenEnd());
							}
							if (this.build.getAvoidParsingTags().includes(lastTag.tagName)) {
								isInAvoidTagStart.push(scanner.getTokenEnd());
							}
						}
					}
					else if (scanner.getTokenType() == TokenType.StartTagSelfClose) {
						let lastTag = currentTags.pop();
						if (lastTag) {
							lastTag.validateAllProps(scanner.getTokenOffset());
							lastTag.afterClose(scanner.getTokenOffset(), scanner.getTokenEnd());
						}
					}
					else if (scanner.getTokenType() == TokenType.StartTag) {
						let tagName = scanner.getTokenText();
						let start = scanner.getTokenOffset();
						let end = scanner.getTokenEnd();
						let newTag = new TagInfo(this, tagName, start, end);

						if (currentTags.length > 0) {
							let lastTag = currentTags[currentTags.length - 1];
							lastTag.addChild(newTag);
						}
						else {
							this.rootTags.push(newTag);
						}
						this.tags.push(newTag);
						currentTags.push(newTag);
					}
					else if (scanner.getTokenType() == TokenType.EndTagOpen) {
					}
					else if (scanner.getTokenType() == TokenType.EndTagClose) {
					}
					else if (scanner.getTokenType() == TokenType.EndTag) {
						let tagName = scanner.getTokenText();
						let lastTag = currentTags.pop();
						if (lastTag && lastTag.tagName == tagName) {
							lastTag.afterClose(scanner.getTokenOffset(), scanner.getTokenEnd());
						}
						else {
							if (lastTag) {
								this.errors.push(createErrorHTMLPos(document, "The tag " + lastTag?.tagName + " isn't correctly closed", lastTag?.start, lastTag?.end))
							}
							else {
								this.errors.push(createErrorHTMLPos(document, "No opening tag found for " + tagName, scanner.getTokenOffset(), scanner.getTokenEnd()))
							}
							return;
						}
					}
					else if (scanner.getTokenType() == TokenType.DelimiterAssign) { // =
					}
					else if (scanner.getTokenType() == TokenType.AttributeName) {
						let name = scanner.getTokenText();

						if (currentTags.length > 0) {
							let tag = currentTags[currentTags.length - 1];
							let start = scanner.getTokenOffset();
							let end = scanner.getTokenEnd();
							currentAttribute = new AttributeInfo(name, start, end, tag);
							tag.addAttribute(currentAttribute);
						}

					}
					else if (scanner.getTokenType() == TokenType.AttributeValue) {
						if (currentAttribute) {
							let value = scanner.getTokenText();
							let start = scanner.getTokenOffset();
							let end = scanner.getTokenEnd();
							currentAttribute.setValue(value, start, end);
							currentAttribute = null;
						}
					}
					else if (scanner.getTokenType() == TokenType.Content) {
						if (currentTags.length > 0) {
							let tag = currentTags[currentTags.length - 1];
							let value = scanner.getTokenText();
							let start = scanner.getTokenOffset();
							let end = scanner.getTokenEnd();
							tag.addContent(new ContentInfo(value, start, end, tag));
						}
					}
					else if (scanner.getTokenType() == TokenType.Whitespace) {
					}
					else if (scanner.getTokenType() == TokenType.Unknown) {
						debugger;
					}
					else if (scanner.getTokenType() == TokenType.Script) {
						// ParserHtml.addError(scanner.getTokenOffset(), scanner.getTokenEnd(), "You can't use script inside")
						debugger;
					}
					else if (scanner.getTokenType() == TokenType.Styles) {
						debugger;
					}
				}
			}
		} catch (e) {
			console.log(e);
		}

		let finalTxt = "";
		for (let tag of this.rootTags) {
			finalTxt += tag.render();
		}
		this.manageSlotAndBlock(finalTxt);
	}

	public getParsedInfo(className: string): HtmlTemplateResult {
		className = className.toLowerCase();
		if (this.resultsByClassName[className]) {
			return this.resultsByClassName[className];
		}
		let result: HtmlTemplateResult = {
			elements: [],
			content: {},
			injection: {},
			bindings: {},
			events: [],
			pressEvents: [],
			loops: []
		}

		for (let tag of this.rootTags) {
			let resultTemp = tag.getTemplateInfo(className);
			ParserHtml.mergeTemplateResult(result, resultTemp);
		}
		this.resultsByClassName[className] = result;
		return result;
	}
	public getVariables() {
		return {
			localVars: this.localVars,
			globalVars: this.globalVars
		}
	}

	// TODO replace it with tag management
	private manageSlotAndBlock(finalTxt: string) {
		let body = finalTxt;
		let removeBody = body;
		let regexBlock = /<block( name="(.*?)")?>((\s|\S)*?)<\/block>/g
		let result: RegExpExecArray | null;
		while (result = regexBlock.exec(body)) {
			this.blocksInfo[result[2]] = result[3];
			removeBody = removeBody.replace(result[0], '');
		}
		removeBody = removeBody.trim();
		if (removeBody.length > 0 || finalTxt.trim().length == 0) {
			this.blocksInfo['default'] = removeBody;
		}

		let regexSlot = /<slot( name="(.*?)")?>(\s|\S)*?<\/slot>/g
		while (result = regexSlot.exec(body)) {
			if (!result[2]) {
				result[2] = "default";
			}
			this.slotsInfo[result[2]] = result[0];
		}
	}
}
