import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../../definition';
import { LanguageService, TokenType, getLanguageService } from 'vscode-html-languageservice';
import { AttributeInfo, Binding, ContentInfo, ContextEditing, ForLoop, IfInfo, Injection, TagInfo } from './TagInfo';
import { Build } from '../../../project/Build';
import { ActionChange, ActionLoop, HtmlTemplateResult, InterestPoint } from './definition';
import { AventusHTMLFile } from '../File';
import { SCSSParsedRule } from '../../scss/LanguageService';
import { createErrorHTMLPos, pathToUri, uriToPath } from '../../../tools';
import { Decorator, ForOfStatement, IfStatement, Node, ScriptTarget, SyntaxKind, createSourceFile, forEachChild } from 'typescript';
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
			if (this.parsedDoc[document.file.uri].version == document.file.versionUser) {
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
		main.contextEdits = [...main.contextEdits, ...toMerge.contextEdits];
		main.injection = [...main.injection, ...toMerge.injection];
		main.bindings = [...main.bindings, ...toMerge.bindings];

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
	}

	public static addInterestPoint(point: InterestPoint) {
		if (this.currentParsingDoc) {
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
			if (this.parsedDoc[document.file.uri].version == document.file.versionUser) {
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
			let nbLoop = this.currentParsingDoc.loops.length + this.currentParsingDoc.loops.reduce((acc, p) => p.isSimple ? acc : acc + 1, 0);
			let nbFct = Object.keys(this.currentParsingDoc.fcts).length;
			let nbEdit = this.currentParsingDoc.contextEdits.length;
			let nbInjection = this.currentParsingDoc.injections.length;
			let nbBinding = this.currentParsingDoc.bindings.length * 2;
			let tot = nb + nbFct + nbLoop + nbIf + nbEdit + nbInjection + nbBinding;
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
				let variables = this.getVariables();
				if (name) {
					let result: ActionChange = {
						name: name,
						positions: [{
							start: fct.start,
							end: fct.end,
						}],
						txt: fct.txt,
						variables: variables,
					}
					this.currentParsingDoc.fcts[contentmd5] = result;
					return result;
				}
			}
		}
		return null;
	}

	/**
	 * Transform position from the raw file to compiled file
	 * The raw format is the one where user is typing
	 * The compiled format is the one where for and if are replaced by <i> and <l>
	 * @param pos Position inside the raw
	 * @returns 
	 */
	public static fromRawToCompiled(position: number): number {
		if (this.currentParsingDoc) {
			return this.currentParsingDoc.fromRawToCompiled(position);
		}
		return position
	}
	/**
	 * Transform position from the compiled file to raw file
	 * The raw format is the one where user is typing
	 * The compiled format is the one where for and if are replaced by <i> and <l>
	 * @param pos Position inside the compiled
	 * @returns 
	 */
	public static fromCompiledToRaw(position: number): number {
		if (this.currentParsingDoc) {
			return this.currentParsingDoc.fromCompiledToRaw(position)
		}
		return position
	}
	public static addLoopStack(nb: number): ForLoop | null {
		if (this.currentParsingDoc) {
			let loop = this.currentParsingDoc.loops.find(p => p.idTemplate == nb);
			if (loop) {
				loop.recalculateVariables();
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
					_if.recalculateVariables(nb);
					this.currentParsingDoc?.stacks.push({
						idTemplate: nb
					});
					return _if;
				}
			}
		}
		return null;
	}
	public static addInjection(injection: Injection) {
		this.currentParsingDoc?.injections.push(injection);
	}
	public static addBinding(binding: Binding) {
		this.currentParsingDoc?.bindings.push(binding);
	}
	public static addTagInfoStack(tagInfo: TagInfo) {
		this.currentParsingDoc?.stacks.push(tagInfo);
	}
	public static getContextEditing(id: number) {
		return this.currentParsingDoc?.contextEdits.find(p => p.id == id)
	}
	public static removeStack() {
		this.currentParsingDoc?.stacks.pop();
	}
	public static getParentId(): number | undefined {
		if (this.currentParsingDoc && this.currentParsingDoc.stacks.length > 0) {
			for (let i = this.currentParsingDoc.stacks.length - 1; i >= 0; i--) {
				let stack = this.currentParsingDoc.stacks[i]
				if (stack instanceof ForLoop) {
					return stack.idTemplate;
				}
				else if (stack instanceof TagInfo) {

				}
				else {
					return stack.idTemplate;
				}
			}
		}
		return undefined;
	}

	public static getVariables() {
		let variables: string[] = [];
		if (this.currentParsingDoc) {
			for (let stack of this.currentParsingDoc.stacks) {
				if (stack instanceof ForLoop || stack instanceof TagInfo) {
					for (let name of stack.variableNames) {
						if (!variables.includes(name)) {
							variables.push(name);
						}
					}
				}
			}
		}
		return variables;
	}


	//#endregion

	public uri: string;
	public errors: Diagnostic[] = [];
	private document: TextDocument;

	private rootTags: TagInfo[] = [];
	public tags: TagInfo[] = [];


	public blocksInfo: { [name: string]: string } = {}
	public slotsInfo: { [name: string]: string } = {}
	public resultsByClassName: { [className: string]: HtmlTemplateResult } = {};
	public interestPoints: InterestPoint[] = []
	public rules: SCSSParsedRule;
	public styleLinks: [{ start: number, end: number }, { start: number, end: number }][] = []
	public fcts: { [md5: string]: ActionChange } = {};
	public htmlFile: AventusHTMLFile;
	public loops: ForLoop[] = [];
	public ifs: IfInfo[] = [];
	public injections: Injection[] = [];
	public bindings: Binding[] = [];
	public contextEdits: ContextEditing[] = [];
	public diffRawToCompiled: { [key: number]: number } = {};
	public diffCompiledToRaw: { [key: number]: number } = {};
	public stacks: (ForLoop | { idTemplate: number } | TagInfo)[] = [];
	public compiledTxt: string = "";

	/**
	 * Transform position from the raw file to compiled file
	 * The raw format is the one where user is typing
	 * The compiled format is the one where for and if are replaced by <i> and <l>
	 * @param pos Position inside the raw
	 * @returns 
	 */
	public fromRawToCompiled(pos: number) {
		let newPos = pos;
		for (let key in this.diffRawToCompiled) {
			if (Number(key) > pos) {
				break;
			}
			newPos += this.diffRawToCompiled[key];
		}
		return newPos;
	}
	/**
	 * Transform position from the compiled file to raw file
	 * The raw format is the one where user is typing
	 * The compiled format is the one where for and if are replaced by <i> and <l>
	 * @param pos Position inside the compiled
	 * @returns 
	 */
	public fromCompiledToRaw(pos: number) {
		let newPos = pos;
		for (let key in this.diffCompiledToRaw) {
			if (Number(key) > pos) {
				break;
			}
			newPos += this.diffCompiledToRaw[key];
		}
		return newPos;
	}
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
			version: document.file.versionUser,
			result: this,
		}
		let fileContent = this.getFileContent(document.file.documentUser);
		this.rules = document.scssFile?.rules ?? new Map();
		this.document = TextDocument.create(document.file.uri, document.file.documentUser.languageId, document.file.versionUser, fileContent);
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
		txt = txt.replace(/\\if/g, "&#105;f");
		txt = txt.replace(/\\else/g, "&#101;lse");
		txt = txt.replace(/\\for/g, "&#102;or");
		txt = txt.replace(/\\@Context/g, "&#64;Context");
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
						if (_if.isValid) {
							this.ifs.push(_if);
							transformations = [...transformations, ..._if.transformations];
						}
					}
				}
				else if ([SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement, SyntaxKind.ForStatement].includes(x.kind)) {
					if (x.getText() !== 'for') {
						let forLoopTemp = new ForLoop(x as ForOfStatement, sliceText);
						if (forLoopTemp.isValid) {
							forLoop = forLoopTemp;
							transformations = [...transformations, ...forLoop.transformations];
							this.loops.push(forLoop);
							this.stacks.push(forLoop);
						}
					}
				}
				else if (x.kind == SyntaxKind.Decorator) {
					let txt = x.getText();
					if (txt.startsWith("@Context(")) {
						let ctxEdit = new ContextEditing(x as Decorator, sliceText);
						transformations = [...transformations, ...ctxEdit.transformations];
						this.contextEdits.push(ctxEdit)
					}
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


		//#region transfrom file to replace js by tags <c> and <l> + create difference
		transformations.sort((a, b) => b.end - a.end); // order from end file to start file
		let lastPos = txt.length;
		this.diffRawToCompiled = {}
		for (let transformation of transformations) {
			if (transformation.end > lastPos) continue;
			let min = Math.min(transformation.newText.length, transformation.end - transformation.start)
			this.diffRawToCompiled[transformation.start + min] = transformation.newText.length - (transformation.end - transformation.start);
			txt = txt.slice(0, transformation.start) + transformation.newText + txt.slice(transformation.end, txt.length);
			lastPos = transformation.start;
		}
		let diff = 0;
		for (let key in this.diffRawToCompiled) {
			let newKey = Number(key) + diff;
			let newValue = this.diffRawToCompiled[key] * -1;
			diff += this.diffRawToCompiled[key];
			this.diffCompiledToRaw[newKey] = newValue;
		}

		//#endregion

		//#region reset comment that was replaced before
		for (let start in replacements) {
			let replacement = replacements[start];
			let newStart = this.fromRawToCompiled(Number(start));
			txt = txt.slice(0, newStart) + replacement + txt.slice(newStart + replacement.length);
		}
		//#endregion

		return txt;
	}


	private parse(document: TextDocument) {
		let txt = this.parseJs(document);
		this.compiledTxt = txt;
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
						//debugger;
					}
					else if (scanner.getTokenType() == TokenType.Script) {
						// ParserHtml.addError(scanner.getTokenOffset(), scanner.getTokenEnd(), "You can't use script inside")
						//debugger;
					}
					else if (scanner.getTokenType() == TokenType.Styles) {
						//debugger;
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
			injection: [],
			bindings: [],
			events: [],
			pressEvents: [],
			loops: [],
			ifs: [],
			contextEdits: []
		}

		for (let tag of this.rootTags) {
			let resultTemp = tag.getTemplateInfo(className);
			ParserHtml.mergeTemplateResult(result, resultTemp);
		}
		this.resultsByClassName[className] = result;
		return result;
	}


	// TODO replace it with tag management
	private manageSlotAndBlock(finalTxt: string) {
		let body = finalTxt;
		let removeBody = body;
		let regexBlock = /<block.*?( name="(.*?)")?>((\s|\S)*?)<\/block>/g
		let result: RegExpExecArray | null;
		while (result = regexBlock.exec(body)) {
			this.blocksInfo[result[2]] = result[3];
			removeBody = removeBody.replace(result[0], '');
		}
		removeBody = removeBody.trim();
		if (removeBody.length > 0 || finalTxt.trim().length == 0) {
			this.blocksInfo['default'] = removeBody;
		}

		let regexSlot = /<slot.*?( name="(.*?)")?>(\s|\S)*?<\/slot>/g
		while (result = regexSlot.exec(body)) {
			if (!result[2]) {
				result[2] = "default";
			}
			this.slotsInfo[result[2]] = result[0];
		}
	}
}
