import { existsSync, readFileSync } from "fs";
import { normalize } from "path";
import {
    Node,
    forEachChild,
    SyntaxKind,
    ImportDeclaration,
    ModuleDeclaration,
    ClassDeclaration,
    EnumDeclaration,
    flattenDiagnosticMessageText,
    createSourceFile,
    ScriptTarget,
    NodeFlags,
    InterfaceDeclaration,
    TypeAliasDeclaration,
    FunctionDeclaration,
    NamespaceImport
} from "typescript";
import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusLanguageId } from '../../../definition';
import { FilesManager } from '../../../files/FilesManager';
import { getFolder, pathToUri, uriToPath } from '../../../tools';
import { AliasInfo } from './AliasInfo';
import { BaseInfo } from "./BaseInfo";
import { ClassInfo } from "./ClassInfo";
import { EnumInfo } from './EnumInfo';
import { NamespaceInfo } from './NamespaceInfo';
import { hasFlag } from "./tools";
import { FunctionInfo } from './FunctionInfo';


export class ParserTs {
    private static parsedDoc: { [uri: string]: { version: number, result: ParserTs } } = {};
    public static parse(document: TextDocument, isLib: boolean): ParserTs {
        if (ParserTs.parsedDoc[document.uri]) {
            if (this.parsedDoc[document.uri].version == document.version) {
                return this.parsedDoc[document.uri].result;
            }
        }
        new ParserTs(document, isLib);
        return ParserTs.parsedDoc[document.uri].result;
    }
    private static currentParsingDoc: ParserTs | null;
    public static addError(start: number, end: number, msg: string) {
        if (this.currentParsingDoc && !this.currentParsingDoc.isLib) {
            let error = {
                range: Range.create(this.currentParsingDoc.document.positionAt(start), this.currentParsingDoc.document.positionAt(end)),
                severity: DiagnosticSeverity.Error,
                source: AventusLanguageId.TypeScript,
                message: flattenDiagnosticMessageText(msg, '\n')
            }
            this.currentParsingDoc.errors.push(error);
        }
    }
    public static addWarning(start: number, end: number, msg: string) {
        if (this.currentParsingDoc && !this.currentParsingDoc.isLib) {
            let error = {
                range: Range.create(this.currentParsingDoc.document.positionAt(start), this.currentParsingDoc.document.positionAt(end)),
                severity: DiagnosticSeverity.Warning,
                source: AventusLanguageId.TypeScript,
                message: flattenDiagnosticMessageText(msg, '\n')
            }
            this.currentParsingDoc.errors.push(error);
        }
    }
    public static getBaseInfo(name: string): BaseInfo | null {
        for (let uri in this.parsedDoc) {
            if (this.parsedDoc[uri].result.classes[name]) {
                return this.parsedDoc[uri].result.classes[name];
            }
            if (this.parsedDoc[uri].result.aliases[name]) {
                return this.parsedDoc[uri].result.aliases[name];
            }
            if (this.parsedDoc[uri].result.enums[name]) {
                return this.parsedDoc[uri].result.enums[name];
            }
            if (this.parsedDoc[uri].result.functions[name]) {
                return this.parsedDoc[uri].result.functions[name];
            }
        }
        return null;
    }


    private content: string;
    public errors: Diagnostic[] = [];
    private _document: TextDocument;
    public get document() {
        return this._document;
    }
    private currentNamespace: string[] = [];
    public namespaces: NamespaceInfo[] = [];
    public classes: { [shortName: string]: ClassInfo } = {};
    public functions: { [shortName: string]: FunctionInfo } = {};
    public enums: { [shortName: string]: EnumInfo } = {};
    public imports: { [importClassName: string]: BaseInfo } = {};
    public npmImports: {
        [importClassName: string]: {
            nameInsideLib: string,
            uri: string,
        }
    } = {};
    public aliases: { [shortName: string]: AliasInfo } = {};
    public isLib: boolean = false;
    public isReady: boolean = false;

    private constructor(document: TextDocument, isLib: boolean) {
        ParserTs.parsedDoc[document.uri] = {
            version: document.version,
            result: this,
        }
        ParserTs.currentParsingDoc = this;
        this.content = document.getText();
        this._document = document;
        this.isLib = isLib;
        this.loadRoot(createSourceFile("sample.ts", this.content, ScriptTarget.ESNext, true));
        ParserTs.currentParsingDoc = null;
        this.isReady = true;
        for (let cb of this.readyCb) {
            cb();
        }
    }

    private readyCb: (() => void)[] = [];
    public onReady(cb: () => void) {
        if (!this.isReady) {
            this.readyCb.push(cb);
        }
    }

    private loadRoot(node: Node) {
        forEachChild(node, x => {
            if (x.kind == SyntaxKind.ImportDeclaration) {
                this.loadImport(x as ImportDeclaration);
            }
            else if (x.kind == SyntaxKind.ModuleDeclaration) {
                this.loadNamespace(x as ModuleDeclaration);
            }
            else if (x.kind == SyntaxKind.ClassDeclaration) {
                this.loadClass(x as ClassDeclaration);
            }
            else if (x.kind == SyntaxKind.InterfaceDeclaration) {
                this.loadClass(x as InterfaceDeclaration);
            }
            else if (x.kind == SyntaxKind.EnumDeclaration) {
                this.loadEnum(x as EnumDeclaration);
            }
            else if (x.kind == SyntaxKind.TypeAliasDeclaration) {
                this.loadAlias(x as TypeAliasDeclaration);
            }
            else if (x.kind == SyntaxKind.FunctionDeclaration) {
                this.loadFunction(x as FunctionDeclaration);
            }
            else if (x.kind == SyntaxKind.VariableDeclaration) {
                this.errors.push({
                    range: Range.create(this.document.positionAt(x.getStart()), this.document.positionAt(x.getEnd())),
                    severity: DiagnosticSeverity.Error,
                    source: AventusLanguageId.TypeScript,
                    message: flattenDiagnosticMessageText("error => can't use a variable outside a class, create a static lib instead", '\n')
                })
            }
            else if (x.kind == SyntaxKind.ModuleBlock) {
                this.errors.push({
                    range: Range.create(this.document.positionAt(x.getStart()), this.document.positionAt(x.getEnd())),
                    severity: DiagnosticSeverity.Error,
                    source: AventusLanguageId.TypeScript,
                    message: flattenDiagnosticMessageText("error => can't use a module, use namespace instead", '\n')
                })
            }
            else if (x.kind == SyntaxKind.EndOfFileToken) {

            }
            else {
                //console.log("--- " + syntaxName[x.kind]);
            }
        })
    }


    private loadImport(node: ImportDeclaration) {
        if (node.importClause) {
            if (node.importClause.namedBindings) {
                if (node.importClause.namedBindings.kind == SyntaxKind.NamespaceImport) {
                    let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
                    if (moduleName.startsWith(".")) {
                        this.errors.push({
                            range: Range.create(this.document.positionAt(node.getStart()), this.document.positionAt(node.getEnd())),
                            severity: DiagnosticSeverity.Error,
                            source: AventusLanguageId.TypeScript,
                            message: flattenDiagnosticMessageText("error can't use namespace import", '\n')
                        })
                    }
                    else {
                        let name = node.importClause.namedBindings.name.getText();
                        this.npmImports[name] = {
                            uri: moduleName,
                            nameInsideLib: "*"
                        };
                    }
                }
                else if (node.importClause.namedBindings.kind == SyntaxKind.NamedImports) {
                    let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
                    // it's a local import
                    if (moduleName.startsWith(".")) {
                        for (let element of node.importClause.namedBindings.elements) {
                            if (element.propertyName) {
                                // it's a rename
                                this.errors.push({
                                    range: Range.create(this.document.positionAt(node.getStart()), this.document.positionAt(node.getEnd())),
                                    severity: DiagnosticSeverity.Error,
                                    source: AventusLanguageId.TypeScript,
                                    message: flattenDiagnosticMessageText("error can't use renamed import", '\n')
                                })
                            }
                            else {
                                let localName = element.name.getText();
                                let moduleUri = pathToUri(normalize(getFolder(uriToPath(this.document.uri)) + '/' + moduleName));
                                if (!ParserTs.parsedDoc[moduleUri]) {
                                    let file = FilesManager.getInstance().getByUri(moduleUri);
                                    if (file) {
                                        ParserTs.parse(file.document, false);
                                    }
                                    else {
                                        let modulePath = uriToPath(moduleUri);
                                        let content = existsSync(modulePath) ? readFileSync(modulePath, 'utf8') : ''
                                        ParserTs.parse(TextDocument.create(moduleUri, AventusLanguageId.TypeScript, 1, content), false);
                                    }
                                }
                                if (ParserTs.parsedDoc[moduleUri].result.isReady) {
                                    let baseInfoLinked = ParserTs.parsedDoc[moduleUri].result.getBaseInfo(localName);
                                    if (baseInfoLinked) {
                                        this.imports[localName] = baseInfoLinked
                                    }
                                    else {
                                        console.log("Can't load " + moduleUri + " " + localName + " from " + this.document.uri);
                                    }
                                }
                                else {
                                    ParserTs.parsedDoc[moduleUri].result.onReady(() => {
                                        let baseInfoLinked = ParserTs.parsedDoc[moduleUri].result.getBaseInfo(localName);
                                        if (baseInfoLinked) {
                                            this.imports[localName] = baseInfoLinked
                                            for (let className in this.classes) {
                                                let _class = this.classes[className]
                                                for (let dependance of _class.dependances) {
                                                    if (dependance.uri == "@external" && dependance.fullName == localName) {
                                                        dependance.uri = "@local";
                                                        dependance.fullName = "$namespace$" + baseInfoLinked.fullName;
                                                        dependance.isStrong = false;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            console.log("Can't load " + moduleUri + " " + localName + " from " + this.document.uri);
                                        }
                                    })
                                }
                            }
                        }
                    }
                    else {

                        for (let element of node.importClause.namedBindings.elements) {
                            let name = element.name.getText();
                            let nameInsideLib = name;
                            if (element.propertyName) {
                                nameInsideLib = element.propertyName.getText();
                            }
                            this.npmImports[name] = {
                                uri: moduleName,
                                nameInsideLib: nameInsideLib
                            };

                        }
                    }
                }
            }
        }
    }

    private loadNamespace(node: ModuleDeclaration) {
        if (hasFlag(node.flags, NodeFlags.Namespace) && node.body) {
            this.namespaces.push(new NamespaceInfo(node));
            this.currentNamespace.push(node.name.getText());
            this.loadRoot(node.body);
            this.currentNamespace.splice(this.currentNamespace.length - 1, 1);
        }
        else if (hasFlag(node.flags, NodeFlags.GlobalAugmentation) && node.body) {
            this.loadRoot(node.body);
        }
    }

    private loadClass(node: ClassDeclaration | InterfaceDeclaration) {
        if (node.name) {
            let classInfo = new ClassInfo(node, this.currentNamespace, this);
            this.classes[classInfo.name] = classInfo;
        }
    }
    private loadFunction(node: FunctionDeclaration) {
        if (node.name) {
            let functionInfo = new FunctionInfo(node, this.currentNamespace, this);
            this.functions[functionInfo.name] = functionInfo;
        }
    }
    private loadEnum(node: EnumDeclaration) {
        let enumInfo = new EnumInfo(node, this.currentNamespace, this);
        this.enums[enumInfo.name] = enumInfo;
    }
    private loadAlias(node: TypeAliasDeclaration) {
        let aliasInfo = new AliasInfo(node, this.currentNamespace, this);
        this.aliases[aliasInfo.name] = aliasInfo;
    }

    public getBaseInfo(name: string): BaseInfo | null {
        if (this.classes[name]) {
            return this.classes[name];
        }
        if (this.aliases[name]) {
            return this.aliases[name];
        }
        if (this.enums[name]) {
            return this.enums[name];
        }
        return null;
    }
}