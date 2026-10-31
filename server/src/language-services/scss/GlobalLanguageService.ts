import postcss from 'postcss';
import postcssSorting from 'postcss-sorting';
import * as postcssScss from 'postcss-scss';
import { CSSFormatConfiguration, getSCSSLanguageService, LanguageService, TextDocument } from "vscode-css-languageservice";
import { CodeAction, CodeActionContext, CompletionList, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { AventusFile } from '../../files/AventusFile';
import { Node, NodeType } from './helper/CSSNode';
import { AventusGlobalSCSSFile } from './GlobalFile';
import type { Build } from '../../project/Build';
import type { Project } from '../../project/Project';
import { AventusSCSSLanguageService } from './LanguageService';



export type GlobalCSSVariable = {
    name: string,
    range: Range,
    uri: string,
    value: string
}

function withoutCommentsAndStrings(text: string): string {
    const result = text.split('');
    const hide = (index: number) => {
        if (text[index] !== '\r' && text[index] !== '\n') result[index] = ' ';
    };
    let state: 'normal' | 'block' | 'line' | 'string' | 'url' = 'normal';
    let quote = '';
    let stringReturn: 'normal' | 'url' = 'normal';
    let urlDepth = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];
        if (state === 'normal') {
            if (char === '/' && next === '*') {
                hide(i); hide(++i); state = 'block';
            } else if (char === '/' && next === '/') {
                hide(i); hide(++i); state = 'line';
            } else if (char === '"' || char === "'") {
                quote = char; stringReturn = 'normal'; hide(i); state = 'string';
            } else if ((char === 'u' || char === 'U') && (i === 0 || !/[\w-]/.test(text[i - 1]))) {
                const urlStart = /^url\s*\(/i.exec(text.slice(i));
                if (urlStart) {
                    i += urlStart[0].length - 1;
                    state = 'url';
                    urlDepth = 1;
                }
            }
        } else if (state === 'block') {
            hide(i);
            if (char === '*' && next === '/') { hide(++i); state = 'normal'; }
        } else if (state === 'line') {
            if (char === '\r' || char === '\n') state = 'normal';
            else hide(i);
        } else if (state === 'string') {
            hide(i);
            if (char === '\\' && next !== undefined) hide(++i);
            else if (char === quote) state = stringReturn;
        } else {
            if (char === '"' || char === "'") {
                quote = char; stringReturn = 'url'; hide(i); state = 'string';
            } else if (char === '(') {
                urlDepth++; hide(i);
            } else if (char === ')') {
                urlDepth--; if (urlDepth === 0) state = 'normal'; else hide(i);
            } else hide(i);
        }
    }
    return result.join('');
}

export class AventusGlobalSCSSLanguageService {
    private languageService: LanguageService;
    private variablesByUri: { [uri: string]: GlobalCSSVariable[] } = {}
    public variablesByName: { [name: string]: GlobalCSSVariable } = {}
    private project: Project
    public constructor(project: Project) {
        this.project = project;
        this.languageService = getSCSSLanguageService();
    }

    public getRenameFileEdits(file: AventusFile, changes: { oldUri: string; newUri: string }[]): TextEdit[] {
        return AventusSCSSLanguageService.getScssRenameEdits(file.documentUser, changes);
    }

    public async doValidation(file: AventusFile): Promise<Diagnostic[]> {
        return this.languageService.doValidation(file.documentUser, this.languageService.parseStylesheet(file.documentUser));
    }
    public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
        return this.languageService.doComplete(file.documentUser, position, this.languageService.parseStylesheet(file.documentUser));
    }

    public async doHover(file: AventusFile, position: Position): Promise<Hover | null> {
        return this.languageService.doHover(file.documentUser, position, this.languageService.parseStylesheet(file.documentUser));
    }

    public async findDefinition(file: AventusFile, position: Position): Promise<Location[] | null> {
        const result = this.languageService.findDefinition(file.documentUser, position, this.languageService.parseStylesheet(file.documentUser));
        if (!result) return result;
        return [result]
    }
    public async format(file: AventusFile, range: Range, formatParams: FormattingOptions): Promise<TextEdit[]> {
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
                    from: './temp.scss',
                    to: './temp.scss'
                })
                result[0].newText = orderResult.css;
            }
        }
        return result;

    }
    public async doCodeAction(file: AventusFile, range: Range): Promise<CodeAction[]> {
        let docSCSS = this.languageService.parseStylesheet(file.documentUser)
        let codeActionContext = CodeActionContext.create(this.languageService.doValidation(file.documentUser, docSCSS))
        return this.languageService.doCodeActions2(file.documentUser, range, codeActionContext, docSCSS);
    }
    public async onReferences(file: AventusFile, position: Position): Promise<Location[]> {
        const globalReferences = this.getGlobalReferences(file.documentUser, position);
        if (globalReferences) return globalReferences;
        let docSCSS = this.languageService.parseStylesheet(file.documentUser)
        return this.languageService.findReferences(file.documentUser, position, docSCSS);
    }

    public getGlobalReferences(document: TextDocument, position: Position, build?: Build): Location[] | null {
        const offset = document.offsetAt(position);
        const source = withoutCommentsAndStrings(document.getText());
        const token = /--[a-zA-Z0-9_-]+/g;
        let match: RegExpExecArray | null;
        let name: string | undefined;
        while (match = token.exec(source)) {
            if (match.index <= offset && offset <= match.index + match[0].length) {
                name = match[0];
                break;
            }
        }
        if (!name) return null;
        const definition = this.getDefinition(name);
        if (!definition) return null;

        const locations: Location[] = [{ uri: definition.uri, range: definition.range }];
        const documents = new Map<string, TextDocument>();
        const project = this.project;
        const builds = build ? [build] : project.getBuilds()
        for (const file of Object.values(project.scssFiles)) {
            documents.set(file.file.documentUser.uri, file.file.documentUser);
        }
        for (const currentBuild of builds) {
            for (const file of Object.values(currentBuild.scssFiles)) {
                documents.set(file.file.documentUser.uri, file.file.documentUser);
            }
        }
        documents.set(document.uri, document);
        for (const current of documents.values()) {
            const text = withoutCommentsAndStrings(current.getText());
            const uses = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
            let use: RegExpExecArray | null;
            while (use = uses.exec(text)) {
                if (use[1] !== name) continue;
                const start = use.index + use[0].lastIndexOf(name);
                locations.push({
                    uri: current.uri,
                    range: {
                        start: current.positionAt(start),
                        end: current.positionAt(start + name.length),
                    }
                });
            }
        }
        return locations.some(location =>
            location.uri === document.uri &&
            document.offsetAt(location.range.start) <= offset &&
            offset < document.offsetAt(location.range.end))
            ? locations : null;
    }

    public onRename(document: TextDocument, position: Position, newName: string): WorkspaceEdit | null {
        const references = this.getGlobalReferences(document, position);
        if (!references) return null;
        const name = newName.startsWith('--') ? newName : `--${newName}`;
        if (!/^--[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name)) return null;

        const changes: { [uri: string]: TextEdit[] } = {};
        const seen = new Set<string>();
        for (const reference of references) {
            const { uri, range } = reference;
            const key = `${uri}:${range.start.line}:${range.start.character}:${range.end.line}:${range.end.character}`;
            if (seen.has(key)) continue;

            seen.add(key);
            if (!changes[uri]) {
                changes[uri] = [];
            }
            changes[uri].push({
                range,
                newText: name
            });
        }
        return { changes };
    }


    public loadVariables(file: AventusGlobalSCSSFile, uri: string): void {
        let document = file.file.documentUser;
        let result: { [name: string]: GlobalCSSVariable } = {};
        const _loadCustomProperty = (node: Node) => {
            if (node.type == NodeType.CustomPropertyDeclaration) {
                let nodeParent: Node | null = node;
                while (nodeParent && nodeParent["selectors"] == undefined) {
                    nodeParent = nodeParent.parent;
                }
                if (nodeParent) {
                    const selectors = nodeParent["selectors"] as Node;
                    if (selectors.getChildren().some(selector => selector.getText().trim() === ":root")) {
                        let propertyNode = node.getChild(0);
                        let expressionNode = node.getChild(1);
                        if (propertyNode && expressionNode) {
                            let propName = propertyNode.getText();
                            if (propName.startsWith("--")) {
                                if (!result[propName] || document.offsetAt(result[propName].range.start) < propertyNode.offset) {
                                    result[propName] = {
                                        name: propName,
                                        uri: uri,
                                        range: {
                                            start: document.positionAt(propertyNode.offset),
                                            end: document.positionAt(propertyNode.end),
                                        },
                                        value: expressionNode.getText()
                                    }
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

        const doc = getSCSSLanguageService().parseStylesheet(document);
        _loadCustomProperty(doc as Node);

        this.variablesByUri[uri] = Object.values(result);
        this.reloadVariables();
    }
    private reloadVariables() {
        this.variablesByName = {};
        for (let uri in this.variablesByUri) {
            for (let varInfo of this.variablesByUri[uri]) {
                if (!this.variablesByName[varInfo.name]) {
                    this.variablesByName[varInfo.name] = varInfo;
                }
            }

        }
    }
    public removeVariables(uri: string) {
        delete this.variablesByUri[uri];
        this.reloadVariables();
    }
    public getDefinition(varName: string): GlobalCSSVariable | null {
        return this.variablesByName[varName];
    }
}




