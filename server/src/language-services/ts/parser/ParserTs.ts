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
    NamespaceImport,
    Identifier,
    VariableStatement,
    VariableDeclaration
} from "typescript";
import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusExtension, AventusLanguageId } from '../../../definition';
import { FilesManager } from '../../../files/FilesManager';
import { getFolder, pathToUri, uriToPath } from '../../../tools';
import { AliasInfo } from './AliasInfo';
import { BaseInfo } from "./BaseInfo";
import { ClassInfo } from "./ClassInfo";
import { EnumInfo } from './EnumInfo';
import { NamespaceInfo } from './NamespaceInfo';
import { hasFlag } from "./tools";
import { FunctionInfo } from './FunctionInfo';
import { VariableInfo } from './VariableInfo';
import { Build } from '../../../project/Build';
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';


export class ParserTs {
    private static waitingUri: { [uri: string]: (() => void)[] } = {};
    private static parsedDoc: { [uri: string]: { version: number, result: ParserTs } } = {};
    public static parse(document: AventusFile, isLib: boolean, build: Build): ParserTs {
        if (ParserTs.parsedDoc[document.uri]) {
            if (this.parsedDoc[document.uri].version == document.version) {
                return this.parsedDoc[document.uri].result;
            }
        }
        new ParserTs(document, isLib, build);
        return ParserTs.parsedDoc[document.uri].result;
    }
    private static parsingDocs: ParserTs[] = [];
    private static get currentParsingDoc(): ParserTs | null {
        if (this.parsingDocs.length > 0) {
            return this.parsingDocs[this.parsingDocs.length - 1];
        }
        return null;
    }
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
            let temp = this.parsedDoc[uri].result.getBaseInfo(name);
            if (temp) {
                return temp;
            }
        }
        return null;
    }
    public static hasImport(name: string): boolean {
        if (!ParserTs.currentParsingDoc) {
            return false;
        }
        if (ParserTs.currentParsingDoc.imports[name]) {
            return true;
        }
        if (ParserTs.currentParsingDoc.waitingImports[name]) {
            return true;
        }
        if (ParserTs.currentParsingDoc.npmImports[name]) {
            return true;
        }
        return false;
    }
    public static hasLocal(name: string): boolean {
        if (!ParserTs.currentParsingDoc) {
            return false;
        }
        if(ParserTs.currentParsingDoc.internalObjects[name]) {
            return true;
        }
        // if (ParserTs.currentParsingDoc.enums[name]) {
        //     return true;
        // }
        // if (ParserTs.currentParsingDoc.classes[name]) {
        //     return true;
        // }
        // if (ParserTs.currentParsingDoc.aliases[name]) {
        //     return true;
        // }
        // if (ParserTs.currentParsingDoc.functions[name]) {
        //     return true;
        // }
        // if (ParserTs.currentParsingDoc.variables[name]) {
        //     return true;
        // }
        return false
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
    public internalObjects: { [name: string]: { fullname: string } } = {}
    public waitingImports: { [localName: string]: ((info: BaseInfo) => void)[] } = {};
    public aliases: { [shortName: string]: AliasInfo } = {};
    public variables: { [shortName: string]: VariableInfo } = {};
    public isLib: boolean = false;
    public isReady: boolean = false;
    private build: Build;
    private file: AventusFile;

    private constructor(file: AventusFile, isLib: boolean, build: Build) {
        this.build = build;
        this.build.npmBuilder.unregister(file.document.uri);
        this.file = file;
        ParserTs.parsedDoc[file.uri] = {
            version: file.version,
            result: this,
        }

        ParserTs.parsingDocs.push(this);
        this.content = file.document.getText();
        this._document = file.document;
        this.isLib = isLib;
        let srcFile = createSourceFile("sample.ts", this.content, ScriptTarget.ESNext, true);
        this.quickLoadRoot(srcFile);
        this.loadRoot(srcFile);
        ParserTs.parsingDocs.pop();
        this.isReady = true;
        for (let cb of this.readyCb) {
            cb();
        }
        this.readyCb = [];

        if (ParserTs.waitingUri[file.uri]) {
            for (let cb of ParserTs.waitingUri[file.uri]) {
                cb();
            }
            delete ParserTs.waitingUri[file.uri];
        }
    }

    private readyCb: (() => void)[] = [];
    public onReady(cb: () => void) {
        if (!this.isReady) {
            this.readyCb.push(cb);
        }
    }

    private quickLoadRoot(node: Node) {
        forEachChild(node, x => {
            if (x.kind == SyntaxKind.ModuleDeclaration) {
                let _namespace = x as ModuleDeclaration
                if (hasFlag(_namespace.flags, NodeFlags.Namespace) && _namespace.body) {
                    this.currentNamespace.push(_namespace.name.getText());
                    this.quickLoadRoot(_namespace);
                    this.currentNamespace.splice(this.currentNamespace.length - 1, 1);
                }
                else if (hasFlag(_namespace.flags, NodeFlags.GlobalAugmentation) && _namespace.body) {
                    this.quickLoadRoot(_namespace);
                }
            }
            else if (x.kind == SyntaxKind.ClassDeclaration || x.kind == SyntaxKind.InterfaceDeclaration) {
                let _class = x as ClassDeclaration | InterfaceDeclaration
                if (_class.name) {
                    let name = _class.name.getText();
                    this.internalObjects[name] = {
                        fullname: [...this.currentNamespace, name].join(".")
                    }
                }
            }
            else if (x.kind == SyntaxKind.EnumDeclaration) {
                let _enum = x as EnumDeclaration;
                let name = _enum.name.getText();
                this.internalObjects[name] = {
                    fullname: [...this.currentNamespace, name].join(".")
                }
            }
            else if (x.kind == SyntaxKind.TypeAliasDeclaration) {
                let _alias = x as TypeAliasDeclaration;
                let name = _alias.name.getText();
                this.internalObjects[name] = {
                    fullname: [...this.currentNamespace, name].join(".")
                }
            }
            else if (x.kind == SyntaxKind.FunctionDeclaration) {
                let _function = x as FunctionDeclaration;
                if (_function.name) {
                    let name = _function.name.getText();
                    this.internalObjects[name] = {
                        fullname: [...this.currentNamespace, name].join(".")
                    }
                }
            }
            else if (x.kind == SyntaxKind.VariableStatement) {
                // this.loadVariableStatement(x as VariableStatement);
                let _varStatement = x as VariableStatement;
                for (let declaration of _varStatement.declarationList.declarations) {
                    if (declaration.kind == SyntaxKind.VariableDeclaration) {
                        let _var = declaration as VariableDeclaration;
                        let name = _var.name.getText();
                        this.internalObjects[name] = {
                            fullname: [...this.currentNamespace, name].join(".")
                        }
                    }
                }
                
            }
            else if (x.kind == SyntaxKind.ModuleBlock) {
                this.quickLoadRoot(x);
            }
        })
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
            else if (x.kind == SyntaxKind.VariableStatement) {
                this.loadVariableStatement(x as VariableStatement);
            }
            else if (x.kind == SyntaxKind.ModuleBlock) {
                this.loadRoot(x);
            }
            else if (x.kind == SyntaxKind.EndOfFileToken) {

            }
            else {
                //console.log("--- " + syntaxName[x.kind]);
            }
        })
    }


    private asyncImportLocal(moduleUri: string, localName: string, identifier: Identifier) {
        let baseInfoLinked = ParserTs.parsedDoc[moduleUri].result.getBaseInfo(localName);
        if (baseInfoLinked) {
            this.imports[localName] = baseInfoLinked;
            let types = [this.classes, this.enums, this.aliases, this.functions, this.variables];
            for (let type of types) {
                for (let name in type) {
                    let _class = type[name]
                    for (let dependance of _class.dependances) {
                        if (dependance.uri == "@external" && dependance.fullName == localName) {
                            dependance.uri = "@local";
                            dependance.fullName = "$namespace$" + baseInfoLinked.fullName;
                            //dependance.isStrong = false;
                        }
                    }
                }
            }
            for (let cb of this.waitingImports[localName]) {
                cb(baseInfoLinked);
            }
            delete this.waitingImports[localName]
        }
        else {
            ParserTs.addError(identifier.getStart(), identifier.getEnd(), "Can't load " + moduleUri + " " + localName + " from " + this.document.uri)
        }
    }
    private importLocal(moduleName: string, identifier: Identifier) {
        let localName = identifier.getText();
        let moduleUri = pathToUri(normalize(getFolder(uriToPath(this.document.uri)) + '/' + moduleName));

        if (moduleUri.endsWith(AventusExtension.Component)) {
            if (this.waitingImports[localName]) {
                return;
            }
            this.waitingImports[localName] = [];
            if (!ParserTs.waitingUri[moduleUri]) {
                ParserTs.waitingUri[moduleUri] = [];
            }
            ParserTs.waitingUri[moduleUri].push(() => {
                this.asyncImportLocal(moduleUri, localName, identifier);
            })
            return;
        }

        if (!ParserTs.parsedDoc[moduleUri]) {
            let file = FilesManager.getInstance().getByUri(moduleUri);
            if (file) {
                ParserTs.parse(file, false, this.build);
            }
            else {
                let modulePath = uriToPath(moduleUri);
                let content = existsSync(modulePath) ? readFileSync(modulePath, 'utf8') : '';
                let avFile = new InternalAventusFile(TextDocument.create(moduleUri, AventusLanguageId.TypeScript, 1, content));
                ParserTs.parse(avFile, false, this.build);
            }
        }

        if (ParserTs.parsedDoc[moduleUri]?.result.isReady) {
            let baseInfoLinked = ParserTs.parsedDoc[moduleUri].result.getBaseInfo(localName);
            if (baseInfoLinked) {
                this.imports[localName] = baseInfoLinked
            }
            else {
                ParserTs.addError(identifier.getStart(), identifier.getEnd(), "Can't load " + moduleUri + " " + localName + " from " + this.document.uri)
            }
        }
        else {
            if (this.waitingImports[localName]) {
                return;
            }
            this.waitingImports[localName] = [];
            ParserTs.parsedDoc[moduleUri].result.onReady(() => {
                this.asyncImportLocal(moduleUri, localName, identifier);
            })
        }
    }

    private loadImport(node: ImportDeclaration) {
        if (node.importClause) {
            if (node.importClause.namedBindings) {
                if (node.importClause.namedBindings.kind == SyntaxKind.NamespaceImport) {
                    let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
                    moduleName = this.build.project.resolveAlias(moduleName, this.file);
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
                        if (!node.importClause.isTypeOnly) {
                            this.build.npmBuilder.register(this.document.uri, {
                                libName: "*",
                                uri: moduleName,
                                alias: name
                            })
                            this.npmImports[name] = {
                                uri: moduleName,
                                nameInsideLib: "*"
                            };
                        }
                    }
                }
                else if (node.importClause.namedBindings.kind == SyntaxKind.NamedImports) {
                    let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
                    moduleName = this.build.project.resolveAlias(moduleName, this.file);
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
                                this.importLocal(moduleName, element.name);
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
                            if (!node.importClause.isTypeOnly && !element.isTypeOnly) {
                                this.build.npmBuilder.register(this.document.uri, {
                                    libName: nameInsideLib,
                                    uri: moduleName,
                                    alias: name
                                })
                                this.npmImports[name] = {
                                    uri: moduleName,
                                    nameInsideLib: nameInsideLib
                                };
                            }

                        }
                    }
                }
            }
            else if (node.importClause.name) {
                let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
                moduleName = this.build.project.resolveAlias(moduleName, this.file);
                let name = node.importClause.name.getText();
                if (moduleName.startsWith(".")) {
                    this.importLocal(moduleName, node.importClause.name);
                }
                else {
                    if (!node.importClause.isTypeOnly) {
                        // TODO check if only here but it should be a default import
                        this.build.npmBuilder.register(this.document.uri, {
                            libName: 'default',
                            uri: moduleName,
                            alias: name
                        })
                        this.npmImports[name] = {
                            uri: moduleName,
                            nameInsideLib: 'default'
                        };
                    }
                }
            }
        }
    }

    private loadNamespace(node: ModuleDeclaration) {
        if (hasFlag(node.flags, NodeFlags.Namespace) && node.body) {
            this.namespaces.push(new NamespaceInfo(node));
            this.currentNamespace.push(node.name.getText());
            this.loadRoot(node);
            this.currentNamespace.splice(this.currentNamespace.length - 1, 1);
        }
        else if (hasFlag(node.flags, NodeFlags.GlobalAugmentation) && node.body) {
            this.loadRoot(node);
        }
        else {
            this.errors.push({
                range: Range.create(this.document.positionAt(node.getStart()), this.document.positionAt(node.getEnd())),
                severity: DiagnosticSeverity.Error,
                source: AventusLanguageId.TypeScript,
                message: flattenDiagnosticMessageText("Can't use a module, use namespace instead", '\n')
            })
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

    private loadVariableStatement(node: VariableStatement) {
        let isExported = BaseInfo.isExported(node);
        for (let declaration of node.declarationList.declarations) {
            if (declaration.kind == SyntaxKind.VariableDeclaration) {
                this.loadVariable(declaration as VariableDeclaration, isExported);
            }
        }
    }
    private loadVariable(node: VariableDeclaration, isExported: boolean) {
        let variableInfo = new VariableInfo(node, this.currentNamespace, this, isExported);
        this.variables[variableInfo.name] = variableInfo;
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
        if (this.functions[name]) {
            return this.functions[name];
        }
        if (this.variables[name]) {
            return this.variables[name];
        }
        return null;
    }
}