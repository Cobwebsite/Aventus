import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../../definition';
import { LanguageService, TokenType, getLanguageService } from 'vscode-html-languageservice';
import { AttributeInfo, ContentInfo, TagInfo } from './TagInfo';
import { Build } from '../../../project/Build';
import { HtmlTemplateResult, InterestPoint } from './definition';


export class ParserHtml {
	//#region static
	private static languageService: LanguageService = getLanguageService();
	private static parsedDoc: { [uri: string]: { version: number, result: ParserHtml } } = {};
	public static getVersion(document: TextDocument): number {
		if (ParserHtml.parsedDoc[document.uri]) {
			return this.parsedDoc[document.uri].version;
		}
		return 0;
	}
	public static parse(document: TextDocument, build: Build): ParserHtml {
		if (ParserHtml.parsedDoc[document.uri]) {
			if (this.parsedDoc[document.uri].version == document.version) {
				return this.parsedDoc[document.uri].result;
			}
		}
		new ParserHtml(document, build);
		return ParserHtml.parsedDoc[document.uri].result;
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

		for (let contextProp in toMerge.content) {
			if (main.content[contextProp]) {
				main.content[contextProp] = [...main.content[contextProp], ...toMerge.content[contextProp]];
			}
			else {
				main.content[contextProp] = toMerge.content[contextProp]
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
	public static idElement = 0;
	public static idLoop = 0;
	public static loopsInfo: TagInfo[] = [];
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


	public getBlocksInfoTxt(className: string) {
		className = className.toLowerCase();
		let blocks: string[] = [];
		for (let name in this.blocksInfo) {
			blocks.push("'" + name + "':`" + this.blocksInfo[name] + "`")
		}
		return blocks.join(",").replace(/\$classname\$/g, className)
	}
	public getSlotsInfoTxt(className: string) {
		className = className.toLowerCase();
		let slots: string[] = [];
		for (let name in this.slotsInfo) {
			slots.push("'" + name + "':`" + this.slotsInfo[name] + "`");
		}
		return slots.join(",").replace(/\$classname\$/g, className)
	}

	public isReady: boolean = false;
	private build: Build;

	private constructor(document: TextDocument, build: Build) {
		this.build = build;
		ParserHtml.parsedDoc[document.uri] = {
			version: document.version,
			result: this,
		}
		let fileContent = this.getFileContent(document);
		this.document = TextDocument.create(document.uri, document.languageId, document.version, fileContent);
		ParserHtml.currentParsingDoc = this;
		this.uri = document.uri;
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

	private parse(document: TextDocument) {
		ParserHtml.idElement = 0;
		ParserHtml.idLoop = 0;
		let isInAvoidTagStart: number[] = [];
		let removeNextClose = false;
		let scanner = ParserHtml.languageService.createScanner(document.getText(), 0);
		let currentTags: TagInfo[] = [];
		let currentAttribute: AttributeInfo | null = null;
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
						lastTag.validateAllProps();
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
						lastTag.validateAllProps();
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

		let finalTxt = "";
		for (let tag of this.rootTags) {
			finalTxt += tag.render();
		}
		if (document.uri == "file:///d%3A/404/5_Prog_SVN/5_Templates/Vscode_Extension/AventusDoc/src/pages/Page/Page.wcv.avt") {
			debugger;
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
		if (removeBody.length > 0) {
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
