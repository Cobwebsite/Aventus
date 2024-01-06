import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../../definition';
import { LanguageService, TokenType, getLanguageService } from 'vscode-html-languageservice';
import { AttributeInfo, ContentInfo, ForLoop, IfInfo, TagInfo } from './TagInfo';
import { Build } from '../../../project/Build';
import { ActionChange, ActionLoop, HtmlTemplateResult, InterestPoint } from './definition';
import { AventusHTMLFile } from '../File';
import { SCSSParsedRule } from '../../scss/LanguageService';
import { createErrorHTMLPos, pathToUri, uriToPath } from '../../../tools';
import { ForOfStatement, IfStatement, Node, ScriptTarget, SyntaxKind, createSourceFile, forEachChild } from 'typescript';
import { writeFileSync } from 'fs';
import * as md5 from 'md5';

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
		main.ifs = [...main.ifs, ...toMerge.ifs];
		main.content = { ...main.content, ...toMerge.content };

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
	private static idTemplate = 0;
	public static createIdTemplate() {
		let id = this.idTemplate
		this.idTemplate++;
		return id;
	}
	public static getCustomFctName(nb: number = 0) {
		if (this.currentParsingDoc?.htmlFile.tsFile) {
			let nbIf = this.currentParsingDoc.ifs.reduce((acc, p) => acc + p.conditions.length, 0);
			let nbLoop = this.currentParsingDoc.loops.length;
			let nbFct = Object.keys(this.currentParsingDoc.fcts).length;
			let tot = nb + nbFct + nbLoop + nbIf;
			return this.currentParsingDoc.htmlFile.tsFile?.viewMethodName + tot
		}
		return null;
	}

	public static createChange(fct: { start: number, end: number, txt: string }): ActionChange | null {
		if (this.currentParsingDoc) {
			// TODO ajout des variables ici

			let contentmd5 = md5(fct.txt);
			if (this.currentParsingDoc.fcts[contentmd5]) {
				this.currentParsingDoc.fcts[contentmd5].positions.push({
					start: fct.start,
					end: fct.end
				})
				return this.currentParsingDoc.fcts[contentmd5];
			}
			else {
				let name = this.getCustomFctName();
				let variablesType = this.getVariablesType();
				this.currentParsingDoc.stacks.map(p => p instanceof ForLoop ? p.variableNames : [])
				if (name) {
					let result: ActionChange = {
						name: name,
						positions: [{
							start: fct.start,
							end: fct.end,
						}],
						txt: fct.txt,
						variablesType: variablesType
					}
					this.currentParsingDoc.fcts[contentmd5] = result;
					return result;
				}
			}



		}
		return null;
	}

	public static getRawDiff(start: number): number {
		let nb = 0;
		if (this.currentParsingDoc) {
			let keys = Object.keys(this.currentParsingDoc.rawDiff).map(n => Number(n)).sort();

			for (let key of keys) {
				if (key > start) {
					break;
				}
				nb += this.currentParsingDoc.rawDiff[key];
			}
		}
		return nb;
	}
	public static getCurrentDiff(start: number): number {
		let nb = 0;
		if (this.currentParsingDoc) {
			let keys = Object.keys(this.currentParsingDoc.formatedDiff).map(n => Number(n)).sort();

			for (let key of keys) {
				if (key > start) {
					break;
				}
				nb += this.currentParsingDoc.formatedDiff[key];
			}
		}
		return nb;
	}
	public static addLoopStack(nb: number): ForLoop | null {
		if (this.currentParsingDoc) {
			let loop = this.currentParsingDoc.loops.find(p => p.idTemplate == nb);
			if (loop) {
				this.currentParsingDoc?.stacks.push(loop);
				return loop;
			}
		}
		return null;
	}
	public static addIfStack(nb: number): IfInfo | null {
		if (this.currentParsingDoc) {
			for (let _if of this.currentParsingDoc.ifs) {
				if (_if.idsTemplate.includes(nb)) {
					this.currentParsingDoc?.stacks.push({
						idTemplate: nb
					});
					return _if;
				}
			}
		}
		return null;
	}
	public static removeStack() {
		this.currentParsingDoc?.stacks.pop();
	}
	public static getParentId(): number | undefined {
		if (this.currentParsingDoc && this.currentParsingDoc.stacks.length > 0) {
			return this.currentParsingDoc.stacks[0].idTemplate
		}
		return undefined;
	}
	public static getVariablesType() {
		let variablesType: { [name: string]: string; } = {};
		if (this.currentParsingDoc) {
			for (let loop of this.currentParsingDoc.stacks) {
				if (loop instanceof ForLoop) {
					for (let name of loop.variableNames) {
						variablesType[name] = "any";
					}
				}
			}
		}
		return variablesType;
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
	public fcts: { [md5: string]: ActionChange } = {};
	public htmlFile: AventusHTMLFile;
	public loops: ForLoop[] = [];
	public ifs: IfInfo[] = [];
	public rawDiff: { [position: number]: number } = {}
	public formatedDiff: { [position: number]: number } = {}
	public stacks: (ForLoop | { idTemplate: number })[] = [];
	public debugTxt: string = "";

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
		ParserHtml.idElement = 0;
		ParserHtml.idTemplate = 0;
		ParserHtml.idTemplate = 0;
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

	private parseJs(document: TextDocument): string {
		let txt = document.getText();

		//#region replace comment by empty string to avoid conflict with js parsing
		let replacements: { [start: number]: string } = {};
		let regex = /<!--(.|\s)*?-->/g
		let m: RegExpExecArray | null;
		while (m = regex.exec(txt)) {
			let replacement = "";
			for (let i = 0; i < m[0].length; i++) {
				replacement += " ";
			}
			replacements[m.index] = m[0];
			txt = txt.slice(0, m.index) + replacement + txt.slice(m.index + m[0].length);
		}
		//#endregion

		//#region loop though nodes to find if and for
		let realJsTxt = txt;
		const sliceText = (start: number, end?: number) => realJsTxt.slice(start, end);
		let srcFile = createSourceFile("sample.ts", txt.replace(/\{\{|\}\}/g, "  ").replace(/<(\/?.*?)>/g, "'$1'"), ScriptTarget.ESNext, true);
		let transformations: { newText: string, start: number, end: number }[] = [];
		const loop = (node: Node, lvl: number) => {
			forEachChild(node, x => {
				let forLoop: ForLoop | undefined = undefined;
				if (x.kind == SyntaxKind.IfStatement) {
					let _ifStatement = x as IfStatement;
					let isAllowed = true;
					if (_ifStatement.parent.kind == SyntaxKind.IfStatement) {
						let parentIf = _ifStatement.parent as IfStatement;
						if (parentIf.elseStatement == _ifStatement) {
							isAllowed = false;
						}
					}

					if (isAllowed) {
						let _if = new IfInfo(x as IfStatement, sliceText);
						this.ifs.push(_if);
						transformations = [...transformations, ..._if.transformations];
						for (let key in _if.diff) {
							this.rawDiff[key] = _if.diff[key];
						}
					}
				}
				else if (x.kind == SyntaxKind.ForOfStatement || x.kind == SyntaxKind.ForInStatement) {
					forLoop = new ForLoop(x as ForOfStatement, sliceText);
					transformations = [...transformations, ...forLoop.transformations];
					this.loops.push(forLoop);
					this.stacks.push(forLoop);
					if (forLoop.diffBefore)
						this.rawDiff[forLoop.start] = forLoop.diffBefore
					if (forLoop.diffAfter)
						this.rawDiff[forLoop.end] = forLoop.diffAfter
				}
				// avoid parsing inside {{ }}
				if (x.kind == SyntaxKind.Block && node.kind == SyntaxKind.Block) {
					return
				}
				loop(x, lvl + 1)

				if (forLoop) {
					this.stacks.pop();
				}
			})
		}

		loop(srcFile, 0);
		//#endregion

		//#region fromat difference to have right line
		let keys = Object.keys(this.rawDiff).map(n => Number(n)).sort();
		let decalage = 0;
		for (let key of keys) {
			this.formatedDiff[key + decalage] = this.rawDiff[key];
			decalage += this.rawDiff[key];
		}
		//#endregion

		//#region transfrom file to replace js by tags <i> and <l>
		transformations.sort((a, b) => b.end - a.end); // order from end file to start file
		let lastPos = txt.length;
		let transfoDiff: { [key: number]: number } = {}
		for (let transformation of transformations) {
			if (transformation.end > lastPos) continue;
			transfoDiff[transformation.start] = transformation.newText.length - (transformation.end - transformation.start);
			txt = txt.slice(0, transformation.start) + transformation.newText + txt.slice(transformation.end, txt.length);
			lastPos = transformation.start;
		}
		//#endregion

		//#region reset comment that was replaced before
		for (let start in replacements) {
			let replacement = replacements[start];
			let baseStart = Number(start);
			let newStart = Number(start);
			for (let key in transfoDiff) {
				if (Number(key) > baseStart) {
					break;
				}
				newStart += transfoDiff[key];
			}
			txt = txt.slice(0, newStart) + replacement + txt.slice(newStart + replacement.length);
		}
		//#endregion

		return txt;
	}


	private parse(document: TextDocument) {
		let txt = this.parseJs(document);
		writeFileSync(uriToPath(document.uri).replace(".wcv.avt", ".html"), txt);
		this.debugTxt = txt;
		let isInAvoidTagStart: number[] = [];
		let removeNextClose = false;
		let scanner = ParserHtml.languageService.createScanner(txt, 0);
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
			loops: [],
			ifs: [],
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
