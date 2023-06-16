import postcss from 'postcss';
import * as postcssSorting from 'postcss-sorting';
import * as postcssScss from 'postcss-scss';
import { CompletionItem, CSSFormatConfiguration, getSCSSLanguageService, LanguageService } from "vscode-css-languageservice";
import { CodeAction, CodeActionContext, CompletionList, Definition, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit } from "vscode-languageserver";
import { Build } from '../../project/Build';
import { getNodePath, SCSSDoc, Node, NodeType, CustomCssProperty } from './helper/CSSNode';
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusFile } from '../../files/AventusFile';



export class AventusSCSSLanguageService {
    private languageService: LanguageService;
    private documentationInfo: SCSSDoc = {};
    private externalDocumentation: { [key: string]: SCSSDoc } = {};
    private internalDocumentation: { [uri: string]: SCSSDoc } = {};
    private build: Build;

    public getInternalDocumentation(): SCSSDoc {
        let result: SCSSDoc = {};
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

    public constructor(build: Build) {
        this.build = build;
        this.languageService = getSCSSLanguageService();
    }

    public async doValidation(file: AventusFile): Promise<Diagnostic[]> {
        let diagnostics: Diagnostic[] = [];
        diagnostics = this.languageService.doValidation(file.document, this.languageService.parseStylesheet(file.document));
        // care css-lcurlyexpected  => be sure to have utf-8 encoding
        for (let i = 0; i < diagnostics.length; i++) {
            if (diagnostics[i].code == "emptyRules") {
                diagnostics.splice(i, 1);
                i--;
            }
        }
        return diagnostics;
    }
    public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
        let founded: string[] = [];
        let result: CompletionList = { isIncomplete: false, items: [] };
        result = this.languageService.doComplete(file.document, position, this.languageService.parseStylesheet(file.document));
        let items: { [label: string]: CompletionItem } = {};
        for (let item of result.items) {
            items[item.label] = item;
        }
        let lastEl = this.getTree(file, position).reverse()[0];
        if (this.documentationInfo[lastEl]) {
            for (let child of this.documentationInfo[lastEl]) {
                if (founded.indexOf(child.name) == -1) {
                    founded.push(child.name);
                    items[child.name] = {
                        label: child.name
                    }
                }
            }
        }
        // load global variables
        let txtBefore = "";
        // if (!checkTxtBefore(file, position, "var(")) {
        //     txtBefore = "var(";
        // }
        let txtAfter = "";
        // if (!checkTxtAfter(file, position, ")")) {
        //     txtAfter = ")";
        // }
        const colorRegExp = /^(#([\da-f]{3}){1,2}|(rgb|hsl)a\(\s*(\d{1,3}%?\s*,\s*){3}(1|0?\.\d+)\)|(rgb|hsl)\(\s*\d{1,3}%?(\s*,\s*\d{1,3}%?){2}\s*\))$/i;
        for (let variableName in this.build.globalSCSSLanguageService.variablesByName) {
            let current = this.build.globalSCSSLanguageService.variablesByName[variableName];
            if (current.value.match(colorRegExp)) {
                items[variableName] = {
                    label: variableName
                }
            }
            else {
                items[txtBefore + variableName + txtAfter] = {
                    label: txtBefore + variableName + txtAfter
                }
            }
        }
        result.items = Object.values(items);
        return result;
    }

    public async doHover(file: AventusFile, position: Position): Promise<Hover | null> {
        let element = this.getElementAtPosition(file, position);
        if (element?.type == NodeType.Identifier) {
            let def = this.build.globalSCSSLanguageService.getDefinition(element.getText());
            if (def) {
                return {
                    contents: {
                        kind: "plaintext",
                        value: def.name + ": " + def.value
                    }
                }
            }
        }
        return this.languageService.doHover(file.document, position, this.languageService.parseStylesheet(file.document));
    }

    public async findDefinition(file: AventusFile, position: Position): Promise<Definition | null> {
        let element = this.getElementAtPosition(file, position);
        if (element?.type == NodeType.Identifier) {
            let def = this.build.globalSCSSLanguageService.getDefinition(element.getText());
            if (def) {
                return {
                    uri: def.uri,
                    range: def.range
                }
            }
        }
        return this.languageService.findDefinition(file.document, position, this.languageService.parseStylesheet(file.document))
    }
    async format(file: AventusFile, range: Range, formatParams: FormattingOptions): Promise<TextEdit[]> {
        let formatConfig: CSSFormatConfiguration = {
            ...formatParams,
            preserveNewLines: true,
            spaceAroundSelectorSeparator: true,
            insertFinalNewline: true,
            insertSpaces: false,
            tabSize: 4,
        }
        let document = file.document;
        let result = await this.languageService.format(document, range, formatConfig);
        if (result.length == 1) {
            let start = document.offsetAt(result[0].range.start)
            let end = document.offsetAt(result[0].range.end)
            let length = document.getText().length;
            if (start == 0 && end == length) {
                let orderResult = await postcss([postcssSorting({
                    order: [
                        'custom-properties',
                        'dollar-variables',
                        'declarations',
                        'at-rules',
                        'rules',
                    ],
                    'properties-order': 'alphabetical'
                })]).process(result[0].newText, {
                    parser: postcssScss,
                    from: './temp.scss',
                    to: './temp.scss'
                })
                result[0].newText = orderResult.css;
            }
        }
        return result;

    }
    async doCodeAction(file: AventusFile, range: Range): Promise<CodeAction[]> {
        let docSCSS = this.languageService.parseStylesheet(file.document)
        let codeActionContext = CodeActionContext.create(this.languageService.doValidation(file.document, docSCSS))
        return this.languageService.doCodeActions2(file.document, range, codeActionContext, docSCSS);
    }
    public async onReferences(file: AventusFile, position: Position): Promise<Location[]> {
        let docSCSS = this.languageService.parseStylesheet(file.document)
        return this.languageService.findReferences(file.document, position, docSCSS);
    }


    //#region custom definition
    private rebuildDefinition() {
        this.documentationInfo = {};
        for (let uri in this.externalDocumentation) {
            let doc = this.externalDocumentation[uri];
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
    }
    public addExternalDefinition(uri: string, doc: SCSSDoc): void {
        this.externalDocumentation[uri] = doc;
        this.rebuildDefinition();
    }
    public removeExternalDefinition(uri: string): void {
        delete this.externalDocumentation[uri];
        this.rebuildDefinition();
    }
    public addInternalDefinition(uri: string, doc: SCSSDoc) {
        this.internalDocumentation[uri] = doc;
        this.rebuildDefinition();
    }
    public removeInternalDefinition(uri: string) {
        delete this.internalDocumentation[uri];
        this.rebuildDefinition();
    }
    //#endregion

    private getTree(file: AventusFile, position: Position): string[] {
        let result: string[] = [];
        if (this.languageService) {
            let doc = this.languageService.parseStylesheet(file.document);
            let offset = file.document.offsetAt(position);
            let path = getNodePath(doc as Node, offset);
            for (let node of path) {
                if (node.type == NodeType.Ruleset) {
                    let nodeDef = node.getChild(0);
                    if (nodeDef) {
                        let ruleName = nodeDef.getText();
                        result.push(ruleName);
                    }
                }
            }
        }
        return result;
    }

    private getElementAtPosition(file: AventusFile, position: Position): Node | null {
        if (this.languageService) {
            let doc = this.languageService.parseStylesheet(file.document) as Node;
            let offsetSearch = file.document.offsetAt(position);
            let loopCheck = (node: Node) => {
                let children = node.getChildren();
                for (let child of children) {
                    if (child.offset <= offsetSearch && child.end >= offsetSearch) {
                        if (child.hasChildren()) {
                            return loopCheck(child);
                        }
                        return child;
                    }
                }
                return null;
            }
            return loopCheck(doc);
        }
        return null;
    }
    public static getCustomProperty(srcCode: string): CustomCssProperty[] {
        let document = TextDocument.create("temp.scss", "scss", 1, srcCode);
        let result: CustomCssProperty[] = [];
        const _loadCustomProperty = (node: Node) => {
            if (node.type == NodeType.CustomPropertyDeclaration) {
                let nodeParent: Node | null = node;
                while (nodeParent && nodeParent["selectors"] == undefined) {
                    nodeParent = nodeParent.parent;
                }
                if (nodeParent) {
                    let selectorText = nodeParent["selectors"].getText();
                    if (selectorText == ":host") {
                        let propertyNode = node.getChild(0);
                        let expressionNode = node.getChild(1);
                        if (propertyNode && expressionNode) {
                            if (propertyNode.getText().startsWith("--internal")) {
                                let externalName = propertyNode.getText().replace("--internal-", "--");
                                if (expressionNode.getText().indexOf(externalName) != -1) {
                                    result.push({
                                        name: externalName
                                    })
                                }
                            }
                        }
                    }
                }
            }
            else if (node.hasChildren()) {
                for (let childNode of node.getChildren()) {
                    _loadCustomProperty(childNode);
                }
            }
        }

        let doc = getSCSSLanguageService().parseStylesheet(document);
        let path = getNodePath(doc as Node, 0);
        for (let pathTemp of path) {
            _loadCustomProperty(pathTemp);
        }
        return result;
    }


}




