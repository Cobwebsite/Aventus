import { SCSSParsedRule } from '../../scss/LanguageService';
import { ParserHtml } from './ParserHtml';
import { ActionChange, HtmlTemplateResult, PressEventMapValues, pressEventMap } from './definition';

export class TagInfo {
	public tagName: string = "";
	public children: (TagInfo | ContentInfo)[] = [];
	public attributes: { [name: string]: AttributeInfo } = {};
	public hasClose: boolean = false;
	public selfClosing: boolean = false;
	public id: string = "";
	public start: number = 0;
	public end: number = 0;
	public idLoop: number | null = null;
	public parentLoopId: number | null = null;
	private isInsideLoop: boolean = false;
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
	public forInstance: {
		_id: string,
		from: string,
		item: string
		index: string,
		positionFrom: { start: number, end: number }
	} | null = null;

	public get isMainTemplate() {
		return this.forInstance == null;
	}
	public get componentClassName(): string {
		return this.parser.htmlFile.tsFile?.componentClassName.toLowerCase() ?? "";
	}



	public constructor(parser: ParserHtml, tagName: string, start: number, end: number) {
		this.parser = parser;
		this.tagName = tagName;
		this.start = start;
		this.openTagStart = start;
		this.end = end;
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
	private createLoopId() {
		ParserHtml.idLoop++;
		this.idLoop = ParserHtml.idLoop;
		if (ParserHtml.loopsInfo.length > 0) {
			this.parentLoopId = ParserHtml.loopsInfo[ParserHtml.loopsInfo.length - 1].idLoop;
		}
		ParserHtml.loopsInfo.push(this);
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

		if (this.attributes['@for']) {
			this.createLoopId();
			if (this.forInstance) {
				ParserHtml.addVariable(this.forInstance.from.split(".")[0]);
				ParserHtml.addVariable(this.forInstance.item, true);
				if (this.forInstance.index) {
					ParserHtml.addVariable(this.forInstance.index, true);
				}
			}
		}

		if (ParserHtml.loopsInfo.length > 0) {
			this.isInsideLoop = true;
			this.aliasMultiple = true;
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

		if (this.attributes['@for']) {
			let index = ParserHtml.loopsInfo.indexOf(this);
			if (index != -1) {
				ParserHtml.loopsInfo.splice(index, 1);
			}
		}

		for (let injection of this.injections) {
			ParserHtml.addVariable(injection.variableName.split(".")[0]);
		}
		for (let binding of this.bindings) {
			ParserHtml.addVariable(binding.bindingName.split('.')[0]);
		}
		this.checkStyle(ParserHtml.getRules(), (point) => ParserHtml.addStyleLink(point));
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
		if (this.forInstance) {
			return `<template _id="${this.forInstance._id}"></template>`
		}
		else {
			return this._render();
		}
	}

	public renderLoop(): string {
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
			loops: []
		}

		let id = this.id;

		const addResultInfo = (result: HtmlTemplateResult) => {
			if (this.alias) {
				let nb = this.aliasMultiple ? 2 : 1;
				result.elements.push({
					name: this.alias,
					ids: [id],
					tags: { [this.tagName]: nb },
					useLive: this.isInsideLoop,
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

		if (this.forInstance) {
			let templateResult: HtmlTemplateResult = {
				elements: [],
				content: {},
				injection: {},
				bindings: {},
				events: [],
				pressEvents: [],
				loops: []
			}
			addResultInfo(templateResult);
			for (let child of this.children) {
				if (child instanceof TagInfo) {
					let resultTemp = child.getTemplateInfo(className);
					ParserHtml.mergeTemplateResult(templateResult, resultTemp);
				}
			}
			let index = this.forInstance.index;
			let anchorId = this.forInstance._id
			if (!index) {
				index = "index_" + anchorId;
			}
			result.loops.push({
				loopId: this.idLoop || 0,
				anchorId: anchorId,
				template: this.renderLoop(),
				from: this.forInstance.from,
				index: index,
				item: this.forInstance.item,
				actions: templateResult,
				loopParentId: this.parentLoopId,
				positionFrom: this.forInstance.positionFrom
			})
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
		this.nameStart = nameStart;
		this.nameEnd = nameEnd;
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
		this.valueStart = valueStart;
		this.valueEnd = valueEnd;

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
		else if (this.name === "@for") {
			let match = /^((.+?)(,(.+?))? in )(.+?)$/g.exec(value);
			if (match) {
				let idTemplate = this.tag.componentClassName + "_" + ParserHtml.idElement;
				ParserHtml.idElement++;
				let fromStart = match.index + match[1].length;
				let fromEnd = match.index + match[1].length;
				this.tag.forInstance = {
					_id: idTemplate,
					from: match[5].trim(),
					index: match[4] ? match[4].trim() : '',
					item: match[2].trim(),
					positionFrom: {
						start: fromStart,
						end: fromEnd
					}
				}
				ParserHtml.addInterestPoint({
					name: match[5].trim(),
					start: fromStart,
					end: fromEnd,
					type: 'property'
				})
			}
			else {
				ParserHtml.addError(this.nameStart, this.valueEnd, `Your for loop must be similar to "$item(, $index) in $array`)
			}

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
		this.start = start;
		this.end = end;
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
	
}

function parseTxt(value: string, valueStart: number): {
	changes: ActionChange[],
	txt: string
} {
	let regex = /\{\{(.*?)\}\}/g;
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