import { Node, CallExpression, ClassDeclaration, EnumDeclaration, FunctionDeclaration, InterfaceDeclaration, SyntaxKind, TypeAliasDeclaration, TypeNode, TypeReferenceNode, forEachChild, ExpressionWithTypeArguments, NewExpression, PropertyAccessExpression, VariableStatement, VariableDeclaration, MethodDeclaration, getTokenAtPosition, isTypeReferenceNode, LiteralTypeNode, PropertySignature, FunctionTypeNode, TypeParameterDeclaration, ParameterDeclaration, IndexSignatureDeclaration, TypeLiteralNode, Identifier } from "typescript";
import { ParserTs } from './ParserTs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BaseLibInfo } from './BaseLibInfo';
import { TypeInfo } from './TypeInfo';
import { DecoratorInfo } from './DecoratorInfo';
import { DependenciesDecorator } from './decorators/DependenciesDecorator';
import { GenericServer } from '../../../GenericServer';
import { InternalDecorator } from './decorators/InternalDecorator';
import { Build } from '../../../project/Build';
import { IStoryContentGeneric, IStoryContentParameter, IStoryContentTypeResult, IStoryContentTypeResultFunction, IStoryContentTypeResultFunctionParameter, IStoryContentTypeResultIntersection, IStoryContentTypeResultObject, IStoryContentTypeResultSimple, IStoryContentTypeResultTupple, IStoryContentTypeResultUnion, IStoryExport, IStoryGeneric, IStoryContentTypeResultIndexAccess, IStoryContentTypeResultMappedType, IStoryContentTypeResultInfer, IStoryContentTypeResultTypeOperator, IStoryContentTypeResultConditional } from '@aventusjs/storybook';
import { StorybookDecorator } from './decorators/StorybookDecorator';
import { DocumentationInfo } from './DocumentationInfo';
import { join, normalize } from 'path';
import { md5, pathToUri, simplifyUri, uriToPath } from '../../../tools';
import { Storie } from '../../../project/storybook/Stories';
import { AventusExtension } from '../../../definition';
import { CompileTsResult } from '../LanguageService';
import { ImportInfo } from './ImportInfo';
import { DeprecatedDecorator } from './decorators/DeprecatedDecorator';


export enum InfoType {
    none,
    class,
    classData,
    interface,
    function,
    variable,
    enum
}

type DependencyType = {
    fullName: string,
    uri: string, // @local (same file), @external (lib), @npm (npm), file uri (same build) 
    isStrong: boolean
}

export type SupportedRootNodes = ClassDeclaration | EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration | FunctionDeclaration | VariableDeclaration | MethodDeclaration

export type DependencyInfo = {
    replacement: string | null,
    docReplacement: string | null,
    hotReloadReplacement: string | null,
    npmReplacement: string | null,
    typeRemplacement: string | null,
    locations: { [key: string]: { start: number, end: number, isType: boolean, isNpm?: boolean } }
}

export abstract class BaseInfo {
    private static infoByShortName: { [shortName: string]: BaseInfo } = {};
    private static infoByFullName: { [shortName: string]: BaseInfo } = {};
    public static getInfoByShortName(shortName: string): BaseInfo | undefined {
        return this.infoByShortName[shortName];
    }
    public static getInfoByFullName(fullName: string, from: BaseInfo): BaseInfo | undefined {
        fullName = fullName.replace(/<.*>/, "");
        let result = this.infoByFullName[fullName];
        if (!result) {
            result = this.infoByFullName[from.fullName.split('.')[0] + "." + fullName];
        }
        return result
    }

    public static isExported(node: ClassDeclaration | EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration | FunctionDeclaration | VariableStatement | MethodDeclaration) {
        if (node.modifiers) {
            for (let modifier of node.modifiers) {
                if (modifier.kind == SyntaxKind.ExportKeyword) {
                    return true;
                }
            }
        }
        return false;
    }
    public static isStoryExported(node: ClassDeclaration | EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration | FunctionDeclaration | VariableStatement | MethodDeclaration, build: Build) {
        if (!build.buildConfig.stories) return false;


        const decorators = DecoratorInfo.buildDecorator(node);
        let decorator = decorators.find(p => p.name == "Storybook");
        if (decorator) {
            const deco = StorybookDecorator.is(decorator);
            if (deco) {
                if (deco.exportType) {
                    return (deco.exportType == 'all' || deco.exportType == 'public' || deco.exportType == 'protected');
                }
                else {
                    return true;
                }
            }
        }
        return build.buildConfig.stories.format == 'all' || build.buildConfig.stories.format == 'public' || build.buildConfig.stories.format == 'protected';
    }

    public name: string = "";
    public nameStart: number = 0;
    public nameEnd: number = 0;
    public start: number = 0;
    public end: number = 0;
    public fullName: string = "";
    public namespace: string = "";
    public decorators: DecoratorInfo[] = [];
    public useNormalDecorator: boolean = false;

    public storieContent?: IStoryExport;
    public storieInject: {
        [_package: string]: string[]
    } = {}
    public storieDecorator?: StorybookDecorator;
    public storyType: 'all' | 'none' | 'public' | 'protected' = 'none';

    // public dependenciesFullName: string[] = [];
    public dependencies: { [name: string]: DependencyType } = {};
    public compiled: string = "";
    public documentation?: DocumentationInfo;
    public isExported: boolean = false;
    public isInternalExported: boolean = false;
    private _parserInfo: ParserTs;
    public content: string = "";
    public deprecated: boolean = false;
    public deprecatedMsg: string = "";
    public compileTransformations: { [key: string]: { newText: string, start: number, end: number } } = {};
    public get compiledContent(): string {
        return BaseInfo.getContent(this.content, this.start, this.end, this.dependenciesLocations, this.compileTransformations);
    }
    public get compiledContentHotReload(): string {
        return BaseInfo.getContentHotReload(this.content, this.start, this.end, this.dependenciesLocations, this.compileTransformations);
    }
    public get compiledContentNpm(): string {
        return BaseInfo.getContentNpm(this.content, this.start, this.end, this.dependenciesLocations, this.compileTransformations);
    }
    public get compiledContentDoc(): string {
        return BaseInfo.getContentDoc(this.content, this.start, this.end, this.dependenciesLocations, this.compileTransformations);
    }
    public get fileUri() {
        return this.document.uri;
    }
    public document: TextDocument;
    private dependenciesPrevented: string[] = [];
    public dependenciesLocations: {
        [name: string]: DependencyInfo
    } = {};

    public infoType: InfoType = InfoType.none;
    public build: Build;
    public willBeCompiled: boolean;

    public get parserInfo() {
        return this._parserInfo;
    }

    constructor(node: SupportedRootNodes, namespaces: string[], parserInfo: ParserTs, autoLoadDepDecorator: boolean = true) {
        this._parserInfo = parserInfo;
        this.document = parserInfo.document;
        this.decorators = DecoratorInfo.buildDecorator(node, this);
        this.dependenciesLocations = {};
        this.build = parserInfo.build;
        this.willBeCompiled = node.kind != SyntaxKind.InterfaceDeclaration && node.kind != SyntaxKind.TypeAliasDeclaration
        if (node.name) {
            this.start = node.getStart();
            this.end = node.getEnd();
            this.name = node.name.getText();
            this.nameStart = node.name.getStart();
            this.nameEnd = node.name.getEnd();
            this.namespace = namespaces.join(".");
            this.fullName = [...namespaces, this.name].join(".");
            this.content = node.getText();

            if (!parserInfo.isExternal) {
                BaseInfo.infoByShortName[this.name] = this;
            }

            let docTemp = new DocumentationInfo(node);
            if (docTemp.hasDoc) {
                this.documentation = docTemp;
            }

            if (autoLoadDepDecorator) {
                this.loadDecorators();
            }
            if (node.kind != SyntaxKind.VariableDeclaration) {
                this.isExported = BaseInfo.isExported(node);
                this.isInternalExported = this.isExported;
                for (let decorator of this.decorators) {
                    let deco = InternalDecorator.is(decorator);
                    if (deco) {
                        this.isExported = false;
                        break;
                    }
                }
            }
            BaseInfo.infoByFullName[this.fullName] = this;
        }
    }

    protected loadDecorators() {
        for (let decorator of this.decorators) {
            let temp = DependenciesDecorator.is(decorator);
            if (temp) {
                for (let dependency of temp.dependencies) {
                    this.addDependencyName(dependency.type, dependency.strong, 0, 0);
                }
            }
            let temp2 = DeprecatedDecorator.is(decorator);
            if (temp2) {
                this.deprecated = true;
                this.deprecatedMsg = temp2.msg;
            }
        }
    }

    protected preventDependencyAdd(name: string) {
        if (!this.dependenciesPrevented.includes(name)) {
            this.dependenciesPrevented.push(name);
        }
    }

    private loadExpression(x: Node, depth2: number = 0, isStrongDependency: boolean = false) {
        GenericServer.debug("***" + depth2 + ". " + x.getText());
        GenericServer.debug(SyntaxKind[x.kind]);
        if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
            this.addDependency(x as ExpressionWithTypeArguments, isStrongDependency);
        }
        else if (x.kind == SyntaxKind.NewExpression) {
            let exp = (x as NewExpression);
            this.loadExpression(exp.expression, depth2 + 1, isStrongDependency);
        }
        else if (x.kind == SyntaxKind.PropertyAccessExpression) {
            let exp = (x as PropertyAccessExpression);
            let txt = exp.name.getText();
            let baseInfo = ParserTs.getBaseInfo(txt);
            if (baseInfo && exp.expression.getText() + "." + txt == baseInfo.fullName) {
                // when static call on external class
                this.addDependencyName(baseInfo.fullName, isStrongDependency, exp.getStart(), exp.getEnd());
            }
            else {
                // when static call on local class
                let localClassName = exp.expression.getText();
                if (localClassName != 'this' && !localClassName.includes('.')) {
                    if (ParserTs.hasLocal(localClassName)) {
                        this.addDependencyName(localClassName, isStrongDependency, exp.expression.getStart(), exp.expression.getEnd());
                    }
                    else if (ParserTs.hasImport(localClassName)) {
                        this.addDependencyName(localClassName, isStrongDependency, exp.expression.getStart(), exp.expression.getEnd());
                    }
                }
            }
            this.loadExpression(exp.expression, depth2 + 1, isStrongDependency);
        }
        else if (x.kind == SyntaxKind.Identifier) {
            if (x.parent.kind == SyntaxKind.PropertyAccessExpression) {
                return;
            }
            if (x.parent.kind == SyntaxKind.GetAccessor || x.parent.kind == SyntaxKind.SetAccessor) {
                return;
            }
            if (!this.checkParentIdentifier(x as Identifier)) {
                return;
            }

            let localClassName = x.getText();
            if (localClassName != 'this' && !localClassName.includes('.')) {
                let baseInfo = ParserTs.getBaseInfo(localClassName);
                if (baseInfo) {
                    this.addDependencyName(localClassName, isStrongDependency, x.getStart(), x.getEnd());
                }
                else {
                    if (ParserTs.hasLocal(localClassName)) {
                        this.addDependencyName(localClassName, isStrongDependency, x.getStart(), x.getEnd());
                    }
                    else if (ParserTs.hasImport(localClassName)) {
                        this.addDependencyName(localClassName, isStrongDependency, x.getStart(), x.getEnd());
                    }
                }
            }
        }
        else if (x.kind == SyntaxKind.CallExpression) {
            let exp = (x as CallExpression);
            this.loadExpression(exp.expression, depth2 + 1, isStrongDependency);
        }
    }

    protected checkParentIdentifier(x: Identifier): boolean {
        const nameCheckers: SyntaxKind[] = [
            SyntaxKind.VariableDeclaration,
            SyntaxKind.FunctionDeclaration,
            SyntaxKind.ClassDeclaration,
            SyntaxKind.InterfaceDeclaration,
            SyntaxKind.TypeAliasDeclaration,
            SyntaxKind.EnumDeclaration,
            SyntaxKind.ModuleDeclaration,
            SyntaxKind.NamespaceExportDeclaration,
            SyntaxKind.ImportEqualsDeclaration,
            SyntaxKind.ExportAssignment,
            SyntaxKind.ExportDeclaration,
            SyntaxKind.NamespaceExport,
            SyntaxKind.ExportSpecifier,
            SyntaxKind.MissingDeclaration,
            SyntaxKind.MethodDeclaration,
            SyntaxKind.ClassStaticBlockDeclaration,
        ];
        const notAllowed: SyntaxKind[] = [
            SyntaxKind.ImportDeclaration,
            SyntaxKind.ImportClause,
            SyntaxKind.NamespaceImport,
            SyntaxKind.NamedImports,
            SyntaxKind.ImportSpecifier,
        ];

        if (nameCheckers.includes(x.parent.kind)) {
            const parent = x.parent as { name?: Identifier };
            if (parent.name != x) return true;
            return false;
        }
        else if (notAllowed.includes(x.parent.kind)) {
            return false;
        }
        else if (x.parent.kind >= SyntaxKind.JsxElement && x.parent.kind <= SyntaxKind.JsxExpression) {
            return false;
        }
        return true;
    }

    private loadDependencyContext: undefined | 'Decorator' = undefined;
    private maybeDependencies: { [name: string]: { uri: string, name: string, compiled: boolean } } = {}
    protected loadOnlyDependenciesRecu(node: Node, depth: number = 0, isStrongDependency: boolean = false) {
        if (this.parserInfo.isExternal) {
            return
        }
        if (node.kind == SyntaxKind.Decorator) {
            this.loadDependencyContext = "Decorator";
        }
        forEachChild(node, x => {
            if (x.kind == SyntaxKind.TypeReference) {
                this.addDependency(x as TypeReferenceNode, isStrongDependency);
                return;
            }
            else {
                this.loadExpression(x, depth, isStrongDependency);
            }
            this.loadOnlyDependenciesRecu(x, depth + 1, isStrongDependency);
        })
        if (node.kind == SyntaxKind.Decorator) {
            this.loadDependencyContext = undefined;
        }
    }
    /**
     * return the fullName
     * @param name 
     * @param isStrongDependency 
     */
    protected addDependency(type: TypeNode, isStrongDependency: boolean): void {
        if (this.parserInfo.isExternal) {
            return
        }
        // TODO : add scope declaration variable
        const loop = (info: TypeInfo) => {
            if (info.kind == "type") {
                this.addDependencyName(info.value, isStrongDependency, info.start, info.endNonGeneric);
                for (let nested of info.nested) {
                    loop(nested);
                }
                for (let generic of info.genericValue) {
                    loop(generic);
                }
            }
            else if (info.kind == "typeLiteral" || info.kind == "function") {
                for (let nested of info.nested) {
                    loop(nested);
                }
            }

            else if (info.kind == "union") {
                for (let nested of info.nested) {
                    loop(nested);
                }
            }
        }
        loop(new TypeInfo(type));
    }
    /**
     * return the fullName
     * @param name 
     * @param isStrongDependency 
     */
    protected addDependencyWaitName(type: TypeNode, isStrongDependency: boolean, cb: (names: string[], namesNpm: string[]) => void): void {
        if (this.parserInfo.isExternal) {
            cb([type.getText()], [type.getText()])
            return
        }
        // TODO : add scope declaration variable
        let result: string[] = [];
        let resultNpm: string[] = [];
        let nb = 0;
        let validated = false;
        const validate = () => {
            if (!validated && nb == 0) {
                validated = true;
                cb(result, resultNpm);
            }
        }
        const loop = (info: TypeInfo, lvl: number) => {
            if (info.kind == "type") {
                nb++;
                this.addDependencyName(info.value, isStrongDependency, info.start, info.endNonGeneric, (fullName, fullNameNpm) => {
                    if (lvl == 0) {
                        if (fullName) result.push(fullName);
                        if (fullNameNpm) resultNpm.push(fullNameNpm);
                    }
                    nb--;
                    validate();
                });
                for (let nested of info.nested) {
                    loop(nested, lvl + 1);
                }
                for (let generic of info.genericValue) {
                    // generic isn't strong bc will disapear in js
                    isStrongDependency = false;
                    loop(generic, lvl + 1);
                }
            }
            else if (info.kind == "typeLiteral" || info.kind == "function") {
                for (let nested of info.nested) {
                    loop(nested, lvl + 1);
                }
            }

            else if (info.kind == "union") {
                for (let nested of info.nested) {
                    loop(nested, lvl + 1);
                }
            }
        }
        loop(new TypeInfo(type), 0);
        validate();
    }

    public loadStoryBookInject(): void {
        const stories = this.build.buildConfig.stories;
        if (!stories) return;
        const storieContent = this.storieContent;
        if (!storieContent) return;


        const insertResult = (uri: string, name: string) => {
            if (!this.storieInject[uri]) {
                this.storieInject[uri] = [name];
            }
            else {
                if (!this.storieInject[uri].includes(name)) {
                    this.storieInject[uri].push(name);
                }
            }
        }
        const registerLocal = (fullNameOther: string) => {
            let outputNpm = join(stories.output, "generated");
            let outputPath = join(stories.output, "auto", ...this.fullName.split("."));
            let fileNpm = join(outputNpm, ...storieContent.namespace!.split("."));
            let importPath = simplifyUri(pathToUri(fileNpm), pathToUri(outputPath));


            let namespace1: string[] = this.fullName.split(".");
            namespace1.pop();

            let namespace2: string[] = fullNameOther.split(".");
            const nameToImport = namespace2.pop() ?? '';

            for (let i = 0; i < namespace1.length; i++) {
                if (namespace2.length > i) {
                    if (namespace2[i] == namespace1[i]) {
                        namespace2.splice(i, 1);
                        namespace1.splice(i, 1);
                        i--;
                    }
                    else {
                        break;
                    }
                }
            }

            let finalPathToImport = "";
            for (let i = 0; i < namespace1.length; i++) {
                finalPathToImport += '../';
            }
            if (finalPathToImport == "") {
                finalPathToImport += "./";
            }
            finalPathToImport += namespace2.join("/");

            finalPathToImport = normalize(join(importPath, finalPathToImport)).replace(/\\/g, "/");

            insertResult(finalPathToImport, nameToImport);
        }

        if (this.storieDecorator?.slots?.inject) {
            for (let name of this.storieDecorator.slots.inject) {
                if (name.includes(".")) {
                    let classExternal = this.build.externalPackageInformation.getNpmUri(name);
                    if (classExternal) {
                        insertResult(classExternal.uri, classExternal.name);
                    }
                }
                else if (this.parserInfo.internalObjects[name]) {
                    registerLocal(this.parserInfo.internalObjects[name].fullname);
                }
                else if (this.parserInfo.importsLocal[name]?.info) {
                    registerLocal(this.parserInfo.importsLocal[name]!.info!.fullName);
                }
                else if (this.parserInfo.packages[name]) {
                    // TODO find a way to correct import from aventus
                }
                else if (this.parserInfo.npmImports[name]) {
                    insertResult(this.parserInfo.npmImports[name].uri, name);
                }
            }
        }
    }
    public getNpmReplacementName(fullName: string) {
        let currentFullName = [this.build.module, this.fullName].join(".")
        return this.parserInfo.getNpmReplacementName(currentFullName, fullName)
    }
    public addDependencyTag(tag: string, componentResult: CompileTsResult) {
        let dependency = this.build.getWebComponentTagDependency(tag);
        if (dependency) {
            for (let dep of componentResult.dependencies) {
                if (dep.fullName == dependency.fullName) {
                    return;
                }
            }

            let depUri = dependency.uri; // @external (lib), @npm (npm), file uri (same build)
            if (depUri == '@external') {
                const name = dependency.fullName;
                let classExternal = this.build.externalPackageInformation.getNpmUri(name);
                const npmReplacement = this.getNpmReplacementName(name);
                if (classExternal) {
                    this._parserInfo.registerGeneratedImport({
                        uri: classExternal.uri,
                        name: classExternal.name,
                        compiled: classExternal.compiled,
                        alias: npmReplacement,
                        forced: true
                    })
                }
            }
            else if (depUri == "@npm") {
                const name = dependency.fullName;
                let md5uri = md5(this.parserInfo.npmImports[name].uri);
                const npmReplacement = this.getNpmReplacementName(md5uri + "." + name);
                this._parserInfo.registerGeneratedImport({
                    uri: this.parserInfo.npmImports[name].uri,
                    name: name,
                    compiled: true,
                    alias: npmReplacement,
                    forced: true,
                });
            }
            else {
                // if not imported on the top on the file we need to import it
                const importInfo = ImportInfo.manualLocalImport(this, dependency.fullName, dependency.uri);

                const fullNameOther = dependency.fullName;
                let namespace1: string[] = this.fullName.split(".");
                namespace1.pop();

                let namespace2: string[] = fullNameOther.split(".");
                const nameToImport = namespace2.pop() ?? '';

                for (let i = 0; i < namespace1.length; i++) {
                    if (namespace2.length > i) {
                        if (namespace2[i] == namespace1[i]) {
                            namespace2.splice(i, 1);
                            namespace1.splice(i, 1);
                            i--;
                        }
                        else {
                            break;
                        }
                    }
                }

                const onlySrc = namespace1.length == 0 && namespace2.length == 0;
                let finalPathToImport = "";
                for (let i = 0; i < namespace1.length; i++) {
                    finalPathToImport += '../';
                }
                if (finalPathToImport == "") {
                    finalPathToImport += "./";
                }
                finalPathToImport += namespace2.join("/");
                const npmReplacement = this.getNpmReplacementName([this.build.module, fullNameOther].join("."))
                this._parserInfo.registerGeneratedImport({
                    uri: finalPathToImport,
                    nameAlias: importInfo?.alias,
                    name: nameToImport,
                    compiled: true,
                    alias: npmReplacement,
                    onlySrc: onlySrc,
                    forced: true
                })
            }

            componentResult.dependencies.push(dependency)
        }
    }
    protected addDependencyName(name: string, isStrongDependency: boolean, start: number, end: number, onNameTemp?: ((name?: string, nameNpm?: string) => void)): void {
        if (this.parserInfo.isExternal) {
            return
        }
        let onName: (name?: string, nameNpm?: string) => void
        if (!onNameTemp) {
            onName = () => { }
        }
        else {
            onName = onNameTemp;
        }
        if (!name || name == "constructor" || name == "toString") {
            onName();
            return
        }
        GenericServer.debug("try add dendency " + name);

        let match = /<.*>/g.exec(name);
        if (match) {
            end -= match[0].length;
            name = name.replace(match[0], '');
        }
        // if same class
        if (name == this.fullName) {
            onName();
            return
        }
        // if its come from js native
        if (BaseLibInfo.exists(name)) {
            if (!this.parserInfo.internalObjects[name] &&
                !this.parserInfo.importsLocal[name] &&
                !this.parserInfo.waitingImports[name] &&
                !this.parserInfo.npmImports[name] &&
                !this.parserInfo.packages[name]
            ) {
                onName();
                return
            }
        }

        if (start > 0 && end > 0) {
            if (!this.dependenciesLocations[name]) {
                this.dependenciesLocations[name] = {
                    locations: {},
                    typeRemplacement: null,
                    replacement: null,
                    docReplacement: null,
                    hotReloadReplacement: null,
                    npmReplacement: null
                }
            }
            let key = start + "_" + end;
            if (!this.dependenciesLocations[name].locations) {
                GenericServer.showErrorMessage("For the admin : you can add " + name + " as dependency to avoid");
                onName();
                return
            }
            if (!this.dependenciesLocations[name].locations[key]) {
                let token = getTokenAtPosition(this.parserInfo.srcFile, (start + end) / 2);
                let isType = isTypeReferenceNode(token) || isTypeReferenceNode(token.parent);
                this.dependenciesLocations[name].locations[key] = {
                    start: start,
                    end: end,
                    isType
                };
            }
        }


        if (!this.addDependencyNameCustomCheck(name)) {
            onName();
            return
        }
        if (this.dependenciesPrevented.includes(name)) {
            onName();
            return
        }
        if (this.dependencies[name]) {
            onName();
            // there is a dependency but not loaded bc of context => check if can be loaded
            if (this.loadDependencyContext === undefined && this.maybeDependencies[name]) {

                const npmReplacement = this.getNpmReplacementName(this.maybeDependencies[name].name);
                this._parserInfo.registerGeneratedImport({
                    uri: this.maybeDependencies[name].uri,
                    name: this.maybeDependencies[name].name,
                    compiled: this.maybeDependencies[name].compiled,
                    alias: npmReplacement,
                    forced: false
                });
            }
            return
        }

        if (name.includes(".")) {
            // lib name => impossible to be a local name
            this.dependencies[name] = {
                fullName: name,
                uri: "@external",
                isStrong: isStrongDependency,
            };

            let classExternal = this.build.externalPackageInformation.getNpmUri(name);
            const npmReplacement = this.getNpmReplacementName(name);
            if (classExternal) {
                this.dependenciesLocations[name].npmReplacement = npmReplacement;
                if (this.loadDependencyContext === undefined)
                    this._parserInfo.registerGeneratedImport({
                        uri: classExternal.uri,
                        name: classExternal.name,
                        compiled: classExternal.compiled,
                        alias: npmReplacement,
                        forced: false
                    })
                else
                    this.maybeDependencies[name] = classExternal;
            }
            onName(name, npmReplacement);
            return;
        }

        // register package to load it
        const registerLocal = (fullNameOther: string, compiled: boolean, npmReplacement: string) => {
            let namespace1: string[] = this.fullName.split(".");
            namespace1.pop();

            let namespace2: string[] = fullNameOther.split(".");
            const nameToImport = namespace2.pop() ?? '';

            for (let i = 0; i < namespace1.length; i++) {
                if (namespace2.length > i) {
                    if (namespace2[i] == namespace1[i]) {
                        namespace2.splice(i, 1);
                        namespace1.splice(i, 1);
                        i--;
                    }
                    else {
                        break;
                    }
                }
            }

            const onlySrc = namespace1.length == 0 && namespace2.length == 0;

            let finalPathToImport = "";
            for (let i = 0; i < namespace1.length; i++) {
                finalPathToImport += '../';
            }
            if (finalPathToImport == "") {
                finalPathToImport += "./";
            }
            finalPathToImport += namespace2.join("/");

            if (this.loadDependencyContext === undefined)
                this._parserInfo.registerGeneratedImport({
                    uri: finalPathToImport,
                    name: nameToImport,
                    compiled: compiled,
                    alias: npmReplacement,
                    onlySrc: onlySrc,
                    forced: false
                })
            else {
                this.maybeDependencies[name] = {
                    uri: finalPathToImport,
                    name: nameToImport,
                    compiled: compiled
                };
            }

        }
        if (this.parserInfo.internalObjects[name]) {
            let fullName = this.parserInfo.internalObjects[name].fullname
            let hotReloadName = [this.build.module, ...this.build.namespaces, fullName].join(".");
            if (fullName == this.fullName) {
                isStrongDependency = false;
            }
            this.dependencies[name] = {
                fullName: "$namespace$" + fullName,
                uri: '@local',
                isStrong: isStrongDependency,
            };
            GenericServer.debug("add dependence " + name + " : same file");
            if (this.dependenciesLocations[name]) {
                let replacement = this.build.module + "." + fullName;
                if (this.isExported != this.parserInfo.internalObjects[name].isExported) {
                    if (!this.isExported) {
                        replacement = ['globalThis', this.build.module, fullName].join(".");
                    }
                    else {
                        replacement = ['___' + this.build.module, fullName].join(".");
                    }
                }

                this.dependenciesLocations[name].typeRemplacement = replacement;
                this.dependenciesLocations[name].replacement = fullName;
                this.dependenciesLocations[name].docReplacement = this.build.module + "." + fullName;
                // no need to use getNpmReplacementName because local content can't change name
                this.dependenciesLocations[name].npmReplacement = name;
                this.dependenciesLocations[name].hotReloadReplacement = hotReloadName;

                registerLocal(fullName, this.parserInfo.internalObjects[name].isCompiled, name)
            }
            onName(fullName, name);
            return;
        }

        let importInfo = this.parserInfo.importsLocal[name]?.info;
        if (importInfo) {
            // it's an imported class
            let fullName = importInfo.fullName
            let hotReloadName = [this.build.module, ...this.build.namespaces, fullName].join(".");
            this.dependencies[name] = {
                fullName: "$namespace$" + fullName,
                uri: importInfo.fileUri,
                isStrong: isStrongDependency,
            };
            GenericServer.debug("add dependency " + name + " : imported file");
            const npmReplacement = this.getNpmReplacementName([this.build.module, fullName].join("."))
            if (this.dependenciesLocations[name]) {
                let typeRemplacement = this.build.module + "." + fullName;
                if (this.isExported != importInfo.isExported) {
                    if (!this.isExported) {
                        typeRemplacement = ['globalThis', this.build.module, fullName].join(".");
                    }
                    else {
                        typeRemplacement = ['___' + this.build.module, fullName].join(".");
                    }
                }

                let remplacement = fullName;
                const splittedLocalFullName = this.fullName.split(".");
                splittedLocalFullName.slice(0, 1);
                const replacementStart = fullName.split('.')[0];
                if (splittedLocalFullName.includes(replacementStart)) {
                    remplacement = '_.' + remplacement;
                }
                this.dependenciesLocations[name].typeRemplacement = typeRemplacement;
                this.dependenciesLocations[name].replacement = remplacement;
                this.dependenciesLocations[name].docReplacement = this.build.module + "." + fullName;;
                this.dependenciesLocations[name].npmReplacement = npmReplacement;
                this.dependenciesLocations[name].hotReloadReplacement = hotReloadName;

                registerLocal(fullName, importInfo.willBeCompiled, npmReplacement);
            }
            onName(fullName, npmReplacement);
            return
        }
        else if (this.parserInfo.waitingImports[name]) {
            GenericServer.debug("add dependency " + name + " : but waiting import file");
            this.parserInfo.waitingImports[name].push((info) => {
                let fullName = info.fullName;
                let hotReloadName = [this.build.module, ...this.build.namespaces, fullName].join(".");
                const npmReplacement = this.getNpmReplacementName([this.build.module, fullName].join("."))
                if (this.dependenciesLocations[name]) {
                    let replacement = this.build.module + "." + fullName;
                    if (this.isExported != info.isExported) {
                        if (!this.isExported) {
                            replacement = ['globalThis', this.build.module, fullName].join(".");
                        }
                        else {
                            replacement = ['___' + this.build.module, fullName].join(".");
                        }
                    }

                    this.dependenciesLocations[name].typeRemplacement = replacement;
                    this.dependenciesLocations[name].replacement = fullName;
                    this.dependenciesLocations[name].docReplacement = this.build.module + "." + fullName;;
                    this.dependenciesLocations[name].npmReplacement = npmReplacement;
                    this.dependenciesLocations[name].hotReloadReplacement = hotReloadName;

                    registerLocal(fullName, info.willBeCompiled, npmReplacement)
                }
                this.dependencies[name] = {
                    fullName: "$namespace$" + fullName,
                    uri: info.fileUri,
                    isStrong: isStrongDependency
                };
                onName(fullName, npmReplacement);
            })
            return;
        }
        else if (this.parserInfo.packages[name]) {
            let fullName = this.parserInfo.packages[name].fullname;
            let classExternal = this.build.externalPackageInformation.getNpmUri(fullName);
            this.dependencies[name] = {
                fullName: fullName,
                uri: "@external",
                isStrong: isStrongDependency,
            };
            const npmReplacement = this.getNpmReplacementName(fullName);
            if (this.dependenciesLocations[name]) {
                this.dependenciesLocations[name].typeRemplacement = fullName;
                this.dependenciesLocations[name].replacement = fullName;
                this.dependenciesLocations[name].docReplacement = fullName;
                this.dependenciesLocations[name].npmReplacement = npmReplacement;
                this.dependenciesLocations[name].hotReloadReplacement = fullName;
            }
            if (classExternal) {
                this._parserInfo.registerGeneratedImport({
                    uri: classExternal.uri,
                    name: classExternal.name,
                    compiled: classExternal.compiled,
                    alias: npmReplacement,
                    forced: false
                })
            }
            onName(fullName, npmReplacement);
            return
        }

        if (this.parserInfo.npmImports[name]) {
            this.dependencies[name] = {
                fullName: name,
                uri: "@npm",
                isStrong: isStrongDependency,
            };
            GenericServer.debug("add dependency " + name + " : npm");
            let md5uri = md5(this.parserInfo.npmImports[name].uri);
            const npmReplacement = this.getNpmReplacementName(md5uri + "." + name);
            if (this.dependenciesLocations[name]) {
                this.dependenciesLocations[name].replacement = "npmCompilation['" + md5uri + "']." + name;
                this.dependenciesLocations[name].docReplacement = "npmCompilation['" + md5uri + "']." + name;
                if (npmReplacement != name) {
                    this.dependenciesLocations[name].npmReplacement = npmReplacement;
                }
                // TODO : check how to replace the true by something compiled
                if (this.loadDependencyContext === undefined)
                    this._parserInfo.registerGeneratedImport({
                        uri: this.parserInfo.npmImports[name].uri,
                        name: name,
                        compiled: true,
                        alias: npmReplacement,
                        forced: false
                    });
                else {
                    this.maybeDependencies[name] = {
                        uri: this.parserInfo.npmImports[name].uri,
                        name: name,
                        compiled: true
                    };
                }
            }
            if (start > 0 && end > 0) {
                this.dependenciesLocations[name].locations[start + "_" + end].isNpm = true;
            }
            onName(name, npmReplacement);
            return;
        }
        // should be a lib dependencies outside the module
        this.dependencies[name] = {
            fullName: name,
            uri: "@external",
            isStrong: isStrongDependency,
        };
        GenericServer.debug("add dependency " + name + " : external");
        onName(name, name);
        return;
    }

    protected addDependencyNameCustomCheck(name: string): boolean {
        return true;
    }


    public static getContent(
        txt: string,
        start: number,
        end: number,
        dependenciesLocations: { [name: string]: DependencyInfo },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } }
    ) {
        return this._getContent(txt, start, end, dependenciesLocations, compileTransformations, 1);
    }
    public static getContentHotReload(
        txt: string,
        start: number,
        end: number,
        dependenciesLocations: { [name: string]: DependencyInfo },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } }) {
        return this._getContent(txt, start, end, dependenciesLocations, compileTransformations, 2);
    }
    public static getContentNpm(
        txt: string,
        start: number,
        end: number,
        dependenciesLocations: { [name: string]: DependencyInfo },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } }
    ) {
        return this._getContent(txt, start, end, dependenciesLocations, compileTransformations, 3);
    }
    public static getContentDoc(
        txt: string,
        start: number,
        end: number,
        dependenciesLocations: { [name: string]: DependencyInfo },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } }
    ) {
        return this._getContent(txt, start, end, dependenciesLocations, compileTransformations, 4);
    }
    private static _getContent(
        txt: string,
        start: number,
        end: number,
        dependenciesLocations: { [name: string]: DependencyInfo },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } },
        typeContent: number
    ) {
        let transformations: { newText: string, start: number, end: number }[] = [];
        for (let depName in dependenciesLocations) {
            let replacement: string | null = null;
            if (typeContent == 1) {
                replacement = dependenciesLocations[depName].replacement;
            }
            else if (typeContent == 2) {
                replacement = dependenciesLocations[depName].hotReloadReplacement;
            }
            else if (typeContent == 3) {
                replacement = dependenciesLocations[depName].npmReplacement;
            }
            else if (typeContent == 4) {
                replacement = dependenciesLocations[depName].docReplacement;
            }
            let typeRemplacement = dependenciesLocations[depName].typeRemplacement;
            if (replacement) {
                for (let locationKey in dependenciesLocations[depName].locations) {
                    let location = dependenciesLocations[depName].locations[locationKey];
                    if (location.start >= start && location.end <= end) {
                        if (location.isType && typeRemplacement && typeContent != 3) {
                            transformations.push({
                                newText: typeRemplacement,
                                start: location.start - start,
                                end: location.end - start,
                            })
                        }
                        else if (location.isNpm && location.isType) {
                            // TODO check to set a value for a node_module type imported for the package
                            continue;
                        }
                        else {
                            transformations.push({
                                newText: replacement,
                                start: location.start - start,
                                end: location.end - start,
                            })
                        }
                    }
                }
            }
        }
        for (let key in compileTransformations) {
            let transformation = compileTransformations[key];
            if (transformation.start >= start && transformation.end <= end) {
                transformations.push({
                    newText: transformation.newText,
                    start: transformation.start - start,
                    end: transformation.end - start,
                })
            }
        }

        transformations.sort((a, b) => b.end - a.end); // order from end file to start file
        let lastPos = txt.length;
        for (let transformation of transformations) {
            if (transformation.end > lastPos) continue;
            txt = txt.slice(0, transformation.start) + transformation.newText + txt.slice(transformation.end, txt.length);
            lastPos = transformation.start;
        }

        return txt.replace(/^\s*export\s+(class|interface|enum|type|abstract|function|async)/m, "$1");
    }

    public loadStorieContent() {
        if (this.build.buildConfig.stories && !this._parserInfo.isExternal) {
            for (let decorator of this.decorators) {
                const decoratorTemp = StorybookDecorator.is(decorator);
                if (decoratorTemp) {
                    this.storieDecorator = decoratorTemp;
                    break;
                }
            }

            const format = this.build.buildConfig.stories.format;
            if (this.storieDecorator) {
                if (this.storieDecorator.exportType)
                    this.storyType = this.storieDecorator.exportType;
                else if (format)
                    this.storyType = format == 'manual' ? 'all' : format;
                else
                    this.storyType = 'none';
            }
            else if (format) {
                this.storyType = format == 'manual' ? 'none' : format;
            }
            else {
                this.storyType = 'none';
            }

            if (this.storyType == 'public' || this.storyType == 'protected') {
                if (this.storieDecorator || this.isExported)
                    this.storieContent = this.defineStoryContent(this.storieDecorator);
            }
            else if (this.storyType == 'all') {
                this.storieContent = this.defineStoryContent(this.storieDecorator);
            }

            if (this.storieContent && this.build.buildConfig.stories.srcBaseUrl) {
                let rootUri = this.build.project.getConfigFile().uri.replace(AventusExtension.Config, "");
                let localPath = uriToPath(this.fileUri.replace(rootUri, '')).replace(/\\/g, '/');
                this.storieContent.srcUrl = this.build.buildConfig.stories.srcBaseUrl + '/' + localPath
            }
        }
    }
    protected abstract defineStoryContent(decorator?: StorybookDecorator): IStoryExport | undefined;


    protected transformTypeForStory(typeInfo: TypeInfo | undefined, from: BaseInfo): IStoryContentTypeResult | undefined {
        if (!typeInfo) {
            return undefined;
        }

        // simple
        if (typeInfo.kind == "type") {
            const result: IStoryContentTypeResultSimple = {
                kind: 'simple',
                name: typeInfo.value,
            }
            if (typeInfo.isArray) {
                result.isArray = true;
            }

            // generics
            if (typeInfo.genericValue.length > 0) {
                const generics: IStoryContentTypeResult[] = [];
                for (let gv of typeInfo.genericValue) {
                    const resultType = this.transformTypeForStory(gv, from);
                    if (resultType) {
                        generics.push(resultType);
                    }
                }
                if (generics.length > 0) {
                    result.generics = generics;
                }
            }

            // ref
            let info = from.parserInfo.importsLocal[typeInfo.value]?.info;
            if (info) {
                if (info.storyType != 'none')
                    result.ref = Storie.getFullname(info);
            }
            else {
                let baseInfo = from.parserInfo.internalObjects[typeInfo.value];
                if (baseInfo?.isStoryExported) {
                    result.ref = baseInfo.fullname;
                }
            }
            return result
        }
        if (
            typeInfo.kind == "any" ||
            typeInfo.kind == "never" ||
            typeInfo.kind == "unknown" ||
            typeInfo.kind == "boolean" ||
            typeInfo.kind == "null" ||
            typeInfo.kind == "number" ||
            typeInfo.kind == "string" ||
            typeInfo.kind == "undefined" ||
            typeInfo.kind == "void" ||
            typeInfo.kind == "object" ||
            typeInfo.kind == "symbol" ||
            typeInfo.kind == "this"
        ) {
            const result: IStoryContentTypeResultSimple = {
                kind: 'simple',
                name: typeInfo.kind,
            }
            return result;
        }
        if (typeInfo.kind == "literal") {
            const result: IStoryContentTypeResultSimple = {
                kind: 'simple',
                name: typeInfo.value.slice(1, -1),
            }
            return result;
        }
        // function
        if (typeInfo.kind == "function" || typeInfo.kind == "constructor") {
            if (!typeInfo.fctType) return undefined;
            const result: IStoryContentTypeResultFunction = {
                kind: 'function',
            }

            // parameters
            if (Object.keys(typeInfo.fctType.parameters).length > 0) {
                result.parameters = []
                for (let paramName in typeInfo.fctType.parameters) {
                    const parameterTemp: IStoryContentTypeResultFunctionParameter = {
                        name: paramName,
                    }
                    const paramTypeResult = this.transformTypeForStory(typeInfo.fctType.parameters[paramName], this);
                    if (paramTypeResult) {
                        parameterTemp.type = paramTypeResult;
                    }
                    result.parameters.push(parameterTemp);
                }
            }

            // return
            const resultType = this.transformTypeForStory(typeInfo.fctType.return, this);
            if (resultType) {
                result.return = resultType;
            }

            // constructor
            if (typeInfo.kind == "constructor") {
                result.isConstructor = true;
            }

            // generics
            let fctType = typeInfo.node as FunctionTypeNode;
            if (fctType.typeParameters) {
                result.generics = [];
                for (let param of fctType.typeParameters) {
                    const genericTemp: IStoryGeneric = {
                        name: param.name.getText(),
                    }
                    const typeResultDefault = this.transformTypeForStory(new TypeInfo(param.default), this);
                    if (typeResultDefault) {
                        genericTemp.default = typeResultDefault;
                    }

                    const typeResultConstraint = this.transformTypeForStory(new TypeInfo(param.constraint), this);
                    if (typeResultConstraint) {
                        genericTemp.constraint = typeResultConstraint;
                    }

                    result.generics.push(genericTemp);
                }
            }

            return result;
        }
        // tupple
        if (typeInfo.kind == "tuple") {
            // it's an object like [string, number]
            const result: IStoryContentTypeResultTupple = {
                kind: 'tupple',
                tupples: [],
            }
            for (let value of typeInfo.nested) {
                const resultTemp = this.transformTypeForStory(value, from);
                if (resultTemp)
                    result.tupples.push(resultTemp)
            }
            return result;
        }
        // object
        if (typeInfo.kind == "typeLiteral") {
            // it's an object like {for:bar}
            const result: IStoryContentTypeResultObject = {
                kind: 'object',
            }
            let node = typeInfo.node as LiteralTypeNode;
            forEachChild(node, (n) => {
                if (n.kind == SyntaxKind.PropertySignature) {
                    let prop = n as PropertySignature;
                    if (prop.type) {
                        let name = prop.name.getText();
                        let typeNode = new TypeInfo(prop.type);
                        const typeTemp = this.transformTypeForStory(typeNode, from);
                        if (typeTemp) {
                            if (!result.keys) {
                                result.keys = {}
                            }
                            result.keys[name] = typeTemp
                        }
                    }
                    else {
                        GenericServer.error("need implements property signature no type " + SyntaxKind[n.kind] + " " + from.fileUri);
                    }
                }
                else if (n.kind == SyntaxKind.IndexSignature) {
                    let prop = n as IndexSignatureDeclaration;
                    if (prop.parameters.length > 0 && prop.parameters[0].type) {
                        if (!result.indexSignatures) {
                            result.indexSignatures = [];
                        }
                        const typeTemp = this.transformTypeForStory(new TypeInfo(prop.type), from);
                        const keyTypeTemp = this.transformTypeForStory(new TypeInfo(prop.parameters[0].type), from);
                        if (typeTemp && keyTypeTemp) {
                            result.indexSignatures.push({
                                keyName: prop.parameters[0].name.getText(),
                                keyType: keyTypeTemp,
                                type: typeTemp
                            })
                        }
                    }
                }
                else if (n.kind == SyntaxKind.TypeLiteral) {
                    const typeLiteral = n as TypeLiteralNode;
                    let _array = this.transformTypeForStory(new TypeInfo(typeLiteral), from)
                    if (_array) {
                        result.array = _array;
                    }
                }
                else {
                    GenericServer.error("need implements for " + SyntaxKind[n.kind] + " " + from.fileUri);
                }
            })

            return result;
        }

        // union
        if (typeInfo.kind == "union") {
            const result: IStoryContentTypeResultUnion = {
                kind: 'union',
                types: []
            }
            for (let nested of typeInfo.nested) {
                const resultTemp = this.transformTypeForStory(nested, from);
                if (resultTemp) {
                    result.types.push(resultTemp)
                }
            }
            return result;

        }
        // intersection
        if (typeInfo.kind == "intersection") {
            const result: IStoryContentTypeResultIntersection = {
                kind: 'intersection',
                types: []
            }
            for (let nested of typeInfo.nested) {
                const resultTemp = this.transformTypeForStory(nested, from);
                if (resultTemp) {
                    result.types.push(resultTemp)
                }
            }
            return result;
        }

        // typeOperator
        if (typeInfo.kind == "typeOperator") {

            if (typeInfo.nested.length > 0) {
                const typeResult = this.transformTypeForStory(typeInfo.nested[0], from)
                if (typeResult) {
                    const result: IStoryContentTypeResultTypeOperator = {
                        kind: 'typeOperator',
                        value: typeInfo.value as 'typeof' | 'keyof' | 'unique' | 'readonly',
                        type: typeResult
                    }
                    return result;
                }
            }
            return undefined;
        }

        if (typeInfo.kind == "indexedAccess") {
            if (typeInfo.nested.length == 2) {
                const obj = this.transformTypeForStory(typeInfo.nested[0], from);
                const key = this.transformTypeForStory(typeInfo.nested[1], from);
                if (key && obj) {
                    const result: IStoryContentTypeResultIndexAccess = {
                        kind: 'indexAccess',
                        obj,
                        key
                    }
                    return result;
                }
            }

            return undefined;
        }

        if (typeInfo.kind == "mappedType") {
            if (typeInfo.mappedType) {
                const parameterType = this.transformTypeForStory(typeInfo.mappedType.parameterType, from);
                const type = this.transformTypeForStory(typeInfo.mappedType.type, from);
                if (parameterType && type) {
                    const result: IStoryContentTypeResultMappedType = {
                        kind: 'mappedType',
                        parameterName: typeInfo.mappedType.parameterName,
                        parameterType,
                        type,
                    }
                    if (typeInfo.mappedType.modifier) {
                        result.modifier = typeInfo.mappedType.modifier
                    }
                    return result;
                }
            }
            return undefined;
        }

        if (typeInfo.kind == "infer") {
            const result: IStoryContentTypeResultInfer = {
                kind: 'infer',
                name: typeInfo.value
            }
            return result;
        }

        if (typeInfo.kind == "conditional") {
            if (typeInfo.conditionalType) {
                const _check = this.transformTypeForStory(typeInfo.conditionalType.check, from)
                const _extends = this.transformTypeForStory(typeInfo.conditionalType.extends, from)
                const _true = this.transformTypeForStory(typeInfo.conditionalType.true, from)
                const _false = this.transformTypeForStory(typeInfo.conditionalType.false, from)
                if (_extends && _true && _false && _check) {
                    const result: IStoryContentTypeResultConditional = {
                        kind: 'conditional',
                        check: _check,
                        extends: _extends,
                        true: _true,
                        false: _false,
                    }
                    return result;
                }
            }
            return undefined;
        }

        if (typeInfo.kind == "mock") {
            GenericServer.warning("mock type");
        }

        return undefined;
    }

    protected loadGenericForStory(declaration: TypeParameterDeclaration, documentation?: DocumentationInfo): IStoryContentGeneric {
        const name = declaration.name.getText();
        const result: IStoryContentGeneric = {
            name,
        }
        if (!documentation) {
            documentation = this.documentation;
        }
        if (documentation?.documentationTemplates[name]) {
            result.documentation = documentation.documentationTemplates[name]
        }

        if (declaration.constraint) {
            const typeResult = this.transformTypeForStory(new TypeInfo(declaration.constraint), this);
            if (typeResult)
                result.constraint = typeResult
        }
        if (declaration.default) {
            const typeResult = this.transformTypeForStory(new TypeInfo(declaration.default), this);
            if (typeResult)
                result.default = typeResult;
        }

        return result;
    }

    protected loadParameterForStory(declaration: ParameterDeclaration, documentation?: DocumentationInfo): IStoryContentParameter {
        const name = declaration.name.getText();
        const result: IStoryContentParameter = {
            name,
        }
        //type
        const type = this.transformTypeForStory(new TypeInfo(declaration.type), this);
        if (type) {
            result.type = type;
        }
        // doc
        if (!documentation) {
            documentation = this.documentation;
        }
        if (documentation?.documentationParameters[name]) {
            result.documentation = documentation.documentationParameters[name]
        }
        return result;
    }

    protected setAccessibilityForStroy(result: IStoryExport) {
        if (!this.isExported) {
            result.accessibility = 'internal'
        }
    }

    protected setNamespaceForStroy(result: IStoryExport) {
        // namespace
        if (this.build.noNamespaceUri[this.fileUri]) {
            if (this.namespace.length > 0) {
                result.namespace = this.namespace;
            }
        }
        else {
            result.namespace = this.build.module;
            if (this.namespace.length > 0) {
                result.namespace += "." + this.namespace;
            }
        }
    }
    protected setDocumentationForStroy(result: IStoryExport) {
        if (this.documentation) {
            result.documentation = this.documentation.definitions.join("\n")
        }
    }
}