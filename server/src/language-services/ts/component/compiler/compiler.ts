import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusErrorCode, AventusExtension } from "../../../../definition";
import { Build } from "../../../../project/Build";
import { createErrorHTMLPos, createErrorTs, createErrorTsPos, createErrorTsSection } from "../../../../tools";
import { AventusHTMLFile } from "../../../html/File";
import { AventusWebSCSSFile } from "../../../scss/File";
import { AventusWebComponentLogicalFile } from "../File";
import { CompileComponentResult, CustomFieldModel, CustomTypeAttribute, ListCallbacks } from "./def";
import { AventusWebcomponentTemplate } from "./Template";
import { transpile } from "typescript";
import { AventusTsLanguageService, CompileTsResult, getSectionStart } from "../../LanguageService";
import { EOL } from "os";
import { HTMLDoc } from "../../../html/helper/definition";
import { SCSSDoc } from "../../../scss/helper/CSSNode";
import { AventusSCSSLanguageService } from "../../../scss/LanguageService";
import { AventusFile } from '../../../../files/AventusFile';
import { ParserTs } from '../../parser/ParserTs';
import { ClassInfo } from '../../parser/ClassInfo';
import { OverrideViewDecorator } from '../../parser/decorators/OverrideViewDecorator';
import { DebuggerDecorator } from '../../parser/decorators/DebuggerDecorator';
import { TagNameDecorator } from '../../parser/decorators/TagNameDecorator';
import { BaseInfo, InfoType } from '../../parser/BaseInfo';
import { PropertyInfo } from '../../parser/PropertyInfo';
import { TypeInfo } from '../../parser/TypeInfo';
import { PropertyDecorator } from '../../parser/decorators/PropertyDecorator';
import { ViewElementDecorator } from '../../parser/decorators/ViewElementDecorator';
import { StateChangeDecorator } from '../../parser/decorators/StateChangeDecorator';
import { StateActiveDecorator } from '../../parser/decorators/StateActiveDecorator';
import { StateInactiveDecorator } from '../../parser/decorators/StateInactiveDecorator';
import { RequiredDecorator } from '../../parser/decorators/RequiredDecorator';
import { AliasInfo } from '../../parser/AliasInfo';
import { WatchDecorator } from '../../parser/decorators/WatchDecorator';
import { ParserHtml } from '../../../html/parser/ParserHtml';
import { ActionBindings, ActionChange, ActionElement, ActionEvent, ActionInjection, ActionLoop, ActionPressEvent, HtmlTemplateResult, pressEventMap } from '../../../html/parser/definition';
import { DefaultStateActiveDecorator } from '../../parser/decorators/DefaultStateActiveDecorator';
import { DefaultStateInactiveDecorator } from '../../parser/decorators/DefaultStateInactiveDecorator';


export class AventusWebcomponentCompiler {
    public static getVersion(logicalFile: AventusWebComponentLogicalFile, build: Build) {
        let version = {
            ts: logicalFile.file.version,
            scss: -1,
            html: -1
        }
        let scssFile: AventusWebSCSSFile | undefined;
        let htmlFile: AventusHTMLFile | undefined;
        if (logicalFile.file.uri.endsWith(AventusExtension.Component)) {
            scssFile = build.wcFiles[logicalFile.file.uri].style;
            htmlFile = build.wcFiles[logicalFile.file.uri].view;
        }
        else {
            scssFile = build.scssFiles[logicalFile.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentStyle)];
            htmlFile = build.htmlFiles[logicalFile.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentView)];
        }

        if (scssFile) { version.scss = scssFile.compiledVersion; }
        if (htmlFile) { version.html = htmlFile.compiledVersion; }
        return version;
    }

    private file: AventusFile;
    private logicalFile: AventusWebComponentLogicalFile;
    private scssTxt: string = "";
    private template: string;
    private document: TextDocument;
    private build: Build;
    private fileParsed: ParserTs | null;
    private classInfo: ClassInfo | undefined;
    private className: string = "";
    private tagName: string = "";
    private htmlParsed: ParserHtml | undefined;
    private htmlParsedResult: HtmlTemplateResult | undefined;
    private htmlDoc: HTMLDoc | undefined;
    private htmlFile: AventusHTMLFile | undefined;

    //#region variable to use for preparation
    private allFields: { [fieldName: string]: CustomFieldModel } = {};
    private methodsName: string[] = [];

    private listBoolProperties: string[] = [];
    private defaultValueTxt: string = "";
    private foundedWatch: string[] = [];
    private result: CompileComponentResult = {
        diagnostics: [],
        writeCompiled: false,
        missingViewElements: { position: -1, elements: {} },
        missingMethods: { position: -1, elements: [] },
        componentName: '',
        result: [],
        htmlDoc: {},
        scssDoc: {},
        debug: ''
    }
    private componentResult: CompileTsResult = {
        compiled: "",
        docVisible: "",
        docInvisible: "",
        dependances: [],
        classScript: "",
        classDoc: "",
        debugTxt: "",
        uri: "",
        required: false,
        type: InfoType.class,
        isExported: true,
        convertibleName: '',
    }
    private parentClassName: string = "";
    private overrideViewDecorator: OverrideViewDecorator | null = null;
    private debuggerDecorator: DebuggerDecorator | null = null;

    private AventusWebComponent: string = "Aventus.WebComponent";
    private AventusDefaultComponent: string = "Aventus.DefaultComponent";

    //#endregion

    public constructor(logicalFile: AventusWebComponentLogicalFile, build: Build) {
        this.logicalFile = logicalFile;
        if (build.isCoreBuild) {
            this.AventusDefaultComponent = "DefaultComponent";
            this.AventusWebComponent = "WebComponent";
        }
        let scssFile: AventusWebSCSSFile | undefined;
        let htmlFile: AventusHTMLFile | undefined;
        if (logicalFile.file.uri.endsWith(AventusExtension.Component)) {
            this.file = build.wcFiles[logicalFile.file.uri].logic.file;
            scssFile = build.wcFiles[logicalFile.file.uri].style;
            htmlFile = build.wcFiles[logicalFile.file.uri].view;
        }
        else {
            this.file = logicalFile.file;
            scssFile = build.scssFiles[logicalFile.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentStyle)];
            htmlFile = build.htmlFiles[logicalFile.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentView)];
        }
        this.scssTxt = scssFile ? scssFile.compileResult : '';
        this.htmlFile = htmlFile;
        if (htmlFile) {
            this.htmlParsed = htmlFile.fileParsed;
            this.htmlFile.tsErrors = [];
        }
        this.result.diagnostics = build.tsLanguageService.doValidation(this.file);
        this.template = AventusWebcomponentTemplate();
        this.document = logicalFile.file.document;
        this.build = build;
        this.fileParsed = logicalFile.fileParsed;
    }


    public compile(): CompileComponentResult {
        if (this.fileParsed) {
            for (let name in this.fileParsed.aliases) {
                this.result.result.push(AventusTsLanguageService.compileTs(this.fileParsed.aliases[name], this.logicalFile));
            }
            for (let name in this.fileParsed.enums) {
                this.result.result.push(AventusTsLanguageService.compileTs(this.fileParsed.enums[name], this.logicalFile));
            }
            for (let name in this.fileParsed.classes) {
                let current = this.fileParsed.classes[name];
                if (this.isComponentClassInfo(current)) {
                    if (this.classInfo != null) {
                        let txt = "Only one class is allowed inside a file. Get " + current.name + " and " + this.classInfo.name;
                        this.result.diagnostics.push(createErrorTsPos(this.document, txt, current.nameStart, current.nameEnd, AventusErrorCode.MultipleWebComponent));
                        this.result.diagnostics.push(createErrorTsPos(this.document, txt, this.classInfo.nameStart, this.classInfo.nameEnd, AventusErrorCode.MultipleWebComponent));
                    }
                    else {
                        this.classInfo = current;
                    }
                }
                else {
                    this.result.result.push(AventusTsLanguageService.compileTs(current, this.logicalFile));
                }
            }
        }

        if (this.classInfo) {
            this.compileComponentClassInfo();
            this.result.htmlDoc = this.htmlDoc ?? {};
            this.result.scssDoc = this.prepareDocSCSS();
            this.result.componentName = this.className;
            this.result.writeCompiled = this.debuggerDecorator !== null && this.debuggerDecorator.writeCompiled;
            for (let infoTemp of this.result.result) {
                if (infoTemp.debugTxt) {
                    this.result.debug += infoTemp.debugTxt + EOL;
                }
            }

        }
        else {
            this.result.diagnostics.push(createErrorTs(this.document, "Can't found a web component class to compile inside", AventusErrorCode.NoWebComponent))
        }
        return this.result;
    }
    //#region load info from files
    private isComponentClassInfo(info: BaseInfo) {
        if (info instanceof ClassInfo) {
            if (info.implements.includes(this.AventusDefaultComponent) && !info.isInterface) {
                return true;
            }
        }
        return false;
    }
    private compileComponentClassInfo() {
        if (this.classInfo) {
            this.prepareComponentClassInfo(this.classInfo);
            let normalCompile = AventusTsLanguageService.compileTs(this.classInfo, this.logicalFile);
            this.componentResult.classScript = normalCompile.classScript;
            this.componentResult.classDoc = normalCompile.classDoc;
            this.componentResult.dependances = normalCompile.dependances;
            this.componentResult.docInvisible = normalCompile.docInvisible;
            this.componentResult.docVisible = normalCompile.docVisible;
            this.componentResult.type = normalCompile.type;
            this.componentResult.isExported = normalCompile.isExported;
            this.componentResult.uri = normalCompile.uri;

            this.prepareHTMLDocObject();
            this.loadParent(this.classInfo);
            this.addViewElementToDependance();
            this.writeFile();

            this.componentResult.compiled = this.template;
            if (this.debuggerDecorator && this.debuggerDecorator.writeCompiled) {
                this.componentResult.debugTxt = this.template;
            }

            this.result.result.push(this.componentResult);
        }
    }
    private prepareComponentClassInfo(info: ClassInfo) {
        for (let decorator of info.decorators) {
            let tempOverrideView = OverrideViewDecorator.is(decorator);
            if (tempOverrideView) {
                this.overrideViewDecorator = tempOverrideView;
                continue;
            }
            let tempDebugger = DebuggerDecorator.is(decorator);
            if (tempDebugger) {
                this.debuggerDecorator = tempDebugger;
                continue;
            }
            let tempTagName = TagNameDecorator.is(decorator);
            if (tempTagName && tempTagName.tagName) {
                if (tempTagName.tagName.indexOf("-") == -1 || tempTagName.tagName.toLowerCase() != tempTagName.tagName) {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "tag name must be in lower case and have a - inside", decorator.start, decorator.end, AventusErrorCode.TagLower));
                }
                else {
                    this.tagName = tempTagName.tagName;
                }
                continue;
            }
            let tempRequiredDecorator = RequiredDecorator.is(decorator);
            if (tempRequiredDecorator) {
                this.componentResult.required = true;
            }
        }

        if (info.extends.length > 0 && info.extends[0] == this.AventusWebComponent) {
            this.overrideViewDecorator = new OverrideViewDecorator();
        }
        this.getClassName(info);
        if (this.htmlParsed) {
            this.htmlParsedResult = this.htmlParsed.getParsedInfo(this.className);
        }
    }


    private prepareHTMLDocObject() {
        if (this.classInfo && !this.classInfo.isAbstract) {
            this.htmlDoc = {
                [this.tagName]: {
                    class: this.classInfo.fullName,
                    name: this.tagName,
                    description: this.classInfo.documentation.join(EOL),
                    attributes: {}
                }
            };
        }
    }
    private getClassName(classInfo: ClassInfo) {
        let splittedName = classInfo.name.match(/([A-Z][a-z]*)|([0-9][a-z]*)/g);
        if (splittedName) {
            let componentPrefixes = this.build.getComponentPrefix().split("-");
            for (let i = 0;i<componentPrefixes.length;i++) {
                let componentPrefix = componentPrefixes[i];
                if (componentPrefix.length > 0 && splittedName[i].toLowerCase() != componentPrefix.toLowerCase()) {
                    // no special tag => add one
                    splittedName.splice(0, 0, componentPrefixes.join("-").toLowerCase());
                    break;
                }
            }
            if (this.tagName == "") {
                this.tagName = splittedName.join("-").toLowerCase();
            }
            this.className = classInfo.name;
            this.parentClassName = 'Aventus.WebComponent';
            if (classInfo.extends.length > 0 && classInfo.extends[0]) {
                this.parentClassName = classInfo.extends[0];
            }
        }
    }

    private loadParent(classInfo: ClassInfo, isFirst: boolean = true) {
        let fields = this.loadFields(classInfo, isFirst);
        this.allFields = {
            ...this.allFields,
            ...fields
        }

        for (let methodName in classInfo.methods) {
            if (!this.methodsName.includes(methodName)) {
                this.methodsName.push(methodName);
            }
        }

        if (classInfo.extends.length > 0 && classInfo.extends[0] != this.AventusWebComponent) {
            // search parent inside local import
            let nameToUse = classInfo.extends[0];
            let parent = BaseInfo.getInfoByFullName(nameToUse);
            if (parent && parent instanceof ClassInfo) {
                this.loadParent(parent, false);
            }
            else {
                if (this.classInfo) {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "can't found the path for parent " + classInfo.extends[0], this.classInfo.nameStart, this.classInfo.nameEnd, AventusErrorCode.ParsingParentFailed));
                }
            }
        }
    }

    private loadFields(classInfo: ClassInfo, isBase: boolean): { [key: string]: CustomFieldModel } {
        let result: { [key: string]: CustomFieldModel } = {};
        for (let propName in classInfo.properties) {
            let property = classInfo.properties[propName];
            let found = false;
            let cloneProp = new CustomFieldModel(property.prop, property.isInsideInterface);
            for (let decorator of property.decorators) {
                if (decorator.name == "Attribute") {
                    cloneProp.propType = 'Attribute';
                    cloneProp.inParent = !isBase;
                    result[property.name] = cloneProp;
                    found = true;
                    break;
                }
                else if (decorator.name == "Property") {
                    cloneProp.propType = 'Property';
                    cloneProp.inParent = !isBase;
                    result[property.name] = cloneProp;
                    found = true;
                    break;
                }
                else if (decorator.name == "Watch") {
                    cloneProp.propType = 'Watch';
                    cloneProp.inParent = !isBase;
                    result[property.name] = cloneProp;
                    found = true;
                    break;
                }
                else if (decorator.name == "ViewElement") {
                    cloneProp.propType = 'ViewElement';
                    cloneProp.inParent = !isBase;
                    result[property.name] = cloneProp;
                    found = true;
                    break;
                }
            }
            if (!found) {
                cloneProp.propType = 'Simple';
                cloneProp.inParent = !isBase;
                result[property.name] = cloneProp;
            }
        }
        return result;
    }

    //#endregion

    //#region prepare view
    private addViewElementToDependance() {
        if (this.htmlParsed && this.htmlFile) {
            this.logicalFile.resetViewClassInfoDep();
            let addedDep: string[] = [];
            let fileByTag: { [name: string]: AventusWebComponentLogicalFile | null } = {}
            for (let interestPoint of this.htmlParsed.interestPoints) {
                if (interestPoint.type == "tag") {
                    if (!addedDep.includes(interestPoint.name)) {
                        addedDep.push(interestPoint.name);
                        let type = this.build.getWebComponentDefinition(interestPoint.name);
                        if (type) {
                            for (let dep of this.componentResult.dependances) {
                                if (dep.fullName == type.class.fullName) {
                                    return;
                                }
                            }
                            let uri = type.class.fileUri;
                            if (!type.isLocal) {
                                uri = "@external";
                            }
                            this.componentResult.dependances.push({
                                fullName: type.class.fullName,
                                uri: uri,
                                isStrong: false,
                            })
                        }
                    }

                    if (!fileByTag.hasOwnProperty(interestPoint.name)) {
                        let temp = this.build.getWebComponentDefinitionFile(interestPoint.name);
                        if (temp instanceof AventusWebComponentLogicalFile) {
                            fileByTag[interestPoint.name] = temp;
                        }
                        else {
                            fileByTag[interestPoint.name] = null;
                        }
                    }
                    let file = fileByTag[interestPoint.name]
                    if (file) {
                        this.logicalFile.addViewClassInfoDep(file, interestPoint.start, interestPoint.end);
                    }
                }
            }
        }
    }

    //#endregion

    //#region prepare file
    private writeFile() {
        this.writeFileName();
        this.writeFileTemplateHtml();
        this.writeFileReplaceVar("style", this.scssTxt);
        this.writeFileConstructor();
        this.writeFileFields();
        this.writeFileMethods();
        this.template = this.template.replace(/\|\!\*(.*?)\*\!\|/g, "{{$1}}");
        this.template = this.removeWhiteSpaceLines(this.template);
    }

    private writeFileName() {
        this.writeFileReplaceVar("classname", this.className)
        this.writeFileReplaceVar("parentClass", this.parentClassName);
        if (this.classInfo?.isAbstract) {
            this.writeFileReplaceVar("definition", "")
        }
        else {
            if (this.build.isCoreBuild) {
                this.writeFileReplaceVar("definition", "if(!window.customElements.get('" + this.tagName + "')){window.customElements.define('" + this.tagName + "', " + this.className + ");WebComponentInstance.registerDefinition(" + this.className + ");}")
            }
            else {
                this.writeFileReplaceVar("definition", "if(!window.customElements.get('" + this.tagName + "')){window.customElements.define('" + this.tagName + "', " + this.className + ");Aventus.WebComponentInstance.registerDefinition(" + this.className + ");}")
            }
        }
    }
    private writeFileTemplateHtml() {
        let htmlTxt = "";
        if (this.htmlParsed) {
            let slots = this.htmlParsed.getSlotsInfoTxt(this.className);
            let blocks = this.htmlParsed.getBlocksInfoTxt(this.className);
            if (slots.length + blocks.length > 0) {
                let superTxt = EOL + "super.__getHtml();";
                let slotsTxt = "";
                let blockTxt = "";
                if (slots.length > 0) {
                    slotsTxt = `slots: { ${slots} },`;
                }
                if (blocks.length > 0) {
                    blockTxt = `blocks: { ${blocks} }`;
                }


                if (this.overrideViewDecorator) {
                    superTxt = "";
                }
                htmlTxt = `__getHtml() {${superTxt}
    this.__getStatic().__template.setHTML({
        ${slotsTxt} 
        ${blockTxt}
    });
}`
            }
        }
        this.writeFileReplaceVar("slotBlock", htmlTxt);
    }
    private writeFileConstructor() {
        if (this.classInfo) {
            let constructorBodyTxt = "";
            let constructorBody = this.classInfo.constructorBody;
            if (constructorBody.length > 0) {
                constructorBodyTxt = `constructor() ` + constructorBody
            }

            if (this.classInfo.isAbstract) {
                if (constructorBodyTxt.length > 0) {
                    constructorBodyTxt = constructorBodyTxt.slice(0, constructorBodyTxt.length - 1);
                    constructorBodyTxt += EOL + 'if (this.constructor == ' + this.className + ') { throw "can\'t instanciate an abstract class"; }';
                    constructorBodyTxt += ' }'
                }
                else {
                    constructorBodyTxt = 'constructor() { super(); if (this.constructor == ' + this.className + ') { throw "can\'t instanciate an abstract class"; } }';
                }
            }
            this.writeFileReplaceVar("constructor", constructorBodyTxt);

        }
    }

    //#region field
    private viewsElements: { [name: string]: CustomFieldModel } = {};
    private writeFileFields() {
        let simpleVariables: CustomFieldModel[] = [];
        let attributes: CustomFieldModel[] = [];
        let properties: { field: CustomFieldModel, fctTxt: string | null }[] = [];
        let watches: { field: CustomFieldModel, fctTxt: string | null }[] = [];
        let viewsElements: { [name: string]: CustomFieldModel } = {};

        for (let fieldName in this.allFields) {
            let field = this.allFields[fieldName];
            if (field.inParent && this.overrideViewDecorator === null) {
                continue;
            }
            if (field.propType == "Attribute") {
                attributes.push(field);
                continue;
            }
            else if (field.propType == "Property") {
                for (let decorator of field.decorators) {
                    let tempProp = PropertyDecorator.is(decorator);
                    if (tempProp) {
                        properties.push({
                            field: field,
                            fctTxt: tempProp.fctTxt
                        })
                    }
                }
                continue;
            }
            else if (field.propType == "Watch") {
                for (let decorator of field.decorators) {
                    let tempProp = WatchDecorator.is(decorator);
                    if (tempProp) {
                        watches.push({
                            field: field,
                            fctTxt: tempProp.fctTxt
                        })
                    }
                }
            }
            else if (field.propType == "ViewElement") {
                viewsElements[field.name] = field;
            }
            else if (field.propType == "Simple") {
                simpleVariables.push(field);
            }
        }
        this.viewsElements = viewsElements;
        this.writeFileFieldsSimpleVariable(simpleVariables);
        this.writeFileFieldsAttribute(attributes);
        this.writeFileFieldsProperty(properties);
        this.writeFileFieldsWatch(watches);


        if (this.htmlParsedResult) {
            this.writeViewInfo(this.htmlParsedResult, true);
            for (let name in viewsElements) {
                this.createUnusedViewElement(viewsElements[name]);
            }
        }
        this.writeViewGlobalVariables();
    }

    private writeFileFieldsSimpleVariable(fields: CustomFieldModel[]) {
        if (!this.htmlParsedResult) {
            return;
        }
        let variablesSimpleTxt = "";

        let fullTxt = "";
        if (this.classInfo) {
            for (let fieldName in this.classInfo.propertiesStatic) {
                let field = this.classInfo.propertiesStatic[fieldName];
                fullTxt += AventusTsLanguageService.removeDecoratorFromContent(field.content, field.decorators) + EOL;
            }
        }
        for (let field of fields) {
            fullTxt += AventusTsLanguageService.removeDecoratorFromContent(field.content, field.decorators) + EOL;
        }
        let fullClassFields = `class MyCompilationClassAventus {${fullTxt}}`;
        let fieldsCompiled = transpile(fullClassFields, AventusTsLanguageService.getCompilerOptionsCompile());
        let matchContent = /\{((\s|\S)*)\}/gm.exec(fieldsCompiled);
        if (matchContent) {
            variablesSimpleTxt = matchContent[1].trim();
        }
        this.writeFileReplaceVar('variables', variablesSimpleTxt);
    }
    private writeFileFieldsAttribute(fields: CustomFieldModel[]) {
        let defaultValue = "";
        let getterSetter = "";
        var _createDefaultValue = (field: CustomFieldModel, type: TypeInfo) => {
            let key = field.name;
            if (type.kind == "boolean") {
                if (field.defaultValue !== null && field.defaultValue !== "false") {
                    defaultValue += "if(!this.hasAttribute('" + key + "')) {this.setAttribute('" + key + "' ,'true'); }" + EOL;
                }
                else {
                    //If default set to false, we refresh the attribute to set it to false and not undefined
                    defaultValue += "if(!this.hasAttribute('" + key + "')) { this.attributeChangedCallback('" + key + "', false, false); }" + EOL;
                }
            }
            else if (type.kind == "type" && (type.value == "Date" || type.value == "DateTime")) {
                if (field.defaultValue !== null) {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = " + field.defaultValue + "; }" + EOL;
                }
                else {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = undefined; }" + EOL;
                }
            }
            else {
                if (field.defaultValue !== null) {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = " + field.defaultValue + "; }" + EOL;
                }
                else {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = undefined; }" + EOL;
                }
            }
        }
        var _createGetterSetter = (field: CustomFieldModel, type: TypeInfo) => {
            let key = field.name;
            if (type.kind == "string" || type.kind == "literal" || type.kind == "union") {
                getterSetter += `get '${key}'() {
                    return this.getAttribute('${key}');
                }
                set '${key}'(val) {
                    if(val === undefined || val === null){this.removeAttribute('${key}')}
                    else{this.setAttribute('${key}',val)}
                }${EOL}`;
            }
            else if (type.kind == "number") {
                getterSetter += `get '${key}'() {
                    return Number(this.getAttribute('${key}'));
                }
                set '${key}'(val) {
                    if(val === undefined || val === null){this.removeAttribute('${key}')}
                    else{this.setAttribute('${key}',val)}
                }${EOL}`;
            }
            else if (type.kind == "boolean") {
                this.listBoolProperties.push('"' + key + '"');
                getterSetter += `get '${key}'() {
                return this.hasAttribute('${key}');
            }
            set '${key}'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('${key}', 'true');
                } else{
                    this.removeAttribute('${key}');
                }
            }${EOL}`;
            }
            else if (type.kind === "type" && type.value == "Date") {
                getterSetter += `
                get '${key}'() {
                    if(!this.hasAttribute('${key}')) {
                        return undefined;
                    }
                    return this.stringToDate(this.getAttribute('${key}'));
                }
                set '${key}'(val) {
                    let valTxt = this.dateToString(val);
                    if(valTxt === null){this.removeAttribute('${key}')}
                    else { this.setAttribute('${key}', valTxt); }
                }
                `;
            }
            else if (type.kind === "type" && type.value == "DateTime") {
                getterSetter += `
                get '${key}'() {
                    if(!this.hasAttribute('${key}')) {
                        return undefined;
                    }
                    return this.stringToDateTime(this.getAttribute('${key}'));
                }
                set '${key}'(val) {
                    let valTxt = this.dateTimeToString(val);
                    if(valTxt === null){ this.removeAttribute('${key}') }
                    else { this.setAttribute('${key}', valTxt); }
                }
                `;
            }
        }

        for (let field of fields) {
            let type = this.validateTypeForProp(this.document, field);
            if (!type) {
                continue;
            }
            _createDefaultValue(field, type);
            _createGetterSetter(field, type);
            this.createHtmlDoc(field, type);
        }

        if (defaultValue.length > 0) {
            this.defaultValueTxt += defaultValue
        }
        this.writeFileReplaceVar("getterSetterAttr", getterSetter);
    }

    private writeFileFieldsProperty(properties: { field: CustomFieldModel, fctTxt: string | null }[]) {
        let defaultValue = "";
        let getterSetter = "";
        let upgradeAttributes = "";
        let onChange = "";
        let variablesWatched: string[] = [];
        var _createDefaultValue = (field: CustomFieldModel, type: TypeInfo) => {
            let key = field.name;
            if (type.kind == "boolean") {
                if (field.defaultValue !== null && field.defaultValue !== "false") {
                    defaultValue += "if(!this.hasAttribute('" + key + "')) {this.setAttribute('" + key + "' ,'true'); }" + EOL;
                }
                else {
                    //If default set to false, we refresh the attribute to set it to false and not undefined
                    defaultValue += "if(!this.hasAttribute('" + key + "')) { this.attributeChangedCallback('" + key + "', false, false); }" + EOL;
                }
            }
            else if (type.kind == "type" && (type.value == "Date" || type.value == "DateTime")) {
                if (field.defaultValue !== null) {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = " + field.defaultValue + "; }" + EOL;
                }
                else {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = undefined; }" + EOL;
                }
            }
            else {
                if (field.defaultValue !== null) {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = " + field.defaultValue + "; }" + EOL;
                }
                else {
                    defaultValue += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = undefined; }" + EOL;
                }
            }
        }
        var _createGetterSetter = (field: CustomFieldModel, type: TypeInfo) => {
            let key = field.name;
            if (type.kind == "string" || type.kind == "literal" || type.kind == "union") {
                getterSetter += `get '${key}'() {
                    return this.getAttribute('${key}');
                }
                set '${key}'(val) {
                    if(val === undefined || val === null){this.removeAttribute('${key}')}
                    else{this.setAttribute('${key}',val)}
                }${EOL}`;
            }
            else if (type.kind == "number") {
                getterSetter += `get '${key}'() {
                    return Number(this.getAttribute('${key}'));
                }
                set '${key}'(val) {
                    if(val === undefined || val === null){this.removeAttribute('${key}')}
                    else{this.setAttribute('${key}',val)}
                }${EOL}`;
            }
            else if (type.kind == "boolean") {
                this.listBoolProperties.push('"' + key + '"');
                getterSetter += `get '${key}'() {
                return this.hasAttribute('${key}');
            }
            set '${key}'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('${key}', 'true');
                } else{
                    this.removeAttribute('${key}');
                }
            }${EOL}`;
            }
            else if (type.kind === "type" && type.value == "Date") {
                getterSetter += `
                get '${key}'() {
                    if(!this.hasAttribute('${key}')) { return undefined; }
                    return this.stringToDate(this.getAttribute('${key}'));
                }
                set '${key}'(val) {
                    let valTxt = this.dateToString(val);
                    if(valTxt === null){this.removeAttribute('${key}')}
                    else { this.setAttribute('${key}', valTxt) }
                }
                `;
            }
            else if (type.kind === "type" && type.value == "DateTime") {
                getterSetter += `
                get '${key}'() {
                    if(!this.hasAttribute('${key}')) {
                        return undefined;
                    }
                    return this.stringToDateTime(this.getAttribute('${key}'));
                }
                set '${key}'(val) {
                    let valTxt = this.dateTimeToString(val);
                    if(valTxt === null){this.removeAttribute('${key}')}
                    else { this.setAttribute('${key}', valTxt); }
                }
                `;
            }
        }
        for (let property of properties) {
            let field = property.field;
            let type = this.validateTypeForProp(this.document, field)
            if (!type) {
                continue;
            }

            _createDefaultValue(field, type);
            _createGetterSetter(field, type);
            this.createHtmlDoc(field, type);

            upgradeAttributes += 'this.__upgradeProperty(\'' + field.name.toLowerCase() + '\');' + EOL;
            variablesWatched.push(field.name.toLowerCase());

            if (property.fctTxt) {
                let fctTxt = this.transpileMethodNoRun(property.fctTxt);
                onChange += `this.__addPropertyActions("${field.name}", ${fctTxt});` + EOL;
            }
        }

        if (defaultValue.length > 0) {
            this.defaultValueTxt += defaultValue;
        }
        this.writeFileReplaceVar("getterSetterProp", getterSetter);

        if (upgradeAttributes.length > 0) {
            upgradeAttributes = `__upgradeAttributes() { super.__upgradeAttributes(); ${upgradeAttributes} }`
        }
        this.writeFileReplaceVar("upgradeAttributes", upgradeAttributes);

        if (onChange.length > 0) {
            onChange = `__registerPropertiesActions() { super.__registerPropertiesActions(); ${onChange} }`
        }
        this.writeFileReplaceVar("propertiesChangeCb", onChange);

        let variablesWatchedTxt = '';
        if (variablesWatched.length > 0) {
            variablesWatchedTxt = '"' + variablesWatched.join('", "') + '"';
            variablesWatchedTxt = `static get observedAttributes() {return [${variablesWatchedTxt}].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}`
        }
        this.writeFileReplaceVar("watchingAttributes", variablesWatchedTxt);
    }
    private writeFileFieldsWatch(watches: { field: CustomFieldModel, fctTxt: string | null }[]) {
        let getterSetter = "";
        let variableProxyTxt = "";
        for (let watch of watches) {
            let field = watch.field;

            if (field.defaultValue === null || field.defaultValue == "undefined") {
                this.result.diagnostics.push(createErrorTsPos(this.document, "A watchable prop must be initialized", field.nameStart, field.nameEnd, AventusErrorCode.MissingInit));
            }
            let watchAction = `this.__addWatchesActions("${field.name}");`;
            if (watch.fctTxt) {
                let fctTxt = this.transpileMethodNoRun(watch.fctTxt);
                watchAction = `this.__addWatchesActions("${field.name}", ${fctTxt});`;
            }

            getterSetter += `get '${field.name}'() {
						return this.__watch["${field.name}"];
					}
					set '${field.name}'(val) {
						this.__watch["${field.name}"] = val;
					}`+ EOL;

            variableProxyTxt += `${watchAction}` + EOL;
            this.defaultValueTxt += `if(!this["${field.name}"]){ this["${field.name}"] = ${field.defaultValue?.replace(/\\"/g, '')};}` + EOL;
            this.foundedWatch.push(field.name);
        }

        let debugWatchTxt = '';
        if (this.debuggerDecorator?.enableWatchHistory) {
            debugWatchTxt = `if(this.__watch){
this.__watch.enableHistory();
this.getWatchHistory = () => {
    return this.__watch.getHistory();
}
this.clearWatchHistory = () => {
    return this.__watch.clearHistory();
}
}`
        }
        if (variableProxyTxt.length > 0) {

            variableProxyTxt = `__registerWatchesActions() {
                ${variableProxyTxt}
                super.__registerWatchesActions();
                ${debugWatchTxt}
            }`
        }
        else if (debugWatchTxt.length > 0) {
            variableProxyTxt = `__registerWatchesActions() {
                super.__registerWatchesActions();
                ${debugWatchTxt}
            }`
        }
        this.writeFileReplaceVar("watchesChangeCb", variableProxyTxt);
        this.writeFileReplaceVar("getterSetterWatch", getterSetter);
    }

    //#endregion


    private writeViewGlobalVariables() {
        // default value
        let txt = "";
        if (this.defaultValueTxt.length > 0) {
            txt = `__defaultValues() { super.__defaultValues(); ${this.defaultValueTxt} }`;
        }
        this.writeFileReplaceVar("defaultValue", txt);

        // write boolean list 
        let listBoolTxt = "";
        if (this.listBoolProperties.length > 0) {
            listBoolTxt = `__listBoolProps() { return [${this.listBoolProperties.join(",")}].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }`;
        }
        this.writeFileReplaceVar("listBool", listBoolTxt);
    }



    private variablesInViewDynamic = "";
    private writeViewInfo(template: HtmlTemplateResult, isMain: boolean, localVars: string[] = [], loopInfo?: ActionLoop) {
        const finalViewResult: any = {};
        let finalTxt = "";

        //#region elements
        let elements = template.elements;
        let resultElements: { name: string, ids: string[], isArray?: boolean }[] = []
        for (let element of elements) {
            let fieldName = element.name;
            if (this.allFields[fieldName]) {
                let field = this.allFields[fieldName];
                if (field.propType == "ViewElement") {
                    if (!element.useLive) {
                        for (let decorator of field.decorators) {
                            let viewElTemp = ViewElementDecorator.is(decorator);
                            if (viewElTemp) {
                                element.useLive = viewElTemp.useLive;
                                break;
                            }
                        }
                    }

                    if (element.useLive) {
                        let querySelectorTxt = element.ids.map(id => `[_id="${id}"]`).join("|");
                        if (element.isArray) {
                            this.variablesInViewDynamic += `get ${fieldName} () { var list = Array.from(this.shadowRoot.querySelectorAll('${querySelectorTxt}')); return list; }` + EOL;
                        }
                        else {
                            this.variablesInViewDynamic += `get ${fieldName} () { return this.shadowRoot.querySelector('${querySelectorTxt}'); }` + EOL;
                        }
                    }
                    else {
                        if (element.isArray) {
                            resultElements.push({
                                name: element.name,
                                ids: element.ids,
                                isArray: true
                            })
                        }
                        else {
                            resultElements.push({
                                name: element.name,
                                ids: element.ids,
                            })
                        }
                    }
                }
                else {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "You must add the decorator @ViewElement for " + fieldName, field.nameStart, field.nameEnd, AventusErrorCode.MissingViewElement));
                }
                delete this.viewsElements[fieldName];
            }
            else {
                this.createMissingViewElement(element);
            }


        }
        if (resultElements.length > 0) {
            finalViewResult.elements = resultElements;
        }
        //#endregion

        //#region content
        let contents = template.content;
        let resultContents: { [contextProp: string]: ActionChange[] } = {}
        for (let propName in contents) {
            if (this.allFields[propName]) {
                let field = this.allFields[propName];
                if (field.propType == "Property") {
                    if (!resultContents[propName]) {
                        resultContents[propName] = [];
                    }
                    if (field.type.kind == "boolean") {
                        for (let content of contents[propName]) {
                            resultContents[propName].push({
                                id: content.id,
                                attrName: content.attrName,
                                render: content.render,
                                isBool: true
                            })
                        }
                    }
                    else {
                        for (let content of contents[propName]) {
                            resultContents[propName].push({
                                id: content.id,
                                attrName: content.attrName,
                                render: content.render
                            })
                        }
                    }
                }
                else if (field.propType == "Watch") {
                    if (!resultContents[propName]) {
                        resultContents[propName] = [];
                    }
                    for (let content of contents[propName]) {
                        resultContents[propName].push({
                            id: content.id,
                            attrName: content.attrName,
                            render: content.render,
                            path: content.path
                        })
                    }
                }
                else {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "The variable " + propName + " must be a property or a watch for template update", field.nameStart, field.nameEnd, AventusErrorCode.MissingWatchable));
                }
            }
            else if (localVars.includes(propName)) {
                if (!resultContents[propName]) {
                    resultContents[propName] = [];
                }
                for (let content of contents[propName]) {
                    resultContents[propName].push({
                        id: content.id,
                        attrName: content.attrName,
                        render: content.render,
                        path: content.path
                    })
                }
            }
            else {
                let errorTxt = "Missing property or watch #" + propName + " for template update"
                this.result.diagnostics.push(createErrorTsSection(this.document, errorTxt, "props", AventusErrorCode.MissingProp));
                if (this.htmlFile) {
                    for (let content of contents[propName]) {
                        if (content.positions) {
                            for (let position of content.positions) {
                                this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.document, errorTxt, position.start, position.end));
                            }
                        }
                    }
                }
            }
        }
        if (Object.keys(resultContents).length > 0) {
            finalViewResult.content = resultContents;
        }
        //#endregion

        //#region injection
        let injections = template.injection;
        let resultInjections: { [contextProp: string]: ActionInjection[] } = {}
        for (let propName in injections) {
            if (this.allFields[propName]) {
                let field = this.allFields[propName];
                if (field.propType == "Property" || field.propType == "Watch") {
                    let isWatch = field.propType == "Watch";
                    if (!resultInjections[propName]) {
                        resultInjections[propName] = [];
                    }
                    for (let injection of injections[propName]) {
                        let temp: ActionInjection = {
                            id: injection.id,
                            injectionName: injection.injectionName,
                            inject: injection.inject,
                        }
                        if (isWatch) {
                            temp.path = injection.path;
                        }
                        resultInjections[propName].push(temp)
                    }
                }
                else {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "The variable " + propName + " must be a property or a watch for injection", field.nameStart, field.nameEnd, AventusErrorCode.MissingWatchable));
                }
            }
            else if (localVars.includes(propName)) {
                if (!resultInjections[propName]) {
                    resultInjections[propName] = [];
                }
                for (let injection of injections[propName]) {
                    resultInjections[propName].push({
                        id: injection.id,
                        injectionName: injection.injectionName,
                        inject: injection.inject,
                        path: injection.path
                    })
                }
            }
            else {
                let errorTxt = "Missing property or watch #" + propName + " for injection"
                this.result.diagnostics.push(createErrorTsSection(this.document, errorTxt, "props", AventusErrorCode.MissingProp));
                if (this.htmlFile) {
                    for (let injection of injections[propName]) {
                        if (injection.position) {
                            this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.document, errorTxt, injection.position.start, injection.position.end));
                        }
                    }
                }
            }
        }
        if (Object.keys(resultInjections).length > 0) {
            finalViewResult.injection = resultInjections;
        }
        //#endregion

        //#region bindings
        let bindings = template.bindings;
        let resultBindings: { [contextProp: string]: ActionBindings[] } = {}
        for (let propName in bindings) {
            if (this.allFields[propName]) {
                let field = this.allFields[propName];
                if (field.propType == "Property" || field.propType == "Watch") {
                    if (!resultBindings[propName]) {
                        resultBindings[propName] = [];
                    }
                    let isWatch = field.propType == "Watch";
                    for (let binding of bindings[propName]) {
                        let temp: ActionBindings = {
                            id: binding.id,
                            valueName: binding.valueName,
                            eventNames: binding.eventNames,
                        }
                        if (isWatch) {
                            temp.path = binding.path;
                        }
                        if (binding.eventNames.length == 1 && binding.tagName) {
                            let definition = this.build.getWebComponentDefinition(binding.tagName);
                            let eventName = binding.eventNames[0];
                            if (definition) {
                                if (definition.class.properties[eventName]) {
                                    let type = definition.class.properties[eventName].type.value;
                                    if (ListCallbacks.includes(type)) {
                                        temp.isCallback = true;
                                    }
                                }
                            }
                        }
                        resultBindings[propName].push(temp);
                    }
                }
                else {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "The variable " + propName + " must be a property or a watch for bindings", field.nameStart, field.nameEnd, AventusErrorCode.MissingWatchable));
                }
            }
            else if (localVars.includes(propName)) {
                for (let binding of bindings[propName]) {
                    let temp: ActionBindings = {
                        id: binding.id,
                        valueName: binding.valueName,
                        eventNames: binding.eventNames,
                        path: binding.path
                    }
                    if (binding.eventNames.length == 1 && binding.tagName) {
                        let definition = this.build.getWebComponentDefinition(binding.tagName);
                        let eventName = binding.eventNames[0];
                        if (definition) {
                            if (definition.class.properties[eventName]) {
                                let type = definition.class.properties[eventName].type.value
                                if (ListCallbacks.includes(type)) {
                                    temp.isCallback = true;
                                }
                            }
                        }
                    }
                    resultBindings[propName].push(temp);
                }
            }
            else {
                let errorTxt = "Missing property or watch #" + propName + " for bindings";
                this.result.diagnostics.push(createErrorTsSection(this.document, errorTxt, "props", AventusErrorCode.MissingProp));
                if (this.htmlFile) {
                    for (let binding of bindings[propName]) {
                        if (binding.position) {
                            this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.document, errorTxt, binding.position.start, binding.position.end));
                        }
                    }
                }
            }
        }
        if (Object.keys(resultBindings).length > 0) {
            finalViewResult.bindings = resultBindings;
        }
        //#endregion

        //#region events
        let resultEvents: ActionEvent[] = [];
        for (let event of template.events) {
            if (this.methodsName.includes(event.fct)) {
                let temp: ActionEvent = {
                    eventName: event.eventName,
                    id: event.id,
                    fct: `@_@(e, c) => c.component.${event.fct}(e)@_@`,
                }
                if (event.tagName) {
                    let definition = this.build.getWebComponentDefinition(event.tagName);
                    let eventName = event.eventName;
                    if (definition) {
                        if (definition.class.properties[eventName]) {
                            let type = definition.class.properties[eventName].type.value
                            if (ListCallbacks.includes(type)) {
                                temp.isCallback = true;
                                temp.fct = `@_@(c, ...args) => c.component.${event.fct}.apply(c.component, args)@_@`;
                            }
                        }
                    }
                }
                resultEvents.push(temp);
            }
            else if (event.position) {
                this.createMissingMethod(event.fct, event.position.start, event.position.end);
            }
        }
        if (resultEvents.length > 0) {
            finalViewResult.events = resultEvents;
        }
        //#endregion

        //#region pressEvents
        let resultPressEvents: ActionPressEvent[] = [];
        let fcts = [
            pressEventMap['@dblpress'],
            pressEventMap['@drag'],
            pressEventMap['@drag-end'],
            pressEventMap['@drag-start'],
            pressEventMap['@longpress'],
            pressEventMap['@press'],
            pressEventMap['@press-start'],
            pressEventMap['@press-stop'],
        ];
        let props = [
            pressEventMap['@dblpress-delay'],
            pressEventMap['@longpress-delay'],
        ]
        for (let pressEvent of template.pressEvents) {
            let tempPressEvent: ActionPressEvent = {
                id: pressEvent.id
            };
            for (let key in pressEvent) {
                let currentEvent = pressEvent[key];
                if (currentEvent instanceof Object) {
                    if (fcts.includes(key)) {
                        if (!this.methodsName.includes(currentEvent.value)) {
                            this.createMissingMethod(currentEvent.value, currentEvent.start, currentEvent.end);
                        }
                        else {
                            tempPressEvent[key] = `@_@(e, pressInstance, c) => { c.component.${currentEvent.value}(e, pressInstance); }@_@`;
                        }
                    }
                    else if (props.includes(key)) {
                        tempPressEvent[key] = `@_@${currentEvent.value}@_@`
                    }
                }

            }
            resultPressEvents.push(tempPressEvent)
        }
        if (resultPressEvents.length > 0) {
            finalViewResult.pressEvents = resultPressEvents;
        }
        //#endregion

        if (Object.keys(finalViewResult).length > 0) {
            let finalViewResultTxt = JSON.stringify(finalViewResult, null, 2).replace(/"@_@(.*?)@_@"/g, "$1").replace(/\\"/g, '"')
            if (isMain) {
                finalTxt = `this.__getStatic().__template.setActions(${finalViewResultTxt});` + EOL;
                let globalVars = this.htmlParsed?.getVariables()?.globalVars;
                if (globalVars && globalVars.length > 0) {
                    finalTxt += `this.__getStatic().__template.setSchema({globals:${JSON.stringify(globalVars)}});` + EOL;
                }
            }
            else if (loopInfo) {
                finalTxt = `const templ${loopInfo.loopId} = new Aventus.WebComponentTemplate(this);` + EOL;
                finalTxt += `templ${loopInfo.loopId}.setTemplate(\`${loopInfo.template}\`);` + EOL;
                finalTxt += `templ${loopInfo.loopId}.setActions(${finalViewResultTxt});` + EOL;
                if (!loopInfo.loopParentId) {
                    finalTxt += `this.__getStatic().__template.addLoop({
                        anchorId: '${loopInfo.anchorId}',
                        data: '${loopInfo.from}',
                        index: '${loopInfo.index}',
                        item: '${loopInfo.item}',
                        template: templ${loopInfo.loopId}
                    });`+ EOL;
                }
                else {
                    finalTxt += `templ${loopInfo.loopParentId}.addLoop({
                        anchorId: '${loopInfo.anchorId}',
                        data: '${loopInfo.from}',
                        index: '${loopInfo.index}',
                        item: '${loopInfo.item}',
                        template: templ${loopInfo.loopId}
                    });`+ EOL;
                }
            }
        }
        else if (isMain) {
            let globalVars = this.htmlParsed?.getVariables()?.globalVars;
            if (globalVars && globalVars.length > 0) {
                finalTxt += `this.__getStatic().__template.setSchema({globals:${JSON.stringify(globalVars)}});` + EOL;
            }
        }

        for (let loop of template.loops) {
            let newLocal = [...localVars];
            newLocal.push(loop.item);
            newLocal.push(loop.index);
            let fromName = loop.from.split(".")[0]
            if (!localVars.includes(fromName)) {
                let field = this.allFields[fromName];
                if (!field) {
                    let errorTxt = "Missing watch #" + fromName + " for loop";
                    this.result.diagnostics.push(createErrorTsSection(this.document, errorTxt, "props", AventusErrorCode.MissingProp));
                    if (this.htmlFile) {
                        if (loop.positionFrom) {
                            this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.document, errorTxt, loop.positionFrom.start, loop.positionFrom.end));
                        }
                    }
                }
                else if (field.propType != "Watch") {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "The variable " + fromName + " must be a watch for loop", field.nameStart, field.nameEnd, AventusErrorCode.MissingWatchable));
                }
            }
            finalTxt += this.writeViewInfo(loop.actions, false, newLocal, loop);
        }

        if (isMain) {
            if (finalTxt.length > 0) {
                finalTxt = `__registerTemplateAction() { super.__registerTemplateAction();${EOL}${finalTxt} }`;
            }
            this.writeFileReplaceVar("templateAction", finalTxt);
            this.writeFileReplaceVar("variablesInViewDynamic", this.variablesInViewDynamic);
        }
        else if (finalTxt.length > 0) {
            finalTxt += EOL;
        }

        return finalTxt;
    }

    //#region utils
    private createHtmlDoc(field: CustomFieldModel, type: TypeInfo) {
        if (this.htmlDoc) {
            let definedValues: {
                name: string;
                description: string;
            }[] = [];
            let realType: CustomTypeAttribute = "string";
            if (type.kind == "literal") {
                let value = type.value;
                if (value.startsWith("'") || value.startsWith('"')) {
                    value = value.substring(1);
                }
                if (value.endsWith("'") || value.endsWith('"')) {
                    value = value.substring(0, value.length - 1);
                }
                definedValues.push({
                    name: value,
                    description: ""
                });

            }
            else if (type.kind == "union") {
                for (let nested of type.nested) {
                    let value = nested.value;
                    if (value.startsWith("'") || value.startsWith('"')) {
                        value = value.substring(1);
                    }
                    if (value.endsWith("'") || value.endsWith('"')) {
                        value = value.substring(0, value.length - 1);
                    }
                    definedValues.push({
                        name: value,
                        description: ""
                    });
                }
            }
            else if (type.kind == "boolean") {
                realType = "boolean";
            }
            else if (type.kind == "number") {
                realType = "number";
            }
            else if (type.kind == "type" && type.value == "Date") {
                realType = "Date";
            }
            else if (type.kind == "type" && type.value == "DateTime") {
                realType = "DateTime";
            }
            this.htmlDoc[this.tagName].attributes[field.name] = {
                name: field.name,
                description: field.documentation.join(EOL),
                type: realType,
                values: definedValues
            }
        }
    }
    private writeFileReplaceVar(variable: string, value: string | number) {
        let regex = new RegExp("\\$" + variable + "\\$", "g");
        this.template = this.template.replace(regex, value + "");
    }
    private createMissingMethod(methodName: string, start: number, end: number) {
        if (!this.htmlParsed) {
            return
        }
        if (this.result.missingMethods.position == -1) {
            let startPos = getSectionStart(this.file, "methods");
            this.result.missingMethods.position = startPos;
        }
        let errorTxt = "missing method " + methodName;
        if (this.result.missingMethods.position != -1) {
            if (!this.result.missingMethods.elements.includes(methodName)) {
                this.result.missingMethods.elements.push(methodName);
                this.result.diagnostics.push(createErrorTsSection(this.document, errorTxt, "methods", AventusErrorCode.MissingMethod))
            }
        }
        else {
            this.result.diagnostics.push(createErrorTsSection(this.document, errorTxt, "methods", AventusErrorCode.MissingMethod))
        }
        if (this.htmlFile) {
            this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.document, errorTxt, start, end));
        }
    }
    private createMissingViewElement(element: ActionElement) {
        let typesToWrite: string[] = []
        for (let tag in element.tags) {
            let type = this.build.htmlLanguageService.getClassByTag(tag);
            let finalType = "";
            if (type) {
                finalType = type;
            }
            else {
                let type = this.build.htmlLanguageService.getGenericHTML(tag);
                if (type) {
                    finalType = type;
                }
                else {
                    finalType = "HTMLElement";
                }
            }
            if (element.tags[tag] > 1) {
                finalType += '[]'
            }
            typesToWrite.push(finalType);
        }

        let finalTypeTxt = "";
        if (typesToWrite.length == 1) {
            finalTypeTxt = typesToWrite[0];
        }
        else if (typesToWrite.length > 1) {
            for (let i = 0; i < typesToWrite.length; i++) {
                typesToWrite[i] = typesToWrite[i].replace("[]", "");
            }
            finalTypeTxt = "(" + typesToWrite.join(" | ") + ")[]";
        }
        let errorTxt = "Missing variable view element" + element.name;
        this.result.missingViewElements.elements[element.name] = finalTypeTxt;
        this.result.diagnostics.push(createErrorTsSection(this.document, errorTxt, "variables", AventusErrorCode.MissingViewElement));

        if (this.htmlFile) {
            for (let position of element.positions) {
                this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.document, errorTxt, position.start, position.end));
            }
        }
    }
    private createUnusedViewElement(field: CustomFieldModel) {
        let name = field.name;
        if (this.overrideViewDecorator) {
            if (this.overrideViewDecorator.removeViewVariables.indexOf(name) == -1) {
                this.result.diagnostics.push(
                    createErrorTsPos(
                        this.document,
                        "Can't find the variable " + name + " inside the view",
                        field.nameStart,
                        field.nameEnd, AventusErrorCode.viewElementNotFound,
                        { start: field.fullStart, end: field.fullEnd }
                    )
                );
            }
        }
        else {
            this.result.diagnostics.push(createErrorTsPos(
                this.document,
                "Can't find the variable " + name + " inside the view",
                field.nameStart,
                field.nameEnd, AventusErrorCode.viewElementNotFound,
                { start: field.fullStart, end: field.fullEnd }
            ));
        }
    }
    //#endregion

    //#endregion

    private writeFileMethods() {
        let tempStateList: {
            [statePattern: string]: {
                [managerName: string]: {
                    active: string[],
                    inactive: string[],
                    askChange: string[],
                };
            };
        } = {}

        let methodsTxt = "";
        let defaultStateTxt = "";
        if (this.classInfo) {
            let fullTxt = ""
            for (let methodName in this.classInfo.methods) {
                let method = this.classInfo.methods[methodName];
                fullTxt += AventusTsLanguageService.removeDecoratorFromContent(method.content, method.decorators) + EOL;
                for (let decorator of method.decorators) {
                    let basicState: StateChangeDecorator | StateActiveDecorator | StateInactiveDecorator | null = null;
                    let tempChange = StateChangeDecorator.is(decorator);
                    if (tempChange) {
                        basicState = tempChange;
                    }
                    else {
                        let tempActive = StateActiveDecorator.is(decorator);
                        if (tempActive) {
                            basicState = tempActive;
                        }
                        else {
                            let tempInactive = StateInactiveDecorator.is(decorator);
                            if (tempInactive) {
                                basicState = tempInactive;
                            }
                        }
                    }
                    let defActive: DefaultStateActiveDecorator | null;
                    let defInactive: DefaultStateInactiveDecorator | null;

                    if (basicState !== null) {
                        if (decorator.arguments.length > 0) {
                            if (!tempStateList[basicState.stateName]) {
                                tempStateList[basicState.stateName] = {};
                            }
                            if (!tempStateList[basicState.stateName][basicState.managerName]) {
                                tempStateList[basicState.stateName][basicState.managerName] = {
                                    active: [],
                                    inactive: [],
                                    askChange: []
                                }
                            }
                            tempStateList[basicState.stateName][basicState.managerName][basicState.functionName].push(method.name);
                        }
                    }
                    else if ((defActive = DefaultStateActiveDecorator.is(decorator))) {
                        defaultStateTxt += `this.__addActiveDefState(${defActive.managerName}, this.${method.name});` + EOL;
                    }
                    else if ((defInactive = DefaultStateInactiveDecorator.is(decorator))) {
                        defaultStateTxt += `this.__addInactiveDefState(${defInactive.managerName}, this.${method.name});` + EOL;
                    }
                }
            }
            let fullClassFct = `class MyCompilationClassAventus {${fullTxt}}`;
            let fctCompiled = transpile(fullClassFct, AventusTsLanguageService.getCompilerOptionsCompile());
            let matchContent = /\{((\s|\S)*)\}/gm.exec(fctCompiled);
            if (matchContent) {
                methodsTxt = matchContent[1].trim();
            }
        }
        this.writeFileReplaceVar("methods", methodsTxt);

        let statesTxt = "";
        for (let statePattern in tempStateList) {
            for (let managerName in tempStateList[statePattern]) {
                let currentAction = tempStateList[statePattern][managerName];
                statesTxt += `this.__createStatesList(${statePattern}, ${managerName});`;
                if (currentAction.active.length > 0) {
                    let fctTxt = "";
                    for (let fctName of currentAction.active) {
                        fctTxt += "that." + fctName + "(state, slugs);"
                    }
                    statesTxt += `this.__addActiveState(${statePattern}, ${managerName}, (state, slugs) => { that.__inactiveDefaultState(${managerName}); ${fctTxt}})` + EOL;
                }
                if (currentAction.inactive.length > 0) {
                    let fctTxt = "";
                    for (let fctName of currentAction.inactive) {
                        fctTxt += "that." + fctName + "(state, nextState, slugs);"
                    }
                    statesTxt += `this.__addInactiveState(${statePattern}, ${managerName}, (state, nextState, slugs) => { ${fctTxt}that.__activeDefaultState(nextState, ${managerName});})` + EOL;
                }
                if (currentAction.askChange.length > 0) {
                    let fctTxt = "";
                    for (let fctName of currentAction.askChange) {
                        fctTxt += "if(!await that." + fctName + "(state, nextState, slugs)){return false;}" + EOL;
                    }
                    statesTxt += `this.__addAskChangeState(${statePattern}, ${managerName}, async (state, nextState, slugs) => { ${fctTxt} return true;})` + EOL;
                }
            }
        }
        if (statesTxt.length > 0 || defaultStateTxt.length > 0) {
            statesTxt = `__createStates() { super.__createStates(); let that = this; ${defaultStateTxt} ${statesTxt} }`
        }
        this.writeFileReplaceVar("states", statesTxt)
    }

    //#endregion

    //#region prepare doc


    private prepareDocSCSS() {
        let customCssProperties: SCSSDoc = {
            [this.tagName]: AventusSCSSLanguageService.getCustomProperty(this.scssTxt)
        }
        return customCssProperties;
    }
    //#endregion

    //#region tools
    private prepareMethodToTranspile(methodTxt: string): string {
        methodTxt = methodTxt.trim();
        if (methodTxt.startsWith("function")) {
            methodTxt = methodTxt.replace("function", "");
            methodTxt = methodTxt.trim();
        }
        if (!methodTxt.match(/^\(.*?\)( *?)=>/g) && !methodTxt.match(/^\S*?( *?)=>/g)) {
            methodTxt = methodTxt.replace(/^.*?\(/g, "(");
            let match = methodTxt.match(/^\(.*?\)/g);
            if (match) {
                methodTxt = methodTxt.replace(match[0], match[0] + " => ");
            }
        }
        return methodTxt;
    }
    private transpileMethod(methodTxt, paramsName: any[] = []) {
        methodTxt = this.prepareMethodToTranspile(methodTxt);
        let method = transpile(methodTxt, AventusTsLanguageService.getCompilerOptionsCompile()).trim();
        method = method.substring(0, method.length - 1);
        method = "(" + method + ")(" + paramsName.join(",") + ")";
        // method = minify(method, { mangle: false }).code;
        return method;
    }
    private transpileMethodNoRun(methodTxt) {
        methodTxt = this.prepareMethodToTranspile(methodTxt);
        let method = transpile(methodTxt, AventusTsLanguageService.getCompilerOptionsCompile()).trim();
        method = method.substring(0, method.length - 1);
        method = "(" + method + ")";
        // method = minify(method, { mangle: false }).code;
        return method;
    }

    private _validateTypeForProp(currentDoc: TextDocument, field: PropertyInfo, type: TypeInfo): TypeInfo | null {
        if (type.kind == "boolean" || type.kind == "number" || type.kind == "string") {
            return type;
        }
        else if (type.kind == "type") {
            if (type.value == "Date" || type.value == "DateTime") {
                return type;
            }
            else {
                let info = ParserTs.getBaseInfo(type.value);
                if (info && info instanceof AliasInfo) {
                    return this._validateTypeForProp(currentDoc, field, info.type);
                }

            }
        }
        else if (type.kind == "literal") {
            return type;
        }
        else if (type.kind == "union") {
            let allLiteral = true;
            for (let nested of type.nested) {
                if (nested.kind != 'literal') {
                    allLiteral = false;
                    this.result.diagnostics.push(createErrorTsPos(currentDoc, "You can only use literal inside an union type", field.nameStart, field.nameEnd, AventusErrorCode.WrongTypeDefinition));
                }
            }
            if (allLiteral) {
                return type;
            }
        }
        this.result.diagnostics.push(createErrorTsPos(currentDoc, "can't use the the type " + type.kind + "(" + type.value + ")" + " as attribute / property", field.nameStart, field.nameEnd, AventusErrorCode.WrongTypeDefinition));
        return null;
    }
    private validateTypeForProp(currentDoc: TextDocument, field: PropertyInfo): TypeInfo | null {
        if (field.name.toLowerCase() != field.name) {
            this.result.diagnostics.push(createErrorTsPos(this.document, "an attribute must be in lower case", field.nameStart, field.nameEnd, AventusErrorCode.AttributeLower));
        }
        let type = this._validateTypeForProp(currentDoc, field, field.type);
        return type;
    }
    private removeWhiteSpaceLines(txt: string) {
        return txt.replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, '');
    }
    //#endregion
}

