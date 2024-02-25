import postcss from 'postcss';
import * as postcssSorting from 'postcss-sorting';
import * as postcssScss from 'postcss-scss';
import { CSSFormatConfiguration, getSCSSLanguageService, LanguageService, TextDocument } from "vscode-css-languageservice";
import { CodeAction, CodeActionContext, CompletionList, Definition, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit } from "vscode-languageserver";
import { AventusFile } from '../../files/AventusFile';
import { getNodePath, Node, NodeType, CustomCssProperty } from './helper/CSSNode';
import { AventusGlobalSCSSFile } from './GlobalFile';


export type GlobalCSSVariable = {
    name: string,
    range: Range,
    uri: string,
    value: string
}

export class AventusGlobalSCSSLanguageService {
    private languageService: LanguageService;
    private variablesByUri: { [uri: string]: GlobalCSSVariable[] } = {}
    public variablesByName: { [name: string]: GlobalCSSVariable } = {}


    public constructor() {
        this.languageService = getSCSSLanguageService();
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

    public async findDefinition(file: AventusFile, position: Position): Promise<Definition | null> {
        return this.languageService.findDefinition(file.documentUser, position, this.languageService.parseStylesheet(file.documentUser))
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
        let docSCSS = this.languageService.parseStylesheet(file.documentUser)
        return this.languageService.findReferences(file.documentUser, position, docSCSS);
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
                    let selectorText = nodeParent["selectors"].getText();
                    if (selectorText == ":root") {
                        let propertyNode = node.getChild(0);
                        let expressionNode = node.getChild(1);
                        if (propertyNode && expressionNode) {
                            let propName = propertyNode.getText();
                            if (propName.startsWith("--")) {
                                propertyNode.offset
                                if (!result[propName]) {
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

        let doc = getSCSSLanguageService().parseStylesheet(document);
        let path = getNodePath(doc as Node, 0);
        for (let pathTemp of path) {
            _loadCustomProperty(pathTemp);
        }

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




