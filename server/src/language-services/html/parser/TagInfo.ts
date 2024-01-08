import { Block, ForInStatement, ForOfStatement, IfStatement, SyntaxKind, forEachChild } from 'typescript';
import { SCSSParsedRule } from '../../scss/LanguageService';
import { ParserHtml } from './ParserHtml';
import { ActionChange, ActionIf, ActionIfPart, ActionLoop, HtmlTemplateResult, PressEventMapValues, pressEventMap } from './definition';

export class TagInfo {
	public tagName: string = "";
	public children: (TagInfo | ContentInfo)[] = [];
	public attributes: { [name: string]: AttributeInfo } = {};
	public hasClose: boolean = false;
	public selfClosing: boolean = false;
	public id: string = "";
	public start: number = 0;
	public end: number = 0;
	public parent: TagInfo | null = null;

	public openTagStart: number = 0;
	public openTagEnd: number = 0;

	public alias: string | null = null;
	public aliasMultiple: boolean | undefined = undefined;
	public pressEvent: { [key: PressEventMapValues]: { value: string, start: number, end: number } } | null = null;
	public eventsPerso: { event: string, fct: string, start: number, end: number }[] = [];
	public injections: { variableName: string, injectedName: string, start: number, end: number }[] = [];
	public bindings: { event?: string, bindingName: string, valueName?: string, start: number, end: number }[] = [];
	private changes: { [id_attr: string]: string } = {};

	public parser: ParserHtml;

	public get componentClassName(): string {
		return this.parser.htmlFile.tsFile?.componentClassName.toLowerCase() ?? "";
	}
	public get isLoop(): boolean {
		return this.tagName == ForLoop.tagName;
	}
	public get isIf(): boolean {
		return this.tagName == IfInfo.tagName;
	}

	public loopInfo?: ForLoop;
	public ifInfo?: IfInfo;



	public constructor(parser: ParserHtml, tagName: string, start: number, end: number) {
		this.parser = parser;
		this.tagName = tagName;
		this.start = start;
		this.openTagStart = start;
		this.end = end;
		if (this.isLoop) {
			this.createId();
			return;
		}
		if (this.isIf) {
			return;
		}
		ParserHtml.addInterestPoint({ name: tagName, start, end, type: "tag" });
		if (selfClosingTags.includes(tagName)) {
			this.selfClosing = true;
		}
	}

	public createId() {
		if (!this.id) {
			this.id = this.componentClassName + "_" + ParserHtml.idElement;
			ParserHtml.idElement++;
		}
		return this.id;
	}


	public addAttribute(attributeInfo: AttributeInfo) {
		if (!this.attributes[attributeInfo.name]) {
			this.attributes[attributeInfo.name] = attributeInfo;
		}
		else {
			ParserHtml.addError(attributeInfo.nameStart, attributeInfo.nameEnd, "Duplicate attribute " + attributeInfo.name);
		}
	}
	public addChild(tag: TagInfo) {
		this.children.push(tag);
		tag.parent = this;
	}
	public addContent(content: ContentInfo) {
		this.children.push(content);
	}
	public addChanges(attrName: string, fct: string) {
		let tagId = this.createId();
		let key = tagId + "°" + attrName;
		this.changes[key] = fct;
	}

	public validateAllProps(openTagEnd: number) {
		this.openTagEnd = openTagEnd;
		if (this.alias) {
			let isMultiple = this.alias.endsWith("[]");
			if (isMultiple) {
				this.alias = this.alias.replace("[]", "");
			}
			if (isMultiple) {
				this.aliasMultiple = isMultiple;
			}
		}
		if (this.isLoop) {
			let loop = ParserHtml.addLoopStack(Number(this.attributes["id"].value));
			if (loop) this.loopInfo = loop
		}
		else if (this.isIf) {
			let idIf = Number(this.attributes["id"].value);
			let _if = ParserHtml.addIfStack(idIf);
			if (_if) {
				this.ifInfo = _if;
				if (idIf == _if.idsTemplate[0]) {
					let _id = this.createId();
					_if._id = _id;
				}
			}

		}
	}
	public afterClose(start: number, end: number) {
		this.hasClose = true;
		if (!this.selfClosing) {
			ParserHtml.addInterestPoint({
				name: this.tagName,
				start,
				end,
				type: 'tag'
			})
		}

		for (let injection of this.injections) {
			ParserHtml.addVariable(injection.variableName.split(".")[0]);
		}
		for (let binding of this.bindings) {
			ParserHtml.addVariable(binding.bindingName.split('.')[0]);
		}
		this.checkStyle(ParserHtml.getRules(), (point) => ParserHtml.addStyleLink(point));
		if (this.isLoop || this.isIf) {
			ParserHtml.removeStack();
		}
	}

	public checkStyle(rules: SCSSParsedRule, addStyleLink: (point: [{ start: number, end: number }, { start: number, end: number }]) => void) {
		for (let [validate, position] of rules) {
			if (validate(this)) {
				let classPos = {
					start: this.openTagStart,
					end: this.openTagEnd
				}
				addStyleLink([classPos, position]);
			}
		}
	}


	private _render(): string {
		let attrs: string[] = [];
		for (let attributeName in this.attributes) {
			let attr = this.attributes[attributeName];
			if (attr.mustBeAdded) {
				if (attr.value != null) {
					attrs.push(attr.name + "=\"" + attr.value + "\"");
				}
				else {
					attrs.push(attr.name);
				}
			}
		}
		if (this.id) {
			attrs.push("_id=\"" + this.id + "\"")
		}
		let attrTxt = "";
		if (attrs.length > 0) {
			attrTxt = " " + attrs.join(" ");
		}
		if (this.selfClosing) {
			return `<${this.tagName}${attrTxt} />`;
		}
		return `<${this.tagName}${attrTxt}>${this.children.map(c => c.render()).join("")}</${this.tagName}>`;
	}
	public render(): string {
		if (this.isLoop) {
			return '<template _id="' + this.id + '"></template>';
		}
		if (this.isIf) {
			// its the first if
			if (this.id) {
				return '<template _id="' + this.id + '"></template>';
			}
			// its the other else if
			return '';
		}
		return this._render();
	}


	public getTemplateInfo(className: string): HtmlTemplateResult {
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


		let id = this.id;

		const addResultInfo = (result: HtmlTemplateResult) => {
			if (this.alias) {
				let nb = this.aliasMultiple ? 2 : 1;
				result.elements.push({
					name: this.alias,
					ids: [id],
					tags: { [this.tagName]: nb },
					useLive: false,
					isArray: nb > 1,
					positions: [{ start: this.attributes['@element'].valueStart, end: this.attributes['@element'].valueEnd }]
				});
			}
			for (let key in this.changes) {
				result.content[key] = this.changes[key];
			}
			for (let injection of this.injections) {
				let simpleName = injection.variableName.split('.')[0];
				if (!result.injection[simpleName]) {
					result.injection[simpleName] = []
				}
				result.injection[simpleName].push({
					id: id,
					injectionName: injection.injectedName,
					inject: `@_@(c) => c.${injection.variableName.split(".").join("?.")}@_@`,
					path: injection.variableName,
					position: {
						start: injection.start,
						end: injection.end
					}
				})

			}
			for (let binding of this.bindings) {
				let simpleName = binding.bindingName.split('.')[0];
				if (!result.bindings[simpleName]) {
					result.bindings[simpleName] = []
				}

				let eventNames: string[] = [];
				if (binding.event) {
					eventNames = [binding.event];
				}
				else if (['input', 'textarea'].includes(this.tagName)) {
					eventNames = ['change', 'input'];
				}
				else {
					eventNames = ['change'];
				}
				result.bindings[simpleName].push({
					id: id,
					valueName: binding.valueName ?? 'value',
					eventNames: eventNames,
					tagName: this.tagName,
					path: binding.bindingName,
					position: {
						start: binding.start,
						end: binding.end,
					}
					// isCallback => deal by typescript
				})
			}
			for (let event of this.eventsPerso) {
				result.events.push({
					eventName: event.event,
					id: id,
					fct: event.fct,
					tagName: this.tagName,
					position: {
						start: event.start,
						end: event.end,
					}
				});
			}
			if (this.pressEvent) {
				result.pressEvents.push({ ...this.pressEvent, id: id })
			}

		}

		if (this.loopInfo) {
			let templateResult: HtmlTemplateResult = {
				elements: [],
				content: {},
				injection: {},
				bindings: {},
				events: [],
				pressEvents: [],
				loops: [],
				ifs: [],
			}
			let templateTxt = "";
			for (let child of this.children) {
				if (child instanceof TagInfo) {
					let resultTemp = child.getTemplateInfo(className);
					ParserHtml.mergeTemplateResult(templateResult, resultTemp);
				}
				templateTxt += child.render();
			}

			let resultLoop: ActionLoop = {
				templateId: this.loopInfo.idTemplate || 0,
				anchorId: this.id,
				template: templateTxt,
				actions: templateResult,
				parentId: ParserHtml.getParentId(),
			}
			if (this.loopInfo.isSimple) {
				resultLoop.simple = this.loopInfo.simple;
			}
			result.loops.push(resultLoop);
		}
		else if (this.isIf && this.ifInfo) {
			let idIf = Number(this.attributes["id"].value);
			let templateResult: HtmlTemplateResult = {
				elements: [],
				content: {},
				injection: {},
				bindings: {},
				events: [],
				pressEvents: [],
				loops: [],
				ifs: [],
			}
			let templateTxt = "";
			for (let child of this.children) {
				if (child instanceof TagInfo) {
					let resultTemp = child.getTemplateInfo(className);
					ParserHtml.mergeTemplateResult(templateResult, resultTemp);
				}
				templateTxt += child.render();
			}
			this.ifInfo.registerPart({
				template: templateTxt,
				templateId: idIf,
				templateAction: templateResult,
				condition: "",
			})



			if (idIf == this.ifInfo.idsTemplate[this.ifInfo.idsTemplate.length - 1]) {
				let resultIfs: ActionIf = {
					anchorId: this.ifInfo._id,
					parts: this.ifInfo.parts,
					parentId: ParserHtml.getParentId()
				}
				result.ifs.push(resultIfs);
			}
		}
		else {
			addResultInfo(result);
			for (let child of this.children) {
				if (child instanceof TagInfo) {
					let resultTemp = child.getTemplateInfo(className);
					ParserHtml.mergeTemplateResult(result, resultTemp);
				}
			}
		}




		return result;
	}
}

const selfClosingTags = [
	'area',
	'base',
	'br',
	'col',
	'embed',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
]

const reservedAttributes = ['_id']
export class AttributeInfo {
	public name: string = "";
	public value: string | null = null;
	public nameStart: number = 0;
	public nameEnd: number = 0;
	public valueStart: number = 0;
	public valueEnd: number = 0;
	public tag: TagInfo;
	public mustBeAdded: boolean = true;


	public constructor(name: string, nameStart: number, nameEnd: number, tag: TagInfo) {
		this.name = name;
		this.nameStart = ParserHtml.fromCompiledToRaw(nameStart);
		this.nameEnd = ParserHtml.fromCompiledToRaw(nameEnd);
		this.tag = tag;
		this.manageSpecialAttribute();
	}



	private manageSpecialAttribute() {
		if (this.name.startsWith("@")) {
			this.tag.createId();
			this.mustBeAdded = false;
		}
		else if (this.name.startsWith(":")) {
			this.tag.createId();
			this.mustBeAdded = false;
		}
		else if (reservedAttributes.includes(this.name)) {
			ParserHtml.addError(this.nameStart, this.nameEnd, "The attribute " + this.name + " is used by Aventus internally");
			this.mustBeAdded = false;
		}
	}


	public setValue(value: string, valueStart: number, valueEnd: number) {
		value = value.replace(/"/g, "");
		this.value = value;
		this.valueStart = ParserHtml.fromCompiledToRaw(valueStart);
		this.valueEnd = ParserHtml.fromCompiledToRaw(valueEnd);

		if (this.name === "@element") {
			this.tag.alias = value;
			ParserHtml.addInterestPoint({
				name: value,
				start: this.nameStart,
				end: this.valueEnd,
				type: 'property'
			})
		}
		else if (this.name.startsWith("@bind")) {
			let result: { event?: string, bindingName: string, valueName?: string, start: number, end: number } = {
				bindingName: value,
				start: valueStart,
				end: valueEnd
			};
			let splitted = this.name.split(":")
			let fct = splitted[0];
			if (fct.startsWith("@bind_")) {
				result.event = fct.replace("@bind_", "");
			}

			if (splitted.length > 1) {
				result.valueName = splitted[1];
			}
			this.tag.bindings.push(result);
			ParserHtml.addInterestPoint({
				name: value,
				start: this.nameStart,
				end: this.valueEnd,
				type: 'method'
			})
		}
		else if (this.name.startsWith(":")) {
			let injectedName = this.name.slice(1);
			this.tag.injections.push({
				variableName: value,
				injectedName,
				start: valueStart,
				end: valueEnd
			})
			ParserHtml.addInterestPoint({
				name: value,
				start: this.nameStart,
				end: this.valueEnd,
				type: 'property'
			})
		}
		else if (pressEventMap.hasOwnProperty(this.name)) {
			if (!this.tag.pressEvent) {
				this.tag.pressEvent = {};
			}
			this.tag.pressEvent[pressEventMap[this.name]] = {
				value,
				start: this.valueStart,
				end: this.valueEnd
			}
			ParserHtml.addInterestPoint({
				name: value,
				start: this.nameStart,
				end: this.valueEnd,
				type: 'method'
			})
		}
		else if (this.name.startsWith("@")) {
			this.tag.eventsPerso.push({
				event: this.name.slice(1),
				fct: value,
				start: this.valueStart,
				end: this.valueEnd
			})
			ParserHtml.addInterestPoint({
				name: value,
				start: this.nameStart,
				end: this.valueEnd,
				type: 'method'
			})
		}
		else {
			let result = parseTxt(value, this.valueStart);
			if (result.changes.length > 0) {
				this.tag.addChanges(this.name, result.txt);
				this.mustBeAdded = false;
			}
		}
	}
}

export class ContentInfo {
	public content: string = "";
	public start: number = 0;
	public end: number = 0;
	public tag: TagInfo;
	public mustBeAdded: boolean = true;

	public constructor(content: string, start: number, end: number, tag: TagInfo, parse: boolean = true) {
		this.content = content;
		this.start = ParserHtml.fromCompiledToRaw(start);
		this.end = ParserHtml.fromCompiledToRaw(end);
		let part = ParserHtml['currentParsingDoc']?.htmlFile.file.content.slice(this.start, this.end);
		this.tag = tag;
		if (parse) {
			this.manageVariables();
		}
	}

	private manageVariables() {
		let content = this.content;
		let result = parseTxt(content, this.start);
		if (result.changes.length > 0) {
			this.tag.addChanges("@HTML", result.txt);
			this.mustBeAdded = false;
		}
	}


	public render(): string {
		if (this.mustBeAdded) {
			return this.content;
		}
		return "";
	}
}


export class ForLoop {
	public static readonly tagName = "l";
	public idTemplate: number = 0;
	public isSimple: boolean = true;
	public transformations: { newText: string, start: number, end: number }[] = [];

	public start: number = 0;
	public startBlock: number = 0;
	public end: number = 0;
	public loopTxt: string = "";
	public loopName: string = "";

	public simple: {
		data: string,
		item?: string,
		index?: string,
	} = { data: '' }

	public get variableNames(): string[] {
		let result: string[] = [];
		if (this.isSimple) {
			if (this.simple.index) {
				result.push(this.simple.index);
			}
			if (this.simple.item) {
				result.push(this.simple.item);
			}
		}
		return result;
	}
	public variablesType: { [name: string]: string; } = {};
	private sliceText: (start: number, end?: number) => string;


	public constructor(_for: ForOfStatement | ForInStatement, sliceText: (start: number, end?: number) => string) {
		this.sliceText = sliceText;
		this.idTemplate = ParserHtml.createIdTemplate();
		if (_for.kind == SyntaxKind.ForOfStatement || _for.kind == SyntaxKind.ForInStatement) {
			this.loadForInOf(_for);
		}
		this.loopName = ParserHtml.getCustomFctName() ?? "";

		this.variablesType = ParserHtml.getVariablesType();
	}


	private loadForInOf(_for: ForOfStatement | ForInStatement) {
		let i = 0;
		forEachChild(_for, y => {
			if (i == 0) {
				let _var = y.getChildAt(1);
				let varTxt = this.sliceText(_var.getStart(), _var.getEnd());
				if (_for.kind == SyntaxKind.ForInStatement) {
					this.simple.index = varTxt;
				}
				else {
					this.simple.item = varTxt;
				}
			}
			else if (i == 1) {
				this.simple.data = this.sliceText(y.getStart(), y.getEnd());
			}
			else if (i == 2) {
				let start = _for.getStart();
				let startBlock = y.getStart() + 1;
				this.loopTxt = this.sliceText(start, startBlock) + " }";
				let newTxt = "<" + ForLoop.tagName + " id=\"" + this.idTemplate + "\">";
				let newCloseTxt = "</" + ForLoop.tagName + ">";

				this.transformations.push({
					start: start,
					end: startBlock,
					newText: newTxt
				})
				let endBlock = y.getEnd();
				this.transformations.push({
					start: endBlock - 1,
					end: endBlock,
					newText: newCloseTxt
				})

				this.start = start;
				this.startBlock = startBlock;
				this.end = endBlock;

			}
			i++;
		})
	}
}

export type IfInfoCondition = {
	fctName: string,
	start: number;
	end: number;
	txt: string;
	fctTxt: string,
	offsetBefore: number,
	offsetAfter: number,
	idTemplate: number,
	type: 'if' | 'elif'
};
export class IfInfo {
	public static readonly tagName = "i";
	public statements: { txt: string }[] = []
	public idsTemplate: number[] = [];
	public variablesType: { [name: string]: string; } = {};
	public transformations: { newText: string, start: number, end: number }[] = [];
	public end: number = 0;
	public _id: string = "";
	public parts: ActionIfPart[] = [];
	public parentId?: number;

	public conditions: IfInfoCondition[] = [];
	private sliceText: (start: number, end?: number) => string;

	public constructor(_if: IfStatement, sliceText: (start: number, end?: number) => string) {
		this.sliceText = sliceText;
		this.parentId = ParserHtml.getParentId();
		this.variablesType = ParserHtml.getVariablesType();

		this.loadIf(_if);
	}


	private loadIf(_if: IfStatement) {
		let ifTxt = this.sliceText(_if.getStart(), _if.getEnd())
		let blocks: Block[] = [];
		const createId = () => {
			let idIf = ParserHtml.createIdTemplate();
			this.idsTemplate.push(idIf);
			return idIf;
		}
		const transform = (idIf: number, startIf: number, block: Block) => {
			let startBlock = block.getStart() + 1;
			let newTxt = "<" + IfInfo.tagName + " id=\"" + idIf + "\">";
			let newCloseTxt = "</" + IfInfo.tagName + ">";

			this.transformations.push({
				start: startIf,
				end: startBlock,
				newText: newTxt
			})

			let endBlock = block.getEnd();
			this.transformations.push({
				start: endBlock - 1,
				end: endBlock,
				newText: newCloseTxt
			})
		}
		const loadBlocks = (_if: IfStatement, depth: number = 0, start?: number) => {
			let nbBlock = 0;
			if (start === undefined) {
				start = _if.getStart();
			}
			let realStart = start;
			let elseStart: number | undefined = undefined;
			for (let child of _if.getChildren()) {
				if (child.kind == SyntaxKind.ElseKeyword) {
					elseStart = child.getStart();
				}
			}
			let idTemplate = createId();

			forEachChild(_if, y => {
				if (y.kind == SyntaxKind.Block) {
					nbBlock++;
					if (nbBlock == 2) {
						if (elseStart == undefined) {
							throw 'impossible';
						}
						transform(createId(), elseStart, y as Block);
					}
					else {
						transform(idTemplate, realStart, y as Block);
					}
					blocks.push(y as Block);
				}
				else if (y.kind == SyntaxKind.IfStatement) {
					if (elseStart == undefined) {
						throw 'impossible';
					}
					loadBlocks(y as IfStatement, depth + 1, elseStart);
				}
				else if (y.kind == SyntaxKind.BinaryExpression) {
					let fctName = ParserHtml.getCustomFctName(this.conditions.length) ?? '';
					let params = Object.keys(this.variablesType).map(p => "c.data." + p).join(",");
					this.conditions.push({
						fctName: fctName,
						txt: this.sliceText(y.getStart(), y.getEnd()),
						fctTxt: `(c) => c.comp.${fctName}(${params})`,
						start: y.getStart(),
						end: y.getEnd(),
						offsetAfter: 0,
						offsetBefore: 0,
						idTemplate,
						type: depth == 0 ? 'if' : 'elif'
					});
				}
			})
		}
		loadBlocks(_if);

	}

	public registerPart(part: ActionIfPart) {
		if (this.conditions.length > this.parts.length) {
			part.condition = this.conditions[this.parts.length].fctTxt
		}
		else {
			part.condition = "(c) => true";
		}
		this.parts.push(part);
	}
}

function parseTxt(value: string, valueStart: number): {
	changes: ActionChange[],
	txt: string
} {
	let regex = /\{\{([\s|\S]*?)\}\}/g;
	let m: RegExpExecArray | null;
	let result: {
		changes: ActionChange[],
		txt: string
	} = {
		changes: [],
		txt: value
	}
	while (m = regex.exec(value)) {
		let start = valueStart + m.index;
		let end = valueStart + m.index + m[0].length;

		let resultTemp = ParserHtml.createChange({
			txt: m[1],
			start: start,
			end: end
		});
		if (resultTemp) {
			let params = Object.keys(resultTemp.variablesType).map(p => "c.data." + p).join(",");
			let content = "${c.print(c.comp." + resultTemp.name + "(" + params + "))}";
			result.txt = result.txt.replace(m[0], content);
			result.changes.push(resultTemp);
		}
	}

	if (result.changes.length > 0) {
		result.txt = "(c) => `" + result.txt + "`";
	}

	return result;
}