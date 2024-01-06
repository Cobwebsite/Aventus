import { getLanguageService, IAttributeData, ITagData, IValueData, LanguageService, TokenType } from "vscode-html-languageservice";
import { CompletionItemKind, CompletionList, Definition, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit } from "vscode-languageserver";
import { AventusLanguageId } from "../../definition";
import { AventusFile } from '../../files/AventusFile';
import { Build } from "../../project/Build";
import { CustomTypeAttribute } from "../ts/component/compiler/def";
import { AventusWebComponentLogicalFile } from '../ts/component/File';
import { allGenericTags, defaultAttrs } from './defaultTags';
import { AventusHTMLFile } from './File';
import { HTMLDoc } from "./helper/definition";
import { MethodInfo } from '../ts/parser/MethodInfo';
import { PropertyInfo } from '../ts/parser/PropertyInfo';
import { ClassInfo } from '../ts/parser/ClassInfo';
import { TextDocument } from 'vscode-languageserver-textdocument';


export class AventusHTMLLanguageService {
    private languageService: LanguageService;
    private id: number = 0;
    private isAutoComplete: boolean = false;

    private customTagsData: ITagData[] = [];
    private documentationInfo: HTMLDoc = {};
    private extenalDocumentation: { [key: string]: HTMLDoc } = {};
    private internalDocumentation: { [key: string]: HTMLDoc } = {};
    private internalDocumentationReverse: { [className: string]: AventusWebComponentLogicalFile } = {};

    public constructor(build: Build) {
        this.languageService = this.getHTMLLanguageService();
    }

    public getInternalDocumentation(): HTMLDoc {
        let result: HTMLDoc = {};
        for (let uri in this.internalDocumentation) {
            try {
                result = {
                    ...result,
                    ...this.internalDocumentation[uri]
                }
            }
            catch (e) { }
        }
        return result;
    }

    public getClassByTag(tagName: string): string | null {
        let info = this.documentationInfo[tagName];
        if (info) {
            return info.class;
        }
        return null
    }
    public getGenericHTML(tagName: string): string | null {
        if (allGenericTags[tagName]) {
            return allGenericTags[tagName];
        }
        return null;
    }

    //#region init language service
    public getHTMLLanguageService(): LanguageService {
        return getLanguageService({
            useDefaultDataProvider: true,
            customDataProviders: [
                {
                    getId: this.getId.bind(this),
                    isApplicable(languageId) {
                        return languageId == AventusLanguageId.HTML;
                    },
                    provideTags: this.provideTags.bind(this),
                    provideAttributes: this.provideAttributes.bind(this),
                    provideValues: this.provideValues.bind(this)
                }
            ],
        });
    }
    public getId(): string {
        return this.id + "";
    }
    public provideTags(): ITagData[] {
        return this.customTagsData;
    }
    public provideAttributes(tag: string): IAttributeData[] {
        let result: IAttributeData[] = [...defaultAttrs];
        if (this.documentationInfo[tag]) {
            let attrs = this.documentationInfo[tag].attributes;
            for (let attrName in attrs) {
                let current = attrs[attrName];
                if (this.isAutoComplete) {
                    result.push({
                        name: "!!" + current.name,
                        description: JSON.stringify({
                            description: current.description,
                            type: current.type,
                        })
                    })
                }
                else {
                    result.push({
                        name: current.name,
                        description: current.description
                    })
                }
            }
        }
        return result;
    }
    public provideValues(tag: string, attribute: string): IValueData[] {
        if (this.documentationInfo[tag] && this.documentationInfo[tag].attributes[attribute]) {
            return this.documentationInfo[tag].attributes[attribute].values;
        }
        return [];
    }

    //#endregion

    //#region language service function
    public async doValidation(file: AventusFile): Promise<Diagnostic[]> {
        return [];
    }
    public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
        let docHTML = this.languageService.parseHTMLDocument(file.document);
        if (docHTML) {
            this.isAutoComplete = true;
            let result = this.languageService.doComplete(file.document, position, docHTML);
            this.isAutoComplete = false;
            for (let temp of result.items) {
                if (temp.label.startsWith("!!")) {
                    temp.kind = CompletionItemKind.Snippet;
                    if (temp.textEdit) {
                        let newLabel = temp.label.replace("!!", "");
                        temp.textEdit.newText = temp.textEdit.newText.replace(temp.label, newLabel)
                        if (temp.documentation) {
                            let customInfo: {
                                description: string,
                                type: CustomTypeAttribute
                            } = JSON.parse(temp.documentation["value"]);

                            if (customInfo.description == "") {
                                delete temp.documentation;
                            }

                            if (customInfo.type == 'boolean') {
                                temp.textEdit.newText = temp.textEdit.newText.split("=")[0];
                            }
                        }
                        temp.label = newLabel;
                    }
                }
                if (temp.kind == CompletionItemKind.Property && temp.textEdit) {
                    if (!temp.textEdit.newText.endsWith(">")) {
                        temp.textEdit.newText += "></" + temp.textEdit.newText + ">";
                    }
                }
            }
            return result;
        }
        return { isIncomplete: false, items: [] };
    }
    public async doHover(file: AventusHTMLFile, position: Position): Promise<Hover | null> {
        let info = this.getLinkToLogic(file, position);
        if (info) {
            return {
                contents: {
                    kind: 'markdown',
                    value: info.documentation.join("\n")
                }
            };

        }
        else {
            let docHTML = this.languageService.parseHTMLDocument(file.file.document);
            if (docHTML) {
                return this.languageService.doHover(file.file.document, position, docHTML)
            }
        }
        return null;
    }
    public async format(document: TextDocument, range: Range, formatParams: FormattingOptions): Promise<TextEdit[]> {
        return this.languageService.format(document, range, formatParams);
    }
    public async onDefinition(file: AventusHTMLFile, position: Position): Promise<Definition | null> {
        let info = this.getLinkToLogic(file, position);
        let tsFile = file.tsFile;
        if ((info instanceof MethodInfo || info instanceof PropertyInfo) && tsFile) {
            return {
                uri: tsFile.file.uri,
                range: {
                    start: tsFile.file.document.positionAt(info.nameStart),
                    end: tsFile.file.document.positionAt(info.nameEnd)
                }
            }
        }
        else if (info instanceof ClassInfo) {
            return {
                uri: info.document.uri,
                range: {
                    start: info.document.positionAt(info.nameStart),
                    end: info.document.positionAt(info.nameEnd)
                }
            }
        }

        
        return null;
    }
    //#endregion


    private getLinkToLogic(file: AventusHTMLFile, position: Position): MethodInfo | PropertyInfo | ClassInfo | null {
        let offset = file.file.document.offsetAt(position);
        let tsFile = file.tsFile;
        let classInfo = tsFile?.fileParsed?.classes[tsFile.getComponentName()]
        if (tsFile && classInfo && file.fileParsed) {
            for (let point of file.fileParsed.interestPoints) {
                if (offset >= point.start && offset <= point.end) {
                    let element: MethodInfo | PropertyInfo | null = null;
                    if (point.type == "method") {
                        element = classInfo.methods[point.name];
                    }
                    else if (point.type == "property") {
                        element = classInfo.properties[point.name];
                    }
                    else if (point.type == "tag") {
                        let tagInfo = this.documentationInfo[point.name];
                        if (tagInfo) {
                            // search local
                            let internalInfo = this.internalDocumentationReverse[tagInfo.class];
                            if (internalInfo && internalInfo.fileParsed) {
                                for (let className in internalInfo.fileParsed.classes) {
                                    if (className == tagInfo.class) {
                                        return internalInfo.fileParsed.classes[className];
                                    }
                                }
                            }
                            // search inside def
                            let defintionInfo = file.build.getWebComponentDefinition(tagInfo.name, true);
                            if (defintionInfo) {
                                return defintionInfo.class;
                            }
                        }
                    }
                    return element;
                }
                else if (point.end >= offset) {
                    return null;
                }
            }
        }
        return null;
    }

    public getLinkToStyle(file: AventusHTMLFile, position: Position): Location[] {
        let result: Location[] = [];
        let offset = file.file.document.offsetAt(position);
        let scssFile = file.scssFile;
        if (scssFile && file.fileParsed) {
            for (let points of file.fileParsed.styleLinks) {
                let point = points[0]
                if (offset >= point.start && offset <= point.end) {
                    result.push({
                        uri: scssFile.file.uri,
                        range: {
                            start: scssFile.file.document.positionAt(points[1].start),
                            end: scssFile.file.document.positionAt(points[1].end)
                        }
                    });
                }
            }
        }
        return result;
    }

    //#region custom definition
    public rebuildDefinition() {
        this.documentationInfo = {};
        for (let uri in this.extenalDocumentation) {
            let doc = this.extenalDocumentation[uri];
            this.documentationInfo = {
                ...this.documentationInfo,
                ...doc
            }
        }
        for (let uri in this.internalDocumentation) {
            let doc = this.internalDocumentation[uri];
            try {
                this.documentationInfo = {
                    ...this.documentationInfo,
                    ...doc
                }
            }
            catch (e) { }
        }

        this.customTagsData = [{
            name: 'block',
            attributes: [{
                name: "name"
            }]
        }];
        let nameDone: string[] = [];
        for (let key in this.documentationInfo) {
            let current = this.documentationInfo[key];
            if (nameDone.indexOf(current.name) == -1) {
                nameDone.push(current.name);
                let attrs: IAttributeData[] = []
                let temp: ITagData = {
                    name: current.name,
                    description: current.description,
                    attributes: attrs
                }
                for (let attrName in current.attributes) {
                    let currentAttr = current.attributes[attrName];
                    attrs.push({
                        name: currentAttr.name,
                        description: currentAttr.description,
                        values: currentAttr.values
                    })
                }
                this.customTagsData.push(temp);
            }
        }
    }
    public addExternalDefinition(uri: string, doc: HTMLDoc): void {
        this.extenalDocumentation[uri] = doc;
        this.rebuildDefinition();
    }
    public removeExternalDefinition(uri: string): void {
        delete this.extenalDocumentation[uri];
        this.rebuildDefinition();
    }
    public getInternalDefinition(tagName: string): AventusWebComponentLogicalFile | undefined {
        let info = this.documentationInfo[tagName];
        if (info) {
            return this.internalDocumentationReverse[info.class];
        }
        return undefined;
    }
    public addInternalDefinition(uri: string, doc: HTMLDoc, fromFile: AventusWebComponentLogicalFile) {
        this.internalDocumentation[uri] = doc;
        for (let tagName in doc) {
            this.internalDocumentationReverse[doc[tagName].class] = fromFile;
        }
        this.rebuildDefinition();
    }
    public removeInternalDefinition(uri: string) {
        let oldDoc = this.internalDocumentation[uri];
        if (oldDoc) {
            for (let tagName in oldDoc) {
                delete this.internalDocumentationReverse[oldDoc[tagName].class];
            }
        }
        delete this.internalDocumentation[uri];
        this.rebuildDefinition();
    }
    //#endregion
}
