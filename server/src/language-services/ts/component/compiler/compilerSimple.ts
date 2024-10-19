// import { TextDocument } from 'vscode-languageserver-textdocument';
// import { AventusErrorCode, AventusExtension } from '../../../../definition';
// import { AventusFile } from '../../../../files/AventusFile';
// import { Build } from '../../../../project/Build';
// import { AventusHTMLFile } from '../../../html/File';
// import { ParserHtml } from '../../../html/parser/ParserHtml';
// import { AventusWebSCSSFile } from '../../../scss/File';
// import { ParserTs } from '../../parser/ParserTs';
// import { AventusWebComponentLogicalFile } from '../File';
// import { AventusSimpleWebcomponentTemplate } from './Template';
// import { CompileComponentResult, CustomFieldModel } from './def';
// import { AventusTsLanguageService, CompileTsResult } from '../../LanguageService';
// import { BaseInfo, InfoType } from '../../parser/BaseInfo';
// import { ClassInfo } from '../../parser/ClassInfo';
// import { createErrorTs, createErrorTsPos } from '../../../../tools';
// import { EOL } from 'os';
// import { DebuggerDecorator } from '../../parser/decorators/DebuggerDecorator';
// import { TagNameDecorator } from '../../parser/decorators/TagNameDecorator';
// import { RequiredDecorator } from '../../parser/decorators/RequiredDecorator';
// import { HtmlTemplateResult } from '../../../html/parser/definition';
// import { HTMLDoc } from '../../../html/helper/definition';
// import { HttpServer } from '../../../../live-server/HttpServer';
// import { InputType } from '@storybook/csf';
// import { PropertyInfo } from '../../parser/PropertyInfo';
// import { TypeInfo } from '../../parser/TypeInfo';
// import { AliasInfo } from '../../parser/AliasInfo';
// import { PropertyDecorator } from '../../parser/decorators/PropertyDecorator';
// import { transpile } from 'typescript';


// export class AventusWebcomponentCompilerSimple {


// 	private file: AventusFile;
// 	private logicalFile: AventusWebComponentLogicalFile;
// 	private hasStory: boolean;
// 	private htmlParsed: ParserHtml | undefined;
// 	private htmlParsedResult: HtmlTemplateResult | undefined;
// 	private htmlFile: AventusHTMLFile | undefined;
// 	private htmlDoc: HTMLDoc | undefined;
// 	private scssTxt: string = "";
// 	private scssFile: AventusWebSCSSFile | undefined;
// 	private result: CompileComponentResult = {
// 		diagnostics: [],
// 		writeCompiled: false,
// 		missingViewElements: { position: -1, elements: {} },
// 		missingMethods: { position: -1, elements: [] },
// 		componentName: '',
// 		result: [],
// 		htmlDoc: {},
// 		scssDoc: {},
// 		debug: ''
// 	}
// 	private componentResult: CompileTsResult = {
// 		hotReload: "",
// 		compiled: "",
// 		docVisible: "",
// 		npm: {
// 			defTs: "",
// 			namespace: "",
// 			exportPath: "",
// 			uri: "",
// 			src: ""
// 		},
// 		docInvisible: "",
// 		dependances: [],
// 		classScript: "",
// 		classDoc: "",
// 		debugTxt: "",
// 		uri: "",
// 		required: false,
// 		type: InfoType.class,
// 		isExported: true,
// 		convertibleName: '',
// 		tagName: '',
// 		story: {}
// 	}
// 	private template: string;
// 	private templateHotReload: string;
// 	private templateNpm?: string;

// 	private document: TextDocument;
// 	private build: Build;
// 	private fileParsed: ParserTs | null;

// 	private classInfo: ClassInfo | undefined;
// 	private debuggerDecorator: DebuggerDecorator | null = null;
// 	private tagName: string = "";
// 	private className: string = "";
// 	private fullName: string = "";


// 	public constructor(logicalFile: AventusWebComponentLogicalFile, build: Build) {
// 		this.logicalFile = logicalFile;
// 		this.hasStory = build.hasStories;
// 		let scssFile: AventusWebSCSSFile | undefined;
// 		let htmlFile: AventusHTMLFile | undefined;
// 		if (logicalFile.file.uri.endsWith(AventusExtension.Component)) {
// 			this.file = build.wcFiles[logicalFile.file.uri].logic.file;
// 			scssFile = build.wcFiles[logicalFile.file.uri].style;
// 			htmlFile = build.wcFiles[logicalFile.file.uri].view;
// 		}
// 		else {
// 			this.file = logicalFile.file;
// 			scssFile = build.scssFiles[logicalFile.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentStyle)];
// 			htmlFile = build.htmlFiles[logicalFile.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentView)];
// 		}
// 		this.scssFile = scssFile;
// 		this.scssTxt = scssFile ? scssFile.compileResult : '';
// 		this.htmlFile = htmlFile;
// 		if (this.htmlFile) {
// 			this.htmlParsed = this.htmlFile.fileParsed;
// 			this.htmlFile.tsErrors = [];
// 		}
// 		let nativeDiags = build.tsLanguageService.doValidation(this.file);
// 		let methodName = this.logicalFile.viewMethodName;
// 		for (let i = 0; i < nativeDiags.length; i++) {
// 			if (nativeDiags[i].message.startsWith("'" + methodName)) {
// 				nativeDiags.splice(i, 1);
// 				i--;
// 			}
// 		}
// 		this.result.diagnostics = nativeDiags;
// 		this.template = AventusSimpleWebcomponentTemplate();
// 		this.templateHotReload = AventusSimpleWebcomponentTemplate();
// 		if (build.hasNpmOutput) {
// 			this.templateNpm = AventusSimpleWebcomponentTemplate();
// 		}
// 		this.document = logicalFile.file.documentInternal;
// 		this.build = build;
// 		this.fileParsed = logicalFile.fileParsed;
// 	}

// 	public compile(): CompileComponentResult {
// 		if (this.fileParsed) {
// 			for (let name in this.fileParsed.aliases) {
// 				this.result.result.push(AventusTsLanguageService.compileTs(this.fileParsed.aliases[name], this.logicalFile));
// 			}
// 			for (let name in this.fileParsed.enums) {
// 				this.result.result.push(AventusTsLanguageService.compileTs(this.fileParsed.enums[name], this.logicalFile));
// 			}
// 			for (let name in this.fileParsed.classes) {
// 				let current = this.fileParsed.classes[name];
// 				if (this.isComponentClassInfo(current)) {
// 					if (this.classInfo != null) {
// 						let txt = "Only one class is allowed inside a file. Get " + current.name + " and " + this.classInfo.name;
// 						this.result.diagnostics.push(createErrorTsPos(this.document, txt, current.nameStart, current.nameEnd, AventusErrorCode.MultipleWebComponent));
// 						this.result.diagnostics.push(createErrorTsPos(this.document, txt, this.classInfo.nameStart, this.classInfo.nameEnd, AventusErrorCode.MultipleWebComponent));
// 					}
// 					else {
// 						this.classInfo = current;
// 					}
// 				}
// 				else {
// 					this.result.result.push(AventusTsLanguageService.compileTs(current, this.logicalFile));
// 				}
// 			}
// 		}

// 		if (this.classInfo) {
// 			this.logicalFile.build.addNamespace(this.classInfo.namespace);
// 			this.compileComponentClassInfo();
// 			this.result.htmlDoc = this.htmlDoc ?? {};
// 			this.result.scssDoc = this.prepareDocSCSS();
// 			this.result.componentName = this.className;
// 			this.result.writeCompiled = this.debuggerDecorator !== null && this.debuggerDecorator.writeCompiled;
// 			for (let infoTemp of this.result.result) {
// 				if (infoTemp.debugTxt) {
// 					this.result.debug += infoTemp.debugTxt + EOL;
// 				}
// 			}
// 			if (this.htmlParsed && this.hasStory && this.classInfo.storieContent) {
// 				let wcStory = this.classInfo.storieContent as IStoryContentWebComponent;
// 				delete wcStory.slots;

// 				const slots: IStoryContentWebComponentSlot[] = []
// 				if (this.classInfo.storieDecorator?.slots?.inject) {
// 					this.classInfo.storieDecorator.slots.inject;

// 				}
// 				for (let slotName in this.htmlParsed.slotsInfo) {
// 					const slot: IStoryContentWebComponentSlot = {
// 						name: slotName,
// 					}
// 					this.storyArgTypes["@" + slotName] = {
// 						control: "text",
// 						table: {
// 							category: "Slot"
// 						}
// 					}
// 					if (this.classInfo.documentation?.documentationSlots[slotName]) {
// 						slot.documentation = this.classInfo.documentation.documentationSlots[slotName]
// 						this.storyArgTypes["@" + slotName].description = slot.documentation
// 					}
// 					if (this.classInfo.storieDecorator?.slots?.values && this.classInfo.storieDecorator.slots.values[slotName]) {
// 						this.storyArgs["@" + slotName] = this.classInfo.storieDecorator.slots.values[slotName].slice(1, -1);
// 					}
// 					else {
// 						this.storyArgs["@" + slotName] = '';
// 					}
// 					slots.push(slot);
// 				}

// 				this.classInfo.loadStoryBookInject();

// 				if (slots.length > 0) {
// 					wcStory.slots = slots;
// 				}
// 			}
// 		}
// 		else {
// 			this.result.diagnostics.push(createErrorTs(this.document, "Can't found a web component class to compile inside", AventusErrorCode.NoWebComponent))
// 		}
// 		return this.result;
// 	}


// 	private compileComponentClassInfo() {
// 		if (this.classInfo) {
// 			this.prepareComponentClassInfo(this.classInfo);
// 			let normalCompile = AventusTsLanguageService.compileTs(this.classInfo, this.logicalFile);
// 			this.componentResult.classScript = normalCompile.classScript;
// 			this.componentResult.classDoc = normalCompile.classDoc;
// 			this.componentResult.dependances = normalCompile.dependances;
// 			this.componentResult.docInvisible = normalCompile.docInvisible;
// 			this.componentResult.docVisible = normalCompile.docVisible;
// 			this.componentResult.npm = normalCompile.npm;
// 			this.componentResult.type = normalCompile.type;
// 			this.componentResult.isExported = normalCompile.isExported;
// 			this.componentResult.uri = normalCompile.uri;

// 			this.prepareHTMLDocObject();
// 			this.addViewElementToDependance();
// 			this.writeFile();

// 			if (!this.classInfo.isAbstract && !this.classInfo.isInterface) {
// 				this.componentResult.tagName = this.tagName;
// 			}
// 			this.componentResult.compiled = this.template.replace("//todelete for hmr °", "");
// 			this.componentResult.npm.src = this.templateNpm?.replace("//todelete for hmr °", "") ?? '';
// 			if (HttpServer.isRunning) {
// 				this.componentResult.hotReload = this.templateHotReload.split("//todelete for hmr °")[0];
// 				this.componentResult.hotReload = this.componentResult.hotReload.slice(this.componentResult.hotReload.indexOf("=") + 1);
// 			}
// 			if (this.debuggerDecorator && this.debuggerDecorator.writeCompiled) {
// 				this.componentResult.debugTxt = this.componentResult.compiled;
// 			}
// 			this.result.result.push(this.componentResult);
// 		}
// 	}
// 	private prepareComponentClassInfo(info: ClassInfo) {
// 		for (let decorator of info.decorators) {
// 			let tempDebugger = DebuggerDecorator.is(decorator);
// 			if (tempDebugger) {
// 				this.debuggerDecorator = tempDebugger;
// 				continue;
// 			}
// 			let tempTagName = TagNameDecorator.is(decorator);
// 			if (tempTagName && tempTagName.tagName) {
// 				if (tempTagName.tagName.indexOf("-") == -1 || tempTagName.tagName.toLowerCase() != tempTagName.tagName) {
// 					this.result.diagnostics.push(createErrorTsPos(this.document, "tag name must be in lower case and have a - inside", decorator.contentStart, decorator.contentEnd, AventusErrorCode.TagLower));
// 				}
// 				else {
// 					this.tagName = tempTagName.tagName;
// 				}
// 				continue;
// 			}
// 			let tempRequiredDecorator = RequiredDecorator.is(decorator);
// 			if (tempRequiredDecorator) {
// 				this.componentResult.required = true;
// 			}
// 		}

// 		this.getClassName(info);
// 		if (this.htmlParsed) {
// 			this.htmlParsedResult = this.htmlParsed.getParsedInfo(this.className);
// 		}
// 	}

// 	private getClassName(classInfo: ClassInfo) {
// 		let splittedName = classInfo.name.match(/([A-Z][a-z]*)|([0-9]+[a-z]*)/g);
// 		if (splittedName) {
// 			let componentPrefixes = this.build.getComponentPrefix().split("-");
// 			for (let i = 0; i < componentPrefixes.length; i++) {
// 				let componentPrefix = componentPrefixes[i];
// 				if (componentPrefix.length > 0 && splittedName[i].toLowerCase() != componentPrefix.toLowerCase()) {
// 					// no special tag => add one
// 					splittedName.splice(0, 0, componentPrefixes.join("-").toLowerCase());
// 					break;
// 				}
// 			}
// 			if (this.tagName == "") {
// 				this.tagName = splittedName.join("-").toLowerCase();
// 			}
// 			this.className = classInfo.name;
// 			this.fullName = classInfo.fullName;
// 		}
// 	}

// 	private isComponentClassInfo(info: BaseInfo) {
// 		return info instanceof ClassInfo && info.isInterface && info.extends.length == 1;
// 	}


// 	private addViewElementToDependance() {
// 		if (this.htmlParsed && this.htmlFile) {
// 			this.logicalFile.resetViewClassInfoDep();
// 			let addedDep: string[] = [];
// 			let fileByTag: { [name: string]: AventusWebComponentLogicalFile | null } = {}
// 			for (let interestPoint of this.htmlParsed.interestPoints) {
// 				if (interestPoint.type == "tag") {
// 					if (!addedDep.includes(interestPoint.name)) {
// 						addedDep.push(interestPoint.name);
// 						let dependance = this.build.getWebComponentTagDependance(interestPoint.name);
// 						if (dependance) {
// 							for (let dep of this.componentResult.dependances) {
// 								if (dep.fullName == dependance.fullName) {
// 									return;
// 								}
// 							}

// 							this.componentResult.dependances.push(dependance)
// 						}
// 					}

// 					if (!fileByTag.hasOwnProperty(interestPoint.name)) {
// 						let temp = this.build.getWebComponentDefinitionFile(interestPoint.name);
// 						if (temp instanceof AventusWebComponentLogicalFile) {
// 							fileByTag[interestPoint.name] = temp;
// 						}
// 						else {
// 							fileByTag[interestPoint.name] = null;
// 						}
// 					}
// 					let file = fileByTag[interestPoint.name]
// 					if (file) {
// 						this.logicalFile.addViewClassInfoDep(file, interestPoint.start, interestPoint.end);
// 					}
// 				}
// 			}
// 		}
// 	}
// 	private prepareHTMLDocObject() {
// 		if (this.classInfo && !this.classInfo.isAbstract) {
// 			this.htmlDoc = {
// 				[this.tagName]: {
// 					class: this.classInfo.fullName,
// 					name: this.tagName,
// 					description: this.classInfo.documentation?.fullDefinitions.join(EOL) ?? '',
// 					attributes: {}
// 				}
// 			};
// 		}
// 	}



// 	//#region prepare file
// 	private writeFile() {
// 		this.writeFileName();
// 		this.writeFileTemplateHtml();
// 		this.writeFileReplaceVar("style", this.scssTxt);
// 		this.writeFileHotReloadReplaceVar("style", this.scssTxt);
// 		this.writeFileNpmReplaceVar("style", this.scssTxt);
// 		this.writeFileFields();
// 		this.writeFileMethods();
// 		this.writeFileConstructor();
// 		this.template = this.template.replace(/\|\!\*(.*?)\*\!\|/g, "{{$1}}");
// 		this.template = this.removeWhiteSpaceLines(this.template);

// 		this.templateHotReload = this.templateHotReload.replace(/\|\!\*(.*?)\*\!\|/g, "{{$1}}");
// 		this.templateHotReload = this.removeWhiteSpaceLines(this.templateHotReload);

// 		if (this.templateNpm) {
// 			this.templateNpm = this.templateNpm.replace(/\|\!\*(.*?)\*\!\|/g, "{{$1}}");
// 			this.templateNpm = this.removeWhiteSpaceLines(this.templateNpm);
// 		}
// 	}

// 	private writeFileName() {
// 		this.writeFileReplaceVar("classname", this.className)
// 		this.writeFileHotReloadReplaceVar("classname", this.className)
// 		this.writeFileNpmReplaceVar("classname", this.className)

// 		this.writeFileReplaceVar("parentClass", this.classInfo!.extends[0]);
// 		this.writeFileHotReloadReplaceVar("parentClass", this.classInfo!.extends[0]);
// 		this.writeFileNpmReplaceVar("parentClass", this.classInfo!.extends[0]);
// 		let moduleName = this.build.module;

// 		if (this.fullName.includes(".")) {
// 			this.writeFileReplaceVar("fullname", this.fullName);
// 			this.writeFileHotReloadReplaceVar("fullname", this.fullName);
// 			this.writeFileNpmReplaceVar("fullname", "const " + this.className);

// 			let currentNamespaceWithDot = "." + this.classInfo?.namespace;
// 			this.writeFileReplaceVar("namespace", this.fullName + ".Namespace=`" + moduleName + currentNamespaceWithDot + "`;");
// 			this.writeFileHotReloadReplaceVar("namespace", this.fullName + ".Namespace=`" + moduleName + currentNamespaceWithDot + "`;");
// 			this.writeFileNpmReplaceVar("namespace", this.className + ".Namespace=`" + moduleName + currentNamespaceWithDot + "`;");
// 		}
// 		else {
// 			this.writeFileReplaceVar("fullname", "const " + this.fullName);
// 			this.writeFileHotReloadReplaceVar("fullname", "const " + this.fullName);
// 			this.writeFileNpmReplaceVar("fullname", "const " + this.fullName);

// 			this.writeFileReplaceVar("namespace", this.fullName + ".Namespace=`" + moduleName + "`;");
// 			this.writeFileHotReloadReplaceVar("namespace", this.fullName + ".Namespace=`" + moduleName + "`;");
// 			this.writeFileNpmReplaceVar("namespace", this.className + ".Namespace=`" + moduleName + "`;");
// 		}
// 		if (this.classInfo?.isAbstract) {
// 			this.writeFileReplaceVar("tag", "");
// 			this.writeFileHotReloadReplaceVar("tag", "");
// 			this.writeFileNpmReplaceVar("tag", "");
// 		}
// 		else {
// 			this.writeFileReplaceVar("tag", this.fullName + ".Tag=`" + this.tagName + "`;");
// 			this.writeFileHotReloadReplaceVar("tag", this.fullName + ".Tag=`" + this.tagName + "`;");
// 			this.writeFileNpmReplaceVar("tag", this.className + ".Tag=`" + this.tagName + "`;");
// 		}
// 		if (this.build.namespaces.includes(this.fullName)) {
// 			this.writeFileReplaceVar("namespaceStart", '_n = ' + this.fullName + ';' + EOL);
// 			this.writeFileHotReloadReplaceVar("namespaceStart", '_n = ' + this.fullName + ';' + EOL);
// 			this.writeFileNpmReplaceVar("namespaceStart", '_n = ' + this.fullName + ';' + EOL);

// 			this.writeFileReplaceVar("namespaceEnd", EOL + 'Object.assign(' + this.fullName + ', _n);' + EOL);
// 			this.writeFileHotReloadReplaceVar("namespaceEnd", EOL + 'Object.assign(' + this.fullName + ', _n);' + EOL);
// 			this.writeFileNpmReplaceVar("namespaceEnd", EOL + 'Object.assign(' + this.fullName + ', _n);' + EOL);
// 		}
// 		else {
// 			this.writeFileReplaceVar("namespaceStart", '');
// 			this.writeFileHotReloadReplaceVar("namespaceStart", '');
// 			this.writeFileNpmReplaceVar("namespaceStart", '');

// 			this.writeFileReplaceVar("namespaceEnd", '');
// 			this.writeFileHotReloadReplaceVar("namespaceEnd", '');
// 			this.writeFileNpmReplaceVar("namespaceEnd", '');
// 		}
// 		if (this.classInfo?.isExported) {
// 			this.writeFileReplaceVar("exported", "_." + this.fullName + "=" + this.fullName + ";");
// 			this.writeFileHotReloadReplaceVar("exported", "_." + this.fullName + "=" + this.fullName + ";");
// 		}
// 		else {
// 			this.writeFileReplaceVar("exported", "");
// 			this.writeFileHotReloadReplaceVar("exported", "");
// 		}
// 		this.writeFileNpmReplaceVar("exported", "");

// 		if (this.classInfo?.isAbstract) {
// 			this.writeFileReplaceVar("definition", "")
// 			this.writeFileHotReloadReplaceVar("definition", "")
// 			this.writeFileNpmReplaceVar("definition", "")

// 			this.writeFileReplaceVar("customImport", "")
// 			this.writeFileHotReloadReplaceVar("customImport", "")
// 			this.writeFileNpmReplaceVar("customImport", "")
// 		}
// 		else {
// 			let aventusName = this.build.isCoreBuild ? "" : "Aventus.";
// 			this.writeFileReplaceVar("definition", "if(!window.customElements.get('" + this.tagName + "')){window.customElements.define('" + this.tagName + "', " + this.fullName + ");" + aventusName + "WebComponentInstance.registerDefinition(" + this.fullName + ");}")
// 			this.writeFileHotReloadReplaceVar("definition", "if(!window.customElements.get('" + this.tagName + "')){window.customElements.define('" + this.tagName + "', " + this.fullName + ");" + aventusName + "WebComponentInstance.registerDefinition(" + this.fullName + ");}")
// 			this.writeFileNpmReplaceVar("definition", "if(!window.customElements.get('" + this.tagName + "')){window.customElements.define('" + this.tagName + "', " + this.className + ");WebComponentInstance.registerDefinition(" + this.className + ");}");

// 			if (this.templateNpm && this.fileParsed) {
// 				this.fileParsed.registerGeneratedImport('@aventusjs/main/Aventus', "WebComponentInstance", true);
// 			}
// 		}


// 	}
// 	private writeFileTemplateHtml() {
// 		let htmlTxt = "";
// 		if (this.htmlParsed) {
// 			htmlTxt = this.htmlParsed.blocksInfo['default'] ?? '';
// 		}
// 		this.writeFileReplaceVar("html", htmlTxt);
// 		this.writeFileHotReloadReplaceVar("html", htmlTxt);
// 		this.writeFileNpmReplaceVar("html", htmlTxt);
// 	}


// 	//#region fields
// 	private allFields: { [fieldName: string]: CustomFieldModel } = {};
// 	public storyArgTypes: { [name: string]: InputType } = {};
//     public storyArgs: { [name: string]: any } = {};

// 	private loadFields(): { [key: string]: CustomFieldModel } {
// 		let classInfo = this.classInfo;
// 		if (!classInfo) return {};

// 		let result: { [key: string]: CustomFieldModel } = {};
// 		for (let propName in classInfo.properties) {
// 			let property = classInfo.properties[propName];
// 			if (this.allFields[property.name]) {
// 				continue;
// 			}
// 			let found = false;
// 			let cloneProp = new CustomFieldModel(property.prop, property.isInsideInterface, classInfo);
// 			for (let decorator of property.decorators) {
// 				if (decorator.name == "Attribute") {
// 					cloneProp.propType = 'Attribute';
// 					cloneProp.inParent = false;
// 					result[property.name] = cloneProp;
// 					found = true;
// 					break;
// 				}
// 				else if (decorator.name == "Property") {
// 					cloneProp.propType = 'Property';
// 					cloneProp.inParent = false;
// 					result[property.name] = cloneProp;
// 					found = true;
// 					break;
// 				}
// 				else if (decorator.name == "Watch") {
// 					this.result.diagnostics.push(createErrorTsPos(this.document, "Can't use watch variable inside simple Component", property.nameStart, property.nameEnd, AventusErrorCode.NoWebComponent))
// 					break;
// 				}
// 				else if (decorator.name == "ViewElement") {
// 					cloneProp.propType = 'ViewElement';
// 					cloneProp.inParent = false;
// 					result[property.name] = cloneProp;
// 					found = true;
// 					break;
// 				}
// 			}
// 			if (!found) {
// 				cloneProp.propType = 'Simple';
// 				cloneProp.inParent = false;
// 				result[propName] = cloneProp;
// 			}
// 		}
// 		return result;
// 	}
	
//     private addStoryField(field: CustomFieldModel) {
//         if (!this.hasStory) return;

//         let category: string = "";

//         if (field.propType == "Attribute") category = "Attributes";
//         else if (field.propType == "Property") category = "Properties";

//         let type = this.validateTypeForProp(this.document, field);
//         if (!type) {
//             return;
//         }
//         let control: "text" | "select" | "boolean" | 'number' | 'date' | 'object' = "text";
//         let values: string[] = [];
//         let storyValue: string | null = field.defaultValue;
//         if (type.kind == "string") {
//             control = "text";
//         }
//         else if (type.kind == "literal") {
//             control = "select";
//             let value = type.value;
//             if (value.startsWith("'") || value.startsWith('"')) {
//                 value = value.substring(1);
//             }
//             if (value.endsWith("'") || value.endsWith('"')) {
//                 value = value.substring(0, value.length - 1);
//             }
//             storyValue = field.defaultValue?.slice(1, -1) ?? null;
//             values.push(value);
//         }
//         else if (type.kind == "union") {
//             control = "select";
//             for (let nested of type.nested) {
//                 let value = nested.value;
//                 if (value.startsWith("'") || value.startsWith('"')) {
//                     value = value.substring(1);
//                 }
//                 if (value.endsWith("'") || value.endsWith('"')) {
//                     value = value.substring(0, value.length - 1);
//                 }
//                 values.push(value);
//             }
//             storyValue = field.defaultValue?.slice(1, -1) ?? null;
//         }
//         else if (type.kind == "number") {
//             control = "number";
//         }
//         else if (type.kind == "boolean") {
//             control = "boolean";
//         }
//         else if (type.kind === "type" && type.value == "Date") {
//             control = "date";
//         }
//         else if (type.kind === "type" && type.value == "DateTime") {
//             control = "date";
//         }
//         else {
//             control = "object"
//         }

//         this.storyArgTypes[field.name] = {
//             control: control,
//             table: {
//                 category: category
//             }
//         }
//         if (values.length > 0) {
//             this.storyArgTypes[field.name].options = values;
//         }

//         this.storyArgs[field.name] = storyValue
//     }
// 	private writeFileFields() {
// 		this.loadFields();
// 		let simpleVariables: CustomFieldModel[] = [];
// 		let attributes: CustomFieldModel[] = [];
// 		let properties: { field: CustomFieldModel, fctTxt: string | null }[] = [];
// 		let viewsElements: { [name: string]: CustomFieldModel } = {};

// 		for (let fieldName in this.allFields) {
// 			let field = this.allFields[fieldName];
// 			if (field.propType == "Attribute") {
// 				attributes.push(field);
// 				this.addStoryField(field);
// 				continue;
// 			}
// 			else if (field.propType == "Property") {
// 				this.addStoryField(field);
// 				for (let decorator of field.decorators) {
// 					let tempProp = PropertyDecorator.is(decorator);
// 					if (tempProp) {
// 						properties.push({
// 							field: field,
// 							fctTxt: tempProp.fctTxt
// 						})
// 					}
// 				}
// 				continue;
// 			}
// 			else if (field.propType == "ViewElement") {
// 				viewsElements[field.name] = field;
// 				if (!field.overrideNullable) {
// 					this.result.diagnostics.push(createErrorTsPos(this.document, "You must add ! after the name to avoid undefined value", field.nameStart, field.nameEnd, AventusErrorCode.ExclamationMarkMissing));
// 				}
// 			}
// 			else if (field.propType == "Simple") {
// 				simpleVariables.push(field);
// 			}
// 		}
// 		this.viewsElements = viewsElements;
// 		this.writeFileFieldsSimpleVariable(simpleVariables);
// 		this.writeFileFieldsAttribute(attributes);
// 		this.writeFileFieldsProperty(properties);
// 		this.writeFileFieldsWatch(watches);

// 		if (this.upgradeAttributes.length > 0) {
// 			this.upgradeAttributes = `__upgradeAttributes() { super.__upgradeAttributes(); ${this.upgradeAttributes} }`
// 		}
// 		this.writeFileReplaceVar("upgradeAttributes", this.upgradeAttributes);
// 		this.writeFileHotReloadReplaceVar("upgradeAttributes", this.upgradeAttributes);
// 		this.writeFileNpmReplaceVar("upgradeAttributes", this.upgradeAttributes);


// 		if (this.htmlParsedResult) {
// 			this.writeViewInfo(this.htmlParsedResult, true);
// 			for (let name in viewsElements) {
// 				this.createUnusedViewElement(viewsElements[name]);
// 			}
// 		}
// 		this.writeViewGlobalVariables();
// 	}

// 	private writeFileFieldsSimpleVariable(fields: CustomFieldModel[]) {
//         if (!this.htmlParsedResult) {
//             return;
//         }
//         let variablesSimpleTxt = "";
//         let variablesSimpleHotReloadTxt = "";
//         let variablesSimpleNpmTxt = "";

//         let simpleCorrect: string[] = [];
//         let fullTxt = "";
//         let fullTxtHotReload = "";
//         let fullTxtNpm = "";
//         if (this.classInfo) {
//             for (let fieldName in this.classInfo.propertiesStatic) {
//                 let field = this.classInfo.propertiesStatic[fieldName];
//                 fullTxt += field.compiledContent + EOL;
//                 fullTxtHotReload += field.compiledContentHotReload + EOL;
//                 if (this.templateNpm) {
//                     fullTxtNpm += field.compiledContentNpm + EOL;
//                 }
//             }
//         }
//         for (let field of fields) {
//             fullTxt += field.compiledContent + EOL;
//             fullTxtHotReload += field.compiledContentHotReload + EOL;
//             if (this.templateNpm) {
//                 fullTxtNpm += field.compiledContentNpm + EOL;
//             }

//             if (field.isGet || field.isSet) {
//                 if (!simpleCorrect.includes(field.name)) {
//                     simpleCorrect.push(field.name);
//                     this.upgradeAttributes += 'this.__correctGetter(\'' + field.name + '\');' + EOL;
//                 }
//             }
//         }
//         let fullClassFields = `class MyCompilationClassAventus {${fullTxt}}`;
//         let fieldsCompiled = "";
//         try {
//             fieldsCompiled = transpile(fullClassFields, AventusTsLanguageService.getCompilerOptionsCompile());
//         } catch (e) {

//         }
//         let matchContent = /\{((\s|\S)*)\}/gm.exec(fieldsCompiled);
//         if (matchContent) {
//             variablesSimpleTxt = matchContent[1].trim();
//         }
//         this.writeFileReplaceVar('variables', variablesSimpleTxt);

//         if (HttpServer.isRunning) {
//             let fullClassFieldsHotReload = `class MyCompilationClassAventus {${fullTxtHotReload}}`;
//             let fieldsCompiledHotReload = "";
//             try {
//                 fieldsCompiledHotReload = transpile(fullClassFieldsHotReload, AventusTsLanguageService.getCompilerOptionsCompile());
//             } catch (e) {

//             }
//             let matchContentHotReload = /\{((\s|\S)*)\}/gm.exec(fieldsCompiledHotReload);
//             if (matchContentHotReload) {
//                 variablesSimpleHotReloadTxt = matchContentHotReload[1].trim();
//             }
//             this.writeFileHotReloadReplaceVar('variables', variablesSimpleHotReloadTxt);
//         }

//         if (this.templateNpm) {
//             let fullClassFieldsNpm = `class MyCompilationClassAventus {${fullTxtNpm}}`;
//             let fieldsCompiledNpm = "";
//             try {
//                 fieldsCompiledNpm = transpile(fullClassFieldsNpm, AventusTsLanguageService.getCompilerOptionsCompile());
//             } catch (e) {

//             }
//             let matchContentNpm = /\{((\s|\S)*)\}/gm.exec(fieldsCompiledNpm);
//             if (matchContentNpm) {
//                 variablesSimpleNpmTxt = matchContentNpm[1].trim();
//             }
//             this.writeFileNpmReplaceVar('variables', variablesSimpleNpmTxt);
//         }
//     }
// 	//#endregion


// 	//#region utils
// 	private writeFileReplaceVar(variable: string, value: string | number) {
// 		let regex = new RegExp("\\$" + variable + "\\$", "g");
// 		this.template = this.template.replace(regex, value + "");
// 	}
// 	private writeFileHotReloadReplaceVar(variable: string, value: string | number) {
// 		if (HttpServer.isRunning) {
// 			let regex = new RegExp("\\$" + variable + "\\$", "g");
// 			this.templateHotReload = this.templateHotReload.replace(regex, value + "");
// 		}
// 	}
// 	private writeFileNpmReplaceVar(variable: string, value: string | number) {
// 		if (this.templateNpm) {
// 			let regex = new RegExp("\\$" + variable + "\\$", "g");
// 			this.templateNpm = this.templateNpm.replace(regex, value + "");
// 		}
// 	}
// 	private removeWhiteSpaceLines(txt: string) {
// 		return txt.replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, '');
// 	}
// 	private _validateTypeForProp(currentDoc: TextDocument, field: PropertyInfo, type: TypeInfo): TypeInfo | null {
//         if (type.kind == "boolean" || type.kind == "number" || type.kind == "string") {
//             return type;
//         }
//         else if (type.kind == "type") {
//             if (type.value == "Date" || type.value == "DateTime") {
//                 return type;
//             }
//             else {
//                 let info = ParserTs.getBaseInfo(type.value);
//                 if (info && info instanceof AliasInfo) {
//                     return this._validateTypeForProp(currentDoc, field, info.type);
//                 }

//             }
//         }
//         else if (type.kind == "literal") {
//             return type;
//         }
//         else if (type.kind == "union") {
//             let firstNested: TypeInfo | undefined;
//             for (let nested of type.nested) {
//                 if (nested.kind == 'undefined') {
//                     field.isNullable = true;
//                 }
//                 if (!firstNested) {
//                     if (nested.kind != 'undefined') {
//                         firstNested = nested;
//                     }
//                 }
//                 else if (nested.kind != firstNested.kind && nested.kind != 'undefined') {
//                     firstNested = undefined;
//                     break;
//                 }
//             }
//             if (firstNested) {
//                 if (firstNested.kind == 'literal') {
//                     return type;
//                 }
//                 else {
//                     return this._validateTypeForProp(currentDoc, field, firstNested);
//                 }
//             }
//         }
//         this.result.diagnostics.push(createErrorTsPos(currentDoc, "can't use the the type " + type.kind + "(" + type.value + ")" + " as attribute / property", field.nameStart, field.nameEnd, AventusErrorCode.WrongTypeDefinition));
//         return null;
//     }
//     private validateTypeForProp(currentDoc: TextDocument, field: PropertyInfo): TypeInfo | null {
//         if (field.name.toLowerCase() != field.name) {
//             this.result.diagnostics.push(createErrorTsPos(this.document, "an attribute must be in lower case", field.nameStart, field.nameEnd, AventusErrorCode.AttributeLower));
//         }
//         let type = this._validateTypeForProp(currentDoc, field, field.type);
//         if (type) {
//             if (type.kind == "boolean" || type.kind == "number") {
//                 if (!field.overrideNullable && field.defaultValue === null) {
//                     this.result.diagnostics.push(createErrorTsPos(this.document, "You must add ! after the name to avoid undefined value", field.nameStart, field.nameEnd, AventusErrorCode.ExclamationMarkMissing));
//                 }
//             }
//             else {
//                 if (!field.isNullable && field.defaultValue === null) {
//                     this.result.diagnostics.push(createErrorTsPos(this.document, "You must add ? after the name to allow undefined value", field.nameStart, field.nameEnd, AventusErrorCode.QuestionMarkMissing));
//                 }
//             }
//         }
//         return type;
//     }
// 	//#endregion


// 	//#endregion


// }

