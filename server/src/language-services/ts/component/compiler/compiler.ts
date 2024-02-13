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
import { AventusTsLanguageService, CompileDependance, CompileTsResult, getSectionStart } from "../../LanguageService";
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
import { TypeInfo, TypeInfoKind } from '../../parser/TypeInfo';
import { PropertyDecorator } from '../../parser/decorators/PropertyDecorator';
import { ViewElementDecorator } from '../../parser/decorators/ViewElementDecorator';
import { StateChangeDecorator } from '../../parser/decorators/StateChangeDecorator';
import { StateActiveDecorator } from '../../parser/decorators/StateActiveDecorator';
import { StateInactiveDecorator } from '../../parser/decorators/StateInactiveDecorator';
import { RequiredDecorator } from '../../parser/decorators/RequiredDecorator';
import { AliasInfo } from '../../parser/AliasInfo';
import { WatchDecorator } from '../../parser/decorators/WatchDecorator';
import { ParserHtml } from '../../../html/parser/ParserHtml';
import { ActionBindings, ActionElement, ActionEvent, ActionIf, ActionIfPart, ActionInjection, ActionLoop, ActionPressEvent, HtmlTemplateResult, pressEventMap } from '../../../html/parser/definition';
import { DefaultStateActiveDecorator } from '../../parser/decorators/DefaultStateActiveDecorator';
import { DefaultStateInactiveDecorator } from '../../parser/decorators/DefaultStateInactiveDecorator';
import { BindThisDecorator } from '../../parser/decorators/BindThisDecorator';
import { EffectDecorator, EffectDecoratorOption } from '../../parser/decorators/EffectDecorator';
import { HttpServer } from '../../../../live-server/HttpServer';


export class AventusWebcomponentCompiler {
    public static getVersion(logicalFile: AventusWebComponentLogicalFile, build: Build) {
        let version = {
            ts: logicalFile.file.documentUser.version,
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
    private templateHotReload: string;
    private document: TextDocument;
    private build: Build;
    private fileParsed: ParserTs | null;
    private classInfo: ClassInfo | undefined;
    private className: string = "";
    private fullName: string = "";
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
    private defaultValueHotReloadTxt: string = "";
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
        hotReload: "",
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
        tagName: '',
    }
    private parentClassName: string = "";
    private overrideViewDecorator: OverrideViewDecorator | null = null;
    private debuggerDecorator: DebuggerDecorator | null = null;
    private extraConstructorCode: string[] = [];

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
        if (this.htmlFile) {
            this.htmlParsed = this.htmlFile.fileParsed;
            this.htmlFile.tsErrors = [];
        }
        let nativeDiags = build.tsLanguageService.doValidation(this.file);
        let methodName = this.logicalFile.viewMethodName;
        for (let i = 0; i < nativeDiags.length; i++) {
            if (nativeDiags[i].message.startsWith("'" + methodName)) {
                nativeDiags.splice(i, 1);
                i--;
            }
        }
        this.result.diagnostics = nativeDiags;
        this.template = AventusWebcomponentTemplate();
        this.templateHotReload = AventusWebcomponentTemplate();
        this.document = logicalFile.file.documentInternal;
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
            this.logicalFile.build.addNamespace(this.classInfo.namespace);
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

            this.componentResult.tagName = this.tagName;
            this.componentResult.compiled = this.template.replace("//todelete for hmr °", "");
            if (HttpServer.isRunning) {
                this.componentResult.hotReload = this.templateHotReload.split("//todelete for hmr °")[0];
                this.componentResult.hotReload = this.componentResult.hotReload.slice(this.componentResult.hotReload.indexOf("=") + 1);
            }
            if (this.debuggerDecorator && this.debuggerDecorator.writeCompiled) {
                this.componentResult.debugTxt = this.componentResult.compiled;
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
                    this.result.diagnostics.push(createErrorTsPos(this.document, "tag name must be in lower case and have a - inside", decorator.contentStart, decorator.contentEnd, AventusErrorCode.TagLower));
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
        let splittedName = classInfo.name.match(/([A-Z][a-z]*)|([0-9]+[a-z]*)/g);
        if (splittedName) {
            let componentPrefixes = this.build.getComponentPrefix().split("-");
            for (let i = 0; i < componentPrefixes.length; i++) {
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
            this.fullName = classInfo.fullName;
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
            let parent = classInfo.parentClass;
            if (parent) {
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
            let cloneProp = new CustomFieldModel(property.prop, property.isInsideInterface, classInfo);
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
                result[propName] = cloneProp;
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
                        let dependance = this.build.getWebComponentTagDependance(interestPoint.name);
                        if (dependance) {
                            for (let dep of this.componentResult.dependances) {
                                if (dep.fullName == dependance.fullName) {
                                    return;
                                }
                            }

                            this.componentResult.dependances.push(dependance)
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
        this.writeFileFields();
        this.writeFileMethods();
        this.writeWatchableElements();
        this.writeFileConstructor();
        this.template = this.template.replace(/\|\!\*(.*?)\*\!\|/g, "{{$1}}");
        this.template = this.removeWhiteSpaceLines(this.template);

        this.templateHotReload = this.templateHotReload.replace(/\|\!\*(.*?)\*\!\|/g, "{{$1}}");
        this.templateHotReload = this.removeWhiteSpaceLines(this.templateHotReload);
    }

    private writeFileName() {
        this.writeFileReplaceVar("classname", this.className)
        this.writeFileReplaceVar("parentClass", this.parentClassName);
        if (this.fullName.includes(".")) {
            this.writeFileReplaceVar("fullname", this.fullName);
            let currentNamespaceWithDot = "." + this.classInfo?.namespace;
            this.writeFileReplaceVar("namespace", this.fullName + ".Namespace=`${moduleName}" + currentNamespaceWithDot + "`;");
        }
        else {
            this.writeFileReplaceVar("fullname", "const " + this.fullName);
            this.writeFileReplaceVar("namespace", this.fullName + ".Namespace=`${moduleName}`;");
        }
        if (this.classInfo?.isAbstract) {
            this.writeFileReplaceVar("tag", "");
        }
        else {
            this.writeFileReplaceVar("tag", this.fullName + ".Tag=`" + this.tagName + "`;");
        }
        if (this.build.namespaces.includes(this.fullName)) {
            this.writeFileReplaceVar("namespaceStart", '_n = ' + this.fullName + ';' + EOL);
            this.writeFileReplaceVar("namespaceEnd", EOL + 'Object.assign(' + this.fullName + ', _n);' + EOL);
        }
        else {
            this.writeFileReplaceVar("namespaceStart", '');
            this.writeFileReplaceVar("namespaceEnd", '');
        }
        if (this.classInfo?.isExported) {
            this.writeFileReplaceVar("exported", "_." + this.fullName + "=" + this.fullName + ";");
        }
        else {
            this.writeFileReplaceVar("exported", "");
        }
        if (this.classInfo?.isAbstract) {
            this.writeFileReplaceVar("definition", "")
        }
        else {
            let aventusName = this.build.isCoreBuild ? "" : "Aventus.";
            this.writeFileReplaceVar("definition", "if(!window.customElements.get('" + this.tagName + "')){window.customElements.define('" + this.tagName + "', " + this.fullName + ");" + aventusName + "WebComponentInstance.registerDefinition(" + this.fullName + ");}")
        }
    }
    private writeFileTemplateHtml() {
        let htmlTxt = "";
        if (this.htmlParsed) {
            let slots = this.htmlParsed.getSlotsInfoTxt();
            let blocks = this.htmlParsed.getBlocksInfoTxt();
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
            const classInfo = this.classInfo;
            const generateTxt = (constructorBody: string) => {
                let constructorBodyTxt = "";
                if (constructorBody.length > 0) {
                    constructorBodyTxt = `constructor() ` + constructorBody
                }

                if (classInfo.isAbstract) {
                    if (constructorBodyTxt.length > 0) {
                        constructorBodyTxt = constructorBodyTxt.slice(0, constructorBodyTxt.length - 1);
                        constructorBodyTxt += EOL + 'if (this.constructor == ' + this.className + ') { throw "can\'t instanciate an abstract class"; }';
                        constructorBodyTxt += ' }'
                    }
                    else {
                        constructorBodyTxt = 'constructor() { super(); if (this.constructor == ' + this.className + ') { throw "can\'t instanciate an abstract class"; } }';
                    }
                }

                if (this.extraConstructorCode.length > 0) {
                    if (constructorBodyTxt.length > 0) {
                        constructorBodyTxt = constructorBodyTxt.slice(0, constructorBodyTxt.length - 1);
                        constructorBodyTxt += EOL + this.extraConstructorCode.join(EOL);
                        constructorBodyTxt += ' }'
                    }
                    else {
                        constructorBodyTxt = 'constructor() { super(); ' + EOL + this.extraConstructorCode.join(EOL) + ' }';
                    }
                }
                return constructorBodyTxt;
            }

            this.writeFileReplaceVar("constructor", generateTxt(this.classInfo.constructorContent), false);
            if (HttpServer.isRunning)
                this.writeFileHotReloadReplaceVar("constructor", generateTxt(this.classInfo.constructorContentHotReload));

        }
    }

    //#region field
    private viewsElements: { [name: string]: CustomFieldModel } = {};
    private upgradeAttributes = "";
    private writeFileFields() {
        let simpleVariables: CustomFieldModel[] = [];
        let attributes: CustomFieldModel[] = [];
        let properties: { field: CustomFieldModel, fctTxt: string | null }[] = [];
        let watches: { field: CustomFieldModel, fctTxt: string | null }[] = [];
        let viewsElements: { [name: string]: CustomFieldModel } = {};

        for (let fieldName in this.allFields) {
            let field = this.allFields[fieldName];
            // if (field.inParent && this.overrideViewDecorator === null) {
            if (field.inParent) {
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
                if (!field.overrideNullable) {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "You must add ! after the name to avoid undefined value", field.nameStart, field.nameEnd, AventusErrorCode.ExclamationMarkMissing));
                }
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

        if (this.upgradeAttributes.length > 0) {
            this.upgradeAttributes = `__upgradeAttributes() { super.__upgradeAttributes(); ${this.upgradeAttributes} }`
        }
        this.writeFileReplaceVar("upgradeAttributes", this.upgradeAttributes);


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
        let variablesSimpleHotReloadTxt = "";

        let fullTxt = "";
        let fullTxtHotReload = "";
        if (this.classInfo) {
            for (let fieldName in this.classInfo.propertiesStatic) {
                let field = this.classInfo.propertiesStatic[fieldName];
                fullTxt += field.compiledContent + EOL;
                fullTxtHotReload += field.compiledContentHotReload + EOL;
            }
        }
        for (let field of fields) {
            fullTxt += field.compiledContent + EOL;
            fullTxtHotReload += field.compiledContentHotReload + EOL;
        }
        let fullClassFields = `class MyCompilationClassAventus {${fullTxt}}`;
        let fieldsCompiled = "";
        try {
            fieldsCompiled = transpile(fullClassFields, AventusTsLanguageService.getCompilerOptionsCompile());
        } catch (e) {

        }
        let matchContent = /\{((\s|\S)*)\}/gm.exec(fieldsCompiled);
        if (matchContent) {
            variablesSimpleTxt = matchContent[1].trim();
        }
        this.writeFileReplaceVar('variables', variablesSimpleTxt, false);

        if (HttpServer.isRunning) {
            let fullClassFieldsHotReload = `class MyCompilationClassAventus {${fullTxtHotReload}}`;
            let fieldsCompiledHotReload = "";
            try {
                fieldsCompiledHotReload = transpile(fullClassFieldsHotReload, AventusTsLanguageService.getCompilerOptionsCompile());
            } catch (e) {

            }
            let matchContentHotReload = /\{((\s|\S)*)\}/gm.exec(fieldsCompiledHotReload);
            if (matchContentHotReload) {
                variablesSimpleHotReloadTxt = matchContentHotReload[1].trim();
            }
            this.writeFileHotReloadReplaceVar('variables', variablesSimpleHotReloadTxt);
        }
    }

    private getGetterAndSetter(field: CustomFieldModel, type: TypeInfo, isProp: boolean): string {
        let result = "";
        let key = field.name;
        let propTxt = isProp ? 'Prop' : 'Attr'
        if (type.kind == "string" || type.kind == "literal" || type.kind == "union") {
            result += `get '${key}'() { return this.getString${propTxt}('${key}') }
    set '${key}'(val) { this.setStringAttr('${key}', val) }${EOL}`;
        }
        else if (type.kind == "number") {
            result += `get '${key}'() { return this.getNumber${propTxt}('${key}') }
    set '${key}'(val) { this.setNumberAttr('${key}', val) }${EOL}`;
        }
        else if (type.kind == "boolean") {
            this.listBoolProperties.push('"' + key + '"');
            result += `get '${key}'() { return this.getBool${propTxt}('${key}') }
    set '${key}'(val) { this.setBoolAttr('${key}', val) }${EOL}`;
        }
        else if (type.kind === "type" && type.value == "Date") {
            result += `get '${key}'() { return this.getDate${propTxt}('${key}') }
    set '${key}'(val) { this.setDateAttr('${key}', val) }${EOL}`;
        }
        else if (type.kind === "type" && type.value == "DateTime") {
            result += `get '${key}'() { return this.getDateTime${propTxt}('${key}') }
    set '${key}'(val) { this.setDateTimeAttr('${key}', val) }${EOL}`;
        }
        return result;
    }
    private getDefaultValueAttr(field: CustomFieldModel, type: TypeInfo, isHotReload: boolean): string {
        let result = "";
        let key = field.name;
        let defaultValue = isHotReload ? field.defaultValueHotReload : field.defaultValue;
        if (type.kind == "boolean") {
            if (defaultValue !== null && defaultValue !== "false") {
                result += "if(!this.hasAttribute('" + key + "')) {this.setAttribute('" + key + "' ,'true'); }" + EOL;
            }
            else {
                //If default set to false, we refresh the attribute to set it to false and not undefined
                result += "if(!this.hasAttribute('" + key + "')) { this.attributeChangedCallback('" + key + "', false, false); }" + EOL;
            }
        }
        else if (type.kind == "type" && (type.value == "Date" || type.value == "DateTime")) {
            if (defaultValue !== null) {
                result += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = " + defaultValue + "; }" + EOL;
            }
            else {
                result += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = undefined; }" + EOL;
            }
        }
        else {
            if (defaultValue !== null) {
                result += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = " + defaultValue + "; }" + EOL;
            }
            else {
                result += "if(!this.hasAttribute('" + key + "')){ this['" + key + "'] = undefined; }" + EOL;
            }
        }

        return result;
    }
    private writeFileFieldsAttribute(fields: CustomFieldModel[]) {
        let defaultValue = "";
        let getterSetter = "";
        let defaultValueHotReload = "";

        for (let field of fields) {
            let type = this.validateTypeForProp(this.document, field);
            if (!type) {
                continue;
            }
            defaultValue += this.getDefaultValueAttr(field, type, false);
            getterSetter += this.getGetterAndSetter(field, type, false);
            this.createHtmlDoc(field, type);
            this.upgradeAttributes += 'this.__upgradeProperty(\'' + field.name.toLowerCase() + '\');' + EOL;

            if (HttpServer.isRunning) {
                defaultValueHotReload += this.getDefaultValueAttr(field, type, true)
            }
        }

        if (defaultValue.length > 0) {
            this.defaultValueTxt += defaultValue
        }
        if (defaultValueHotReload.length > 0) {
            this.defaultValueHotReloadTxt += defaultValueHotReload
        }
        this.writeFileReplaceVar("getterSetterAttr", getterSetter);
    }

    private writeFileFieldsProperty(properties: { field: CustomFieldModel, fctTxt: string | null }[]) {
        let defaultValue = "";
        let getterSetter = "";
        let onChange = "";
        let variablesWatched: string[] = [];
        let defaultValueHotReload = "";

        for (let property of properties) {
            let field = property.field;
            let type = this.validateTypeForProp(this.document, field)
            if (!type) {
                continue;
            }

            defaultValue += this.getDefaultValueAttr(field, type, false);
            getterSetter += this.getGetterAndSetter(field, type, true);
            this.createHtmlDoc(field, type);

            this.upgradeAttributes += 'this.__upgradeProperty(\'' + field.name.toLowerCase() + '\');' + EOL;
            variablesWatched.push(field.name.toLowerCase());

            // TODO replace decorator content for namespace
            if (property.fctTxt) {
                let fctTxt = this.transpileMethodNoRun(property.fctTxt);
                onChange += `this.__addPropertyActions("${field.name}", ${fctTxt});` + EOL;
            }

            if (HttpServer.isRunning) {
                defaultValueHotReload += this.getDefaultValueAttr(field, type, true)
            }
        }

        if (defaultValue.length > 0) {
            this.defaultValueTxt += defaultValue;
        }
        if (defaultValueHotReload.length > 0) {
            this.defaultValueHotReloadTxt += defaultValueHotReload
        }
        this.writeFileReplaceVar("getterSetterProp", getterSetter);



        if (onChange.length > 0) {
            onChange = `__registerPropertiesActions() { super.__registerPropertiesActions(); ${onChange} }`
        }
        // TODO replace inside hotreload
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
        let defaultValueWatch = "";
        let defaultValueWatchHotReload = "";
        for (let watch of watches) {
            let field = watch.field;

            if (watch.fctTxt) {
                this.watchProperties[field.name] = this.transpileMethodNoRun(watch.fctTxt);
            }
            else {
                this.watchProperties[field.name] = "";
            }

            getterSetter += `get '${field.name}'() {
						return this.__watch["${field.name}"];
					}
					set '${field.name}'(val) {
						this.__watch["${field.name}"] = val;
					}`+ EOL;

            defaultValueWatch += `w["${field.name}"] = ${field.defaultValue?.replace(/\\"/g, '')};` + EOL;
            this.foundedWatch.push(field.name);

            if (HttpServer.isRunning) {
                defaultValueWatchHotReload += `w["${field.name}"] = ${field.defaultValueHotReload?.replace(/\\"/g, '')};` + EOL;
            }
        }

        if (defaultValueWatch.length > 0) {
            defaultValueWatch = `__defaultValuesWatch(w) { super.__defaultValuesWatch(w); ${defaultValueWatch} }`;
        }
        this.writeFileReplaceVar("defaultValueWatch", defaultValueWatch, false);
        if (defaultValueWatchHotReload.length > 0) {
            defaultValueWatchHotReload = `__defaultValuesWatch(w) { super.__defaultValuesWatch(w); ${defaultValueWatchHotReload} }`;
        }
        this.writeFileHotReloadReplaceVar("defaultValueWatch", defaultValueWatchHotReload);

        this.writeFileReplaceVar("getterSetterWatch", getterSetter);
    }

    //#endregion


    private writeViewGlobalVariables() {
        // default value
        let txt = "";
        if (this.defaultValueTxt.length > 0) {
            txt = `__defaultValues() { super.__defaultValues(); ${this.defaultValueTxt} }`;
        }
        this.writeFileReplaceVar("defaultValue", txt, false);

        if (HttpServer.isRunning) {
            // default value
            let txt = "";
            if (this.defaultValueHotReloadTxt.length > 0) {
                txt = `__defaultValues() { super.__defaultValues(); ${this.defaultValueHotReloadTxt} }`;
            }
            this.writeFileHotReloadReplaceVar("defaultValue", txt);
        }

        // write boolean list 
        let listBoolTxt = "";
        if (this.listBoolProperties.length > 0) {
            listBoolTxt = `__listBoolProps() { return [${this.listBoolProperties.join(",")}].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }`;
        }
        this.writeFileReplaceVar("listBool", listBoolTxt);
    }

    private writeFileMethods() {
        try {
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
            let methodsTxtHotReload = "";
            let defaultStateTxt = "";
            if (this.classInfo) {
                let fullTxt = ""
                let fullTxtHotReload = ""
                for (let methodName in this.classInfo.methods) {
                    let method = this.classInfo.methods[methodName];
                    if (!method.mustBeCompiled) continue;
                    fullTxt += method.compiledContent + EOL;
                    if (HttpServer.isRunning)
                        fullTxtHotReload += method.compiledContentHotReload + EOL;
                    for (let decorator of method.decorators) {
                        if (BindThisDecorator.is(decorator)) {
                            this.extraConstructorCode.push(`this.${methodName}=this.${methodName}.bind(this)`);
                            continue;
                        }

                        let effectDecorator = EffectDecorator.is(decorator);
                        if (effectDecorator) {
                            this.watchFunctions[methodName] = effectDecorator.options;
                            continue;
                        }

                        // gestion des states
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

                if (HttpServer.isRunning) {
                    let fullClassFctHotReload = `class MyCompilationClassAventus {${fullTxtHotReload}}`;
                    let fctCompiledHotReload = transpile(fullClassFctHotReload, AventusTsLanguageService.getCompilerOptionsCompile());
                    let matchContentHotReload = /\{((\s|\S)*)\}/gm.exec(fctCompiledHotReload);
                    if (matchContentHotReload) {
                        methodsTxtHotReload = matchContentHotReload[1].trim();
                    }
                }
            }
            this.writeFileReplaceVar("methods", methodsTxt, false);
            this.writeFileHotReloadReplaceVar("methods", methodsTxtHotReload);


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
        } catch (e) {

        }
    }

    private variablesInViewDynamic = "";
    private writeViewInfo(template: HtmlTemplateResult, isMain: boolean, loopInfo?: ActionLoop, ifInfo?: ActionIfPart) {
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
                    element.useLive = isMain ? false : true
                    for (let decorator of field.decorators) {
                        let viewElTemp = ViewElementDecorator.is(decorator);
                        if (viewElTemp && viewElTemp.useLive !== undefined) {
                            element.useLive = viewElTemp.useLive;
                            break;
                        }
                    }

                    if (element.useLive) {
                        let querySelectorTxt = element.ids.map(id => `[_id="${id}"]`).join("|");
                        if (field.type.isArray || element.isArray) {
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
        let contentResult: { [id_attr: string]: { fct: string, once?: boolean } } = {}
        for (let key in contents) {
            contentResult[key] = {
                fct: `@_@${contents[key].fct}@_@`
            }
            if (contents[key].once) {
                contentResult[key].once = true;
            }
        }
        if (Object.keys(contentResult).length > 0) {
            finalViewResult.content = contentResult;
        }
        //#endregion

        //#region injection
        if (template.injection.length > 0) {
            finalViewResult.injection = template.injection;
        }
        //#endregion

        //#region bindings
        let bindings = template.bindings;
        let resultBindings: ActionBindings[] = []
        for (let binding of bindings) {
            let temp: ActionBindings = {
                id: binding.id,
                injectionName: binding.injectionName,
                eventNames: binding.eventNames,
                inject: binding.inject,
                extract: binding.extract
            }
            if (binding.once) {
                temp.once = binding.once;
            }
            if (binding.eventNames.length == 1 && binding.tagName) {
                let definition = this.build.getWebComponentDefinition(binding.tagName);
                let eventName = binding.eventNames[0];
                if (definition) {
                    let field = definition.class.getField(eventName);
                    if (field) {
                        let type = field.type.value;
                        if (ListCallbacks.includes(type)) {
                            temp.isCallback = true;
                        }
                    }
                }
            }
            resultBindings.push(temp);
        }
        if (resultBindings.length > 0) {
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
                    fct: `@_@(e, c) => c.comp.${event.fct}(e)@_@`,
                }
                if (event.tagName) {
                    let definition = this.build.getWebComponentDefinition(event.tagName);
                    let eventName = event.eventName;
                    if (definition) {
                        let field = definition.class.getField(eventName);
                        if (field) {
                            let type = field.type.value
                            if (ListCallbacks.includes(type)) {
                                temp.isCallback = true;
                                temp.fct = `@_@(c, ...args) => c.comp.${event.fct}.apply(c.comp, args)@_@`;
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
                            tempPressEvent[key] = `@_@(e, pressInstance, c) => { c.comp.${currentEvent.value}(e, pressInstance); }@_@`;
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

        //#region contextEdit
        if (template.contextEdits.length > 0) {
            finalViewResult.contextEdits = template.contextEdits;
        }
        //#endregion


        if (Object.keys(finalViewResult).length > 0 || loopInfo || ifInfo) {
            let finalViewResultTxt = JSON.stringify(finalViewResult, null, 2).replace(/"@_@(.*?)@_@"/g, "$1").replace(/\\"/g, '"')
            if (isMain) {
                finalTxt = `this.__getStatic().__template.setActions(${finalViewResultTxt});` + EOL;
            }
            else if (loopInfo) {
                finalTxt = `const templ${loopInfo.templateId} = new Aventus.Template(this);` + EOL;
                finalTxt += `templ${loopInfo.templateId}.setTemplate(\`${loopInfo.template}\`);` + EOL;
                if (Object.keys(finalViewResult).length > 0)
                    finalTxt += `templ${loopInfo.templateId}.setActions(${finalViewResultTxt});` + EOL;
                const parent = loopInfo.parentId === undefined ? 'this.__getStatic().__template' : `templ${loopInfo.parentId}`
                finalTxt += `${parent}.addLoop({
                    anchorId: '${loopInfo.anchorId}',
                    template: templ${loopInfo.templateId},
                `;
                if (loopInfo.simple) {
                    finalTxt += `simple:{data: "${loopInfo.simple.data}"`;
                    if (loopInfo.simple.index) {
                        finalTxt += `,index:"${loopInfo.simple.index}"`;
                    }
                    if (loopInfo.simple.item) {
                        finalTxt += `,item:"${loopInfo.simple.item}"`;
                    }
                    finalTxt += `}` + EOL;
                }
                else {
                    finalTxt += `func: ${loopInfo.func}` + EOL
                }
                finalTxt += `});` + EOL;
            }
            else if (ifInfo) {
                finalTxt = `const templ${ifInfo.templateId} = new Aventus.Template(this);` + EOL;
                finalTxt += `templ${ifInfo.templateId}.setTemplate(\`${ifInfo.template}\`);` + EOL;
                if (Object.keys(finalViewResult).length > 0)
                    finalTxt += `templ${ifInfo.templateId}.setActions(${finalViewResultTxt});` + EOL;
            }
        }

        for (let loop of template.loops) {
            finalTxt += this.writeViewInfo(loop.actions, false, loop);
        }
        for (let _if of template.ifs) {
            let partTxt = "";
            for (let part of _if.parts) {
                finalTxt += this.writeViewInfo(part.templateAction, false, undefined, part);
                let once = part.once ? 'once: true,' : ''
                partTxt += `{${once}
                    condition: ${part.condition},
                    template: templ${part.templateId}
                },`
            }

            if (partTxt.length > 0) {
                partTxt = partTxt.slice(0, partTxt.length - 1);
            }
            const parent = _if.parentId === undefined ? 'this.__getStatic().__template' : `templ${_if.parentId}`
            finalTxt += `${parent}.addIf({
                    anchorId: '${_if.anchorId}',
                    parts: [${partTxt}]
            });` + EOL;
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

    private watchProperties: { [name: string]: string } = {}
    private watchFunctions: { [name: string]: EffectDecoratorOption } = {}
    private writeWatchableElements() {
        let variableProxyTxt = "";

        for (let prop in this.watchProperties) {
            if (this.watchProperties[prop]) {
                variableProxyTxt += `this.__addWatchesActions("${prop}", ${this.watchProperties[prop]});` + EOL
            }
            else {
                variableProxyTxt += `this.__addWatchesActions("${prop}");` + EOL
            }
        }

        if (Object.keys(this.watchFunctions).length > 0) {
            let functionList: string[] = [];
            for (let name in this.watchFunctions) {
                if (this.watchFunctions[name].autoInit) {
                    functionList.push(`{ name: "${name}", autoInit: true }`)
                }
                else {
                    functionList.push(`"${name}"`);
                }
            }
            variableProxyTxt += `this.__addWatchesFunctions([${EOL}${functionList.join(",\n")}${EOL}]);` + EOL;
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
    private writeFileReplaceVar(variable: string, value: string | number, writeToHotReload: boolean = true) {
        let regex = new RegExp("\\$" + variable + "\\$", "g");
        this.template = this.template.replace(regex, value + "");
        if (writeToHotReload) {
            this.templateHotReload = this.templateHotReload.replace(regex, value + "");
        }
    }
    private writeFileHotReloadReplaceVar(variable: string, value: string | number) {
        let regex = new RegExp("\\$" + variable + "\\$", "g");
        this.templateHotReload = this.templateHotReload.replace(regex, value + "");
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
            this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.documentUser, errorTxt, start, end));
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
                this.htmlFile.tsErrors.push(createErrorHTMLPos(this.htmlFile.file.documentUser, errorTxt, position.start, position.end));
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
                        { start: field.start, end: field.end }
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
                { start: field.start, end: field.end }
            ));
        }
    }
    //#endregion

    //#endregion



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

    private transpileMethodNoRun(methodTxt): string {
        try {
            methodTxt = this.prepareMethodToTranspile(methodTxt);
            let method = transpile(methodTxt, AventusTsLanguageService.getCompilerOptionsCompile()).trim();
            method = method.substring(0, method.length - 1);
            method = "(" + method + ")";
            // method = minify(method, { mangle: false }).code;
            return method;
        } catch (e) {

        }
        return "";
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
            let firstNested: TypeInfo | undefined;
            for (let nested of type.nested) {
                if (nested.kind == 'undefined') {
                    field.isNullable = true;
                }
                if (!firstNested) {
                    if (nested.kind != 'undefined') {
                        firstNested = nested;
                    }
                }
                else if (nested.kind != firstNested.kind && nested.kind != 'undefined') {
                    firstNested = undefined;
                    break;
                }
            }
            if (firstNested) {
                if (firstNested.kind == 'literal') {
                    return type;
                }
                else {
                    return this._validateTypeForProp(currentDoc, field, firstNested);
                }
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
        if (type) {
            if (type.kind == "boolean" || type.kind == "number") {
                if (!field.overrideNullable && field.defaultValue === null) {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "You must add ! after the name to avoid undefined value", field.nameStart, field.nameEnd, AventusErrorCode.ExclamationMarkMissing));
                }
            }
            else {
                if (!field.isNullable && field.defaultValue === null) {
                    this.result.diagnostics.push(createErrorTsPos(this.document, "You must add ? after the name to allow undefined value", field.nameStart, field.nameEnd, AventusErrorCode.QuestionMarkMissing));
                }
            }
        }
        return type;
    }
    private removeWhiteSpaceLines(txt: string) {
        return txt.replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, '');
    }
    //#endregion
}

