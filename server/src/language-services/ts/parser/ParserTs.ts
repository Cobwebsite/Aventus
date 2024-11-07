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
    VariableDeclaration,
    SourceFile
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
import { ImportInfo } from './ImportInfo';


export class ParserTs {
    private static waitingUri: { [uri: string]: (() => void)[] } = {};
    public static parsedDoc: { [uri: string]: { version: number, result: ParserTs } } = {};
    public static parse(document: AventusFile, isLib: boolean, build: Build): ParserTs {
        if (ParserTs.parsedDoc[document.uri]) {
            if (this.parsedDoc[document.uri].version == document.versionInternal) {
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
        if (ParserTs.currentParsingDoc.importsLocal[name]) {
            return true;
        }
        if (ParserTs.currentParsingDoc.waitingImports[name]) {
            return true;
        }
        if (ParserTs.currentParsingDoc.npmImports[name]) {
            return true;
        }
        if (ParserTs.currentParsingDoc.packages[name]) {
            return true;
        }
        return false;
    }
    public static hasLocal(name: string): boolean {
        if (!ParserTs.currentParsingDoc) {
            return false;
        }
        if (ParserTs.currentParsingDoc.internalObjects[name]) {
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
    public importsLocal: { [importClassName: string]: ImportInfo } = {};
    public manualImportLocal: { [importClassName: string]: ImportInfo } = {};
    public packages: { [importClassName: string]: { fullname: string } } = {};
    public npmImports: {
        [importClassName: string]: {
            nameInsideLib: string,
            uri: string,
        }
    } = {};
    public npmGeneratedImport: {
        [_package: string]: {
            name: string,
            nameAlias?: string, // actually only for the manual importation from html
            alias?: string,
            // define if the element will be compiled from ts to js
            compiled: boolean,
            onlySrc?: boolean,
            forced: boolean,
        }[]
    } = {};
    public internalObjects: { [name: string]: { fullname: string, isExported: boolean, isStoryExported: boolean, isCompiled: boolean } } = {}
    public waitingImports: { [localName: string]: ((info: BaseInfo) => void)[] } = {};
    public aliases: { [shortName: string]: AliasInfo } = {};
    public variables: { [shortName: string]: VariableInfo } = {};
    public isLib: boolean = false;
    public isReady: boolean = false;
    public build: Build;
    private file: AventusFile;
    public srcFile: SourceFile;

    public npmAliases: { [fullname: string]: string } = {}

    private constructor(file: AventusFile, isLib: boolean, build: Build) {
        this.build = build;
        this.build.npmBuilder.unregister(file.documentUser.uri);
        this.file = file;
        ParserTs.parsedDoc[file.uri] = {
            version: file.versionInternal,
            result: this,
        }

        ParserTs.parsingDocs.push(this);
        this.content = file.documentInternal.getText();
        this._document = file.documentInternal;
        this.isLib = isLib;
        let srcFile = createSourceFile("sample.ts", this.content, ScriptTarget.ESNext, true);
        this.srcFile = srcFile;
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
                        fullname: [...this.currentNamespace, name].join("."),
                        isExported: BaseInfo.isExported(_class),
                        isStoryExported: this.build.buildConfig.stories ? BaseInfo.isStoryExported(_class, this.build) : false,
                        isCompiled: x.kind == SyntaxKind.ClassDeclaration,
                    }
                }
            }
            else if (x.kind == SyntaxKind.EnumDeclaration) {
                let _enum = x as EnumDeclaration;
                let name = _enum.name.getText();
                this.internalObjects[name] = {
                    fullname: [...this.currentNamespace, name].join("."),
                    isExported: BaseInfo.isExported(_enum),
                    isStoryExported: this.build.buildConfig.stories ? BaseInfo.isStoryExported(_enum, this.build) : false,
                    isCompiled: true,
                }
            }
            else if (x.kind == SyntaxKind.TypeAliasDeclaration) {
                let _alias = x as TypeAliasDeclaration;
                let name = _alias.name.getText();
                this.internalObjects[name] = {
                    fullname: [...this.currentNamespace, name].join("."),
                    isExported: BaseInfo.isExported(_alias),
                    isStoryExported: this.build.buildConfig.stories ? BaseInfo.isStoryExported(_alias, this.build) : false,
                    isCompiled: false,
                }
            }
            else if (x.kind == SyntaxKind.FunctionDeclaration) {
                let _function = x as FunctionDeclaration;
                if (_function.name) {
                    let name = _function.name.getText();
                    this.internalObjects[name] = {
                        fullname: [...this.currentNamespace, name].join("."),
                        isExported: BaseInfo.isExported(_function),
                        isStoryExported: this.build.buildConfig.stories ? BaseInfo.isStoryExported(_function, this.build) : false,
                        isCompiled: true,
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
                            fullname: [...this.currentNamespace, name].join("."),
                            isExported: BaseInfo.isExported(_varStatement),
                            isStoryExported: this.build.buildConfig.stories ? BaseInfo.isStoryExported(_varStatement, this.build) : false,
                            isCompiled: true
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


    private loadImport(node: ImportDeclaration) {
        // this will auto register on the right place
        ImportInfo.Parse(node, this.file, this);
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
            if (this.classes[classInfo.name]) {
                if (classInfo.isInterface) {
                    this.classes[classInfo.name].mergeClassInfo(classInfo)
                }
                else {
                    classInfo.mergeClassInfo(this.classes[classInfo.name]);
                    this.classes[classInfo.name] = classInfo;
                }
            }
            else {
                this.classes[classInfo.name] = classInfo;
            }
            this.defineStorie(this.classes[classInfo.name]);
        }
    }
    private loadFunction(node: FunctionDeclaration) {
        if (node.name) {
            let functionInfo = new FunctionInfo(node, this.currentNamespace, this);
            this.defineStorie(functionInfo);
            this.functions[functionInfo.name] = functionInfo;
        }
    }
    private loadEnum(node: EnumDeclaration) {
        let enumInfo = new EnumInfo(node, this.currentNamespace, this);
        this.defineStorie(enumInfo);
        this.enums[enumInfo.name] = enumInfo;
    }
    private loadAlias(node: TypeAliasDeclaration) {
        let aliasInfo = new AliasInfo(node, this.currentNamespace, this);
        this.defineStorie(aliasInfo);
        this.aliases[aliasInfo.name] = aliasInfo;
    }

    private loadVariableStatement(node: VariableStatement) {
        let isExported = BaseInfo.isExported(node);
        for (let declaration of node.declarationList.declarations) {
            if (declaration.kind == SyntaxKind.VariableDeclaration) {
                declaration['jsDoc'] = node['jsDoc'];
                this.loadVariable(declaration as VariableDeclaration, node);
            }
        }
    }
    private loadVariable(node: VariableDeclaration, statement: VariableStatement) {
        let variableInfo = new VariableInfo(node, this.currentNamespace, this, statement);
        this.defineStorie(variableInfo);
        this.variables[variableInfo.name] = variableInfo;
    }

    private defineStorie(info: BaseInfo) {
        info.loadStorieContent();
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

    public getBaseInfoFullName(fullName: string): BaseInfo | null {
        const name: string = fullName.split(".").pop() ?? fullName;
        return this.getBaseInfo(name);
    }

    public registerGeneratedImport(options: { uri: string, name: string, compiled: boolean, alias: string, onlySrc?: boolean, nameAlias?: string, forced: boolean }) {
        if (!this.build.hasNpmOutput) return;

        const { uri, name, compiled, alias, onlySrc, nameAlias, forced } = options;
        const realAlias = name == alias ? undefined : alias;
        if (!this.npmGeneratedImport[uri]) {
            this.npmGeneratedImport[uri] = [{
                name: name,
                nameAlias,
                compiled: compiled,
                alias: realAlias,
                onlySrc,
                forced
            }];
        }
        else {
            let index = this.npmGeneratedImport[uri].findIndex(p => p.name == name);
            if (index == -1) {
                this.npmGeneratedImport[uri].push({
                    name: name,
                    nameAlias,
                    compiled: compiled,
                    alias: realAlias,
                    onlySrc,
                    forced
                });
            }
        }
    }

    public getNpmReplacementName(fromName: string, fullName: string): string {
        return this.build.getNpmReplacementName(fromName, fullName);
        // if (this.npmAliases[fullName]) {
        //     return this.npmAliases[fullName];
        // }

        // const splitted = fullName.split(".");
        // let last = splitted[splitted.length - 1];
        // let done = false;
        // let i = 0;
        // while (!done) {

        //     if (this.internalObjects[last]) {
        //         i++;
        //         last = splitted[splitted.length - 1] + i;
        //     }
        //     else {
        //         let noSame = true;
        //         for (let key in this.npmAliases) {
        //             if (key.endsWith(last)) {
        //                 noSame = false;
        //                 i++;
        //                 last = splitted[splitted.length - 1] + i;
        //                 break;
        //             }
        //         }
        //         if (noSame) {
        //             this.npmAliases[fullName] = last;
        //             done = true;
        //         }
        //     }

        // }
        // return this.npmAliases[fullName];
    }
}