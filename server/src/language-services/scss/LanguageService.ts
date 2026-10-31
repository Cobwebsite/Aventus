import postcss from 'postcss';
import postcssSorting from 'postcss-sorting';
import * as postcssScss from 'postcss-scss';
import { CompletionItem, CSSFormatConfiguration, getSCSSLanguageService, LanguageService } from "vscode-css-languageservice";
import { CodeAction, CodeActionContext, CompletionList, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { Build } from '../../project/Build';
import { getNodePath, Node, NodeType } from './helper/CSSNode';
import { SCSSDoc, CustomCssProperty, CustomCssPropertyType } from './helper/CSSCustomNode';
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusFile } from '../../files/AventusFile';
import { TagInfo } from '../html/parser/TagInfo';
import type { AventusWebSCSSFile } from './File';
import { GenericServer } from '../../GenericServer';
import { basename, dirname, isAbsolute, normalize, relative, resolve, sep } from 'path';
import { samePath, uriToPath } from '../../tools';
import { styleExtensions } from '../../definition';

export type SCSSParsedRule = Map<(tagInfo: TagInfo) => boolean, { start: number, end: number }>;

export class AventusSCSSLanguageService {

    private static referencedPath(base: string, oldPath: string): boolean {
        const allPaths = [base];
        for (const extension of styleExtensions) {
            allPaths.push(base + extension);
        }
        const folder = dirname(base);
        const name = basename(base);
        for (const extension of styleExtensions) {
            allPaths.push(resolve(folder, '_' + name + extension));
        }
        allPaths.push(resolve(folder, '_' + name));
        return allPaths.some(candidate => samePath(candidate, oldPath));
    }

    private static updatedSpecifier(sourcePath: string, original: string, newPath: string): string | null {
        let updated = relative(dirname(sourcePath), newPath).split(sep).join('/');
        if (isAbsolute(updated)) return null;

        if (!styleExtensions.some(extension => original.endsWith(extension))) {
            const extension = styleExtensions.find(item => updated.endsWith(item));
            if (extension) {
                updated = updated.slice(0, -extension.length);
            }

            const slash = updated.lastIndexOf('/');
            if (updated[slash + 1] === '_') {
                updated = updated.slice(0, slash + 1) + updated.slice(slash + 2);
            }
        }
        if (!updated.startsWith('.')) {
            updated = './' + updated;
        }
        return updated;
    }

    public static getScssRenameEdits(document: TextDocument, changes: { oldUri: string; newUri: string }[]): TextEdit[] {
        const source = document.getText();
        const sourcePath = uriToPath(document.uri);
        const edits: TextEdit[] = [];
        try {
            const stylesheet = postcssScss.parse(source);
            stylesheet.walkAtRules(rule => {
                if (!['import', 'use', 'forward'].includes(rule.name)) return;
                if (!rule.source?.start) return;

                const ruleStart = document.offsetAt({
                    line: rule.source.start.line - 1,
                    character: rule.source.start.column - 1,
                });

                const paramsStart = source.indexOf(rule.params, ruleStart + rule.name.length + 1);
                if (paramsStart === -1) return;

                const params = rule.params.replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length));
                for (const match of params.matchAll(/(['"])([^'"\r\n]+)\1/g)) {
                    const specifier = match[2];
                    if (/url\(\s*$/i.test(params.slice(0, match.index))) continue;
                    if (specifier.startsWith('@') || /^([a-z]+:|\/\/)/i.test(specifier)) continue;

                    const base = resolve(dirname(sourcePath), specifier);
                    for (const change of changes) {
                        const oldPath = uriToPath(change.oldUri);
                        if (!styleExtensions.some(extension => oldPath.endsWith(extension))) continue;
                        if (!this.referencedPath(base, oldPath)) continue;

                        const newText = this.updatedSpecifier(sourcePath, specifier, uriToPath(change.newUri));
                        if (!newText || newText === specifier) break;
                        const start = paramsStart + match.index + 1;
                        edits.push({
                            range: {
                                start: document.positionAt(start),
                                end: document.positionAt(start + specifier.length),
                            }, newText
                        });
                        break;
                    }
                }
            });
        } catch {
            return [];
        }
        return edits;
    }

    private languageService: LanguageService;
    private documentationInfo: SCSSDoc = {};
    private externalDocumentation: { [key: string]: SCSSDoc } = {};
    private internalDocumentation: { [uri: string]: SCSSDoc } = {};
    private build: Build;
    private _allowRebuildDefinition: boolean = true;

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

    public getRenameFileEdits(file: AventusFile, changes: { oldUri: string; newUri: string }[]): TextEdit[] {
        return AventusSCSSLanguageService.getScssRenameEdits(file.documentUser, changes);
    }

    public async doValidation(file: AventusFile): Promise<Diagnostic[]> {
        let diagnostics: Diagnostic[] = [];
        diagnostics = this.languageService.doValidation(file.documentUser, this.languageService.parseStylesheet(file.documentUser));
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
        result = this.languageService.doComplete(file.documentUser, position, this.languageService.parseStylesheet(file.documentUser));
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
        const stylesheet = this.languageService.parseStylesheet(file.documentUser);
        const localDefinition = this.languageService.findDefinition(file.documentUser, position, stylesheet);
        if (localDefinition?.uri === file.documentUser.uri) {
            return this.languageService.doHover(file.documentUser, position, stylesheet);
        }
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
        return this.languageService.doHover(file.documentUser, position, stylesheet);
    }

    public async findDefinition(file: AventusFile, position: Position): Promise<Location[] | null> {
        const location = this.languageService.findDefinition(file.documentUser, position, this.languageService.parseStylesheet(file.documentUser));
        if (location?.uri === file.documentUser.uri) return [location];
        let element = this.getElementAtPosition(file, position);
        if (element?.type == NodeType.Identifier) {
            let def = this.build.globalSCSSLanguageService.getDefinition(element.getText());
            if (def) {
                return [{
                    uri: def.uri,
                    range: def.range
                }]
            }
        }
        if (!location) return location;
        return [location];
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
        let document = file.documentUser;
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
                    syntax: postcssScss,
                    from: './temp.scss',
                    to: './temp.scss',
                })
                result[0].newText = orderResult.css;
            }
        }
        return result;

    }
    async doCodeAction(file: AventusFile, range: Range): Promise<CodeAction[]> {
        let docSCSS = this.languageService.parseStylesheet(file.documentUser)
        let codeActionContext = CodeActionContext.create(this.languageService.doValidation(file.documentUser, docSCSS))
        return this.languageService.doCodeActions2(file.documentUser, range, codeActionContext, docSCSS);
    }
    public async onReferences(file: AventusFile, position: Position): Promise<Location[]> {
        const docSCSS = this.languageService.parseStylesheet(file.documentUser);
        const localDefinition = this.languageService.findDefinition(file.documentUser, position, docSCSS);
        if (localDefinition?.uri === file.documentUser.uri) {
            return this.languageService.findReferences(file.documentUser, position, docSCSS);
        }
        const globalReferences = this.build.globalSCSSLanguageService.getGlobalReferences(file.documentUser, position, this.build);
        if (globalReferences) return globalReferences;
        return this.languageService.findReferences(file.documentUser, position, docSCSS);
    }

    public onRename(file: AventusFile, position: Position, newName: string): WorkspaceEdit | null {
        const docSCSS = this.languageService.parseStylesheet(file.documentUser);
        const localDefinition = this.languageService.findDefinition(file.documentUser, position, docSCSS);
        if (localDefinition?.uri !== file.documentUser.uri) {
            return this.build.globalSCSSLanguageService.onRename(file.documentUser, position, newName);
        }
        const name = newName.startsWith('--') ? newName : `--${newName}`;
        if (!/^--[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name)) return null;
        const references = this.languageService.findReferences(file.documentUser, position, docSCSS);
        return { changes: { [file.documentUser.uri]: references.map(reference => ({ range: reference.range, newText: name })) } };
    }


    //#region custom definition
    public allowRebuildDefinition(value: boolean) {
        this._allowRebuildDefinition = value;
        this.rebuildDefinition();
    }
    private rebuildDefinition() {
        if (!this._allowRebuildDefinition) return
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
    public getExternalDefinition(uri: string): SCSSDoc | undefined {
        return this.externalDocumentation[uri];
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

    public getLinkToHtml(file: AventusWebSCSSFile, position: Position): Location[] {
        let result: Location[] = [];
        let offset = file.file.documentUser.offsetAt(position);
        let htmlFile = file.htmlFile;
        if (htmlFile && htmlFile.fileParsed) {
            for (let points of htmlFile.fileParsed.styleLinks) {
                let point = points[1]
                if (offset >= point.start && offset <= point.end) {
                    result.push({
                        uri: htmlFile.file.uri,
                        range: {
                            start: htmlFile.file.documentUser.positionAt(points[0].start),
                            end: htmlFile.file.documentUser.positionAt(points[0].end)
                        }
                    });
                }
            }
        }
        return result;
    }

    private getTree(file: AventusFile, position: Position): string[] {
        let result: string[] = [];
        if (this.languageService) {
            let doc = this.languageService.parseStylesheet(file.documentUser);
            let offset = file.documentUser.offsetAt(position);
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

    public getRules(file: AventusFile) {
        let rules: SCSSParsedRule = new Map();
        let doc = this.languageService.parseStylesheet(file.documentUser);

        const _createRuleClass = (selector: Node) => {
            return (tagInfo: TagInfo) => {
                let selectorTxt = selector.getText().replace(".", "");
                let regex = new RegExp("((?:^|\\W))(" + selectorTxt + ")(?:$|\\W)", "gi")
                if (tagInfo.attributes["class"]?.value?.match(regex)) {
                    return true;
                }
                return false;
            }

        }
        const _createRuleElementName = (selector: Node) => {
            return (tagInfo: TagInfo) => {
                let selectorTxt = selector.getText();
                if (tagInfo.tagName == selectorTxt) {
                    return true;
                }
                return false;
            }
        }
        const _createCheck = (parentCheck: ((tagInfo: TagInfo) => boolean) | null = null, checks: ((tagInfo: TagInfo) => boolean)[]) => {
            return (tagInfo: TagInfo) => {
                if (parentCheck) {
                    let oneIsMatching = false;
                    let parent = tagInfo.parent;
                    while (parent) {
                        if (parentCheck(parent)) {
                            oneIsMatching = true;
                            break;
                        }
                        parent = parent.parent;
                    }
                    if (!oneIsMatching) return false;
                }

                for (let check of checks) {
                    if (!check(tagInfo)) {
                        return false;
                    }
                }
                return true;
            };
        }

        const _loadRules = (node: Node, parentCheck: ((tagInfo: TagInfo) => boolean) | null = null) => {
            if (node.type == NodeType.Ruleset) {
                let hasContent = false;
                let children = node.getChildren();
                if (children.length > 1) {
                    for (let decl of children[1].getChildren()) {
                        if (decl.type == NodeType.Declaration || decl.type == NodeType.CustomPropertyDeclaration || decl.type == NodeType.MixinDeclaration || decl.type == NodeType.FunctionDeclaration || decl.type == NodeType.VariableDeclaration) {
                            hasContent = true;
                            break;
                        }
                    }
                }
                if (children.length > 0) {
                    let realNode = children[0]?.getChildren()[0];
                    let position: { start: number, end: number } | null = null;
                    if (realNode) {
                        let oldParentCheck = parentCheck;
                        for (let childNode of realNode.getChildren()) {
                            if (childNode.type == NodeType.SimpleSelector) {
                                if (!position) {
                                    position = {
                                        start: childNode.offset,
                                        end: childNode.offset + childNode.length,
                                    };
                                }
                                else if (position.start > childNode.offset) {
                                    position.start = childNode.offset;
                                }
                                else if (position.end < childNode.offset + childNode.length) {
                                    position.end = childNode.offset + childNode.length;
                                }
                                let checks: ((tagInfo: TagInfo) => boolean)[] = [];
                                for (let selector of childNode.getChildren()) {
                                    if (selector.type == NodeType.ClassSelector) {
                                        checks.push(_createRuleClass(selector));
                                    }
                                    else if (selector.type == NodeType.ElementNameSelector) {
                                        checks.push(_createRuleElementName(selector))
                                    }
                                }
                                if (checks.length > 0) {
                                    parentCheck = _createCheck(parentCheck, checks);

                                }
                            }
                            else {
                                let txt = childNode.getText();
                                const position = file.documentUser.positionAt(realNode.offset)
                                GenericServer.warning("css node to implement : " + file.documentUser.uri + ":" + position.line + ":" + position.character);
                            }
                        }
                        if (parentCheck && position) {
                            rules.set(parentCheck, position)
                        }
                    }
                }
            }
            else if (node.type == NodeType.Property) {
                return;
            }

            if (node.hasChildren()) {
                for (let childNode of node.getChildren()) {
                    _loadRules(childNode, parentCheck);
                }
            }
        }
        let path = getNodePath(doc as Node, 0);
        if (path.length > 0) {
            _loadRules(path[0]);
        }
        return rules;
    }

    private getElementAtPosition(file: AventusFile, position: Position): Node | null {
        if (this.languageService) {
            let doc = this.languageService.parseStylesheet(file.documentUser) as Node;
            let offsetSearch = file.documentUser.offsetAt(position);
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
        let result: { [name: string]: CustomCssProperty } = {};
        const extractComment = (node: Node, variableName: string): { documentation: string[], type: CustomCssPropertyType, default?: string } | null => {
            let txt = node.parent?.getText() ?? '';
            const variableRegex = new RegExp(`\/\\*([\\s\\S]*?)\\*\/\\s*${variableName}\\s*:\\s*[^;]+;`, 'g');
            const match = variableRegex.exec(txt);
            if (match && match[1]) {
                const result: { documentation: string[], type: CustomCssPropertyType, default?: string } = {
                    documentation: [],
                    type: "*"
                }
                const commentTxt = match[1].trim();
                const array = commentTxt.replace(/\r\n?/g, "\n").split("\n");
                for (let item of array) {
                    let foundTag = false;
                    item = item.replace("*", "").trim();
                    if (item.startsWith("@")) {
                        foundTag = true;

                        if (item.startsWith("@type")) {
                            // TODO complete type checking
                            result.type = item.replace("@type", "").trim() as CustomCssPropertyType;
                        }

                        if (item.startsWith("@default")) {
                            result.default = item.replace("@default", "").trim();
                        }
                    }
                    else if (!foundTag) {
                        result.documentation.push(item.trim())
                    }
                }
                return result
            }
            return null
        };
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
                            let externalName: null | string = null;
                            if (propertyNode.getText().startsWith("--internal")) {
                                externalName = propertyNode.getText().replace("--internal-", "--");
                            }
                            else if (propertyNode.getText().startsWith("--_")) {
                                externalName = propertyNode.getText().replace("--_", "--");
                            }
                            const comment = extractComment(node, propertyNode.getText());

                            if (externalName && expressionNode.getText().indexOf(externalName) != -1) {
                                const cssProperty: CustomCssProperty = {
                                    name: externalName
                                }
                                if (comment?.documentation) {
                                    cssProperty.documentation = comment.documentation.join("\n").trim();
                                }
                                if (comment?.type) {
                                    cssProperty.type = comment.type
                                }

                                if (comment?.default) {
                                    cssProperty.defaultValue = comment.default;
                                }

                                let finalNode: Node | null = expressionNode;
                                let chainValues: string[] = [];
                                let lastChain: string = '';
                                while (finalNode && finalNode.getChildren().length > 0) {
                                    let children = finalNode.getChildren();
                                    let txtTemp = finalNode.getText();
                                    if (txtTemp && txtTemp.startsWith("--")) {
                                        txtTemp = txtTemp.split(",")[0];
                                        if (lastChain != txtTemp && txtTemp != externalName) {
                                            lastChain = txtTemp;
                                            chainValues.push(txtTemp);
                                        }
                                    }
                                    finalNode = children[children.length - 1];
                                }
                                let finalValue: string = finalNode.getText() ?? '';
                                if (finalValue) {
                                    if (!finalValue.startsWith("--")) {
                                        chainValues.push(finalValue);
                                    }
                                }
                                if (chainValues.length > 0) {
                                    cssProperty.chainValues = chainValues;
                                    if (cssProperty.defaultValue == undefined) {
                                        cssProperty.defaultValue = cssProperty.chainValues[cssProperty.chainValues.length - 1]
                                    }
                                }

                                result[cssProperty.name] = cssProperty;
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
        _loadCustomProperty(doc as Node);
        return Object.values(result);
    }


}




