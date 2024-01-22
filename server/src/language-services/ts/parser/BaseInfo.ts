import { Node, CallExpression, ClassDeclaration, EnumDeclaration, FunctionDeclaration, InterfaceDeclaration, SyntaxKind, TypeAliasDeclaration, TypeNode, TypeReferenceNode, forEachChild, ExpressionWithTypeArguments, NewExpression, PropertyAccessExpression, VariableStatement, VariableDeclaration, MethodDeclaration } from "typescript";
import { ParserTs } from './ParserTs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BaseLibInfo } from './BaseLibInfo';
import { TypeInfo } from './TypeInfo';
import { DecoratorInfo } from './DecoratorInfo';
import { DependancesDecorator } from './decorators/DependancesDecorator';
import * as md5 from 'md5';
import { GenericServer } from '../../../GenericServer';
import { InternalDecorator } from './decorators/InternalDecorator';
import { Build } from '../../../project/Build';


export enum InfoType {
    none,
    class,
    classData,
    interface,
    function,
    variable,
    enum
}

type DependanceType = {
    fullName: string,
    uri: string, // @local (same file), @external (lib), @npm (npm), file uri (same build) 
    isStrong: boolean,
}

export type SupportedRootNodes = ClassDeclaration | EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration | FunctionDeclaration | VariableDeclaration | MethodDeclaration

export abstract class BaseInfo {
    private static infoByShortName: { [shortName: string]: BaseInfo } = {};
    private static infoByFullName: { [shortName: string]: BaseInfo } = {};
    public static getInfoByShortName(shortName: string): BaseInfo | undefined {
        return this.infoByShortName[shortName];
    }
    public static getInfoByFullName(fullName: string, from: BaseInfo): BaseInfo | undefined {
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

    public name: string = "";
    public nameStart: number = 0;
    public nameEnd: number = 0;
    public start: number = 0;
    public end: number = 0;
    public fullName: string = "";
    public namespace: string = "";
    public decorators: DecoratorInfo[] = [];

    // public dependancesFullName: string[] = [];
    public dependances: DependanceType[] = []
    public compiled: string = "";
    public documentation: string[] = [];
    public isExported: boolean = false;
    private _parserInfo: ParserTs;
    public content: string = "";
    public compileTransformations: { [key: string]: { newText: string, start: number, end: number } } = {};
    public get compiledContent(): string {
        return BaseInfo.getContent(this.content, this.start, this.end, this.dependancesLocations, this.compileTransformations);
    }
    public get compiledContentHotReload(): string {
        return BaseInfo.getContentHotReload(this.content, this.start, this.end, this.dependancesLocations, this.compileTransformations);
    }
    public get fileUri() {
        return this.document.uri;
    }
    public debug: boolean = false;
    public document: TextDocument;
    private dependanceNameLoaded: string[] = [];
    private dependancePrevented: string[] = [];
    public dependancesLocations: {
        [name: string]: {
            replacement: string | null,
            hotReloadReplacement: string | null,
            locations: { [key: string]: { start: number, end: number } }
        }
    } = {};
    public infoType: InfoType = InfoType.none;
    public build: Build;

    public get parserInfo() {
        return this._parserInfo;
    }

    constructor(node: SupportedRootNodes, namespaces: string[], parserInfo: ParserTs, autoLoadDepDecorator: boolean = true) {
        this._parserInfo = parserInfo;
        this.document = parserInfo.document;
        this.decorators = DecoratorInfo.buildDecorator(node, this);
        this.dependancesLocations = {};
        this.build = parserInfo.build;
        if (node.name) {
            this.start = node.getStart();
            this.end = node.getEnd();
            this.name = node.name.getText();
            this.nameStart = node.name.getStart();
            this.nameEnd = node.name.getEnd();
            this.namespace = namespaces.join(".");
            this.fullName = [...namespaces, this.name].join(".");
            this.content = node.getText();

            if (!parserInfo.isLib) {
                BaseInfo.infoByShortName[this.name] = this;
            }
            if (node['jsDoc']) {
                for (let jsDoc of node['jsDoc']) {
                    this.documentation.push(jsDoc.comment);
                }
            }
            if (autoLoadDepDecorator) {
                this.loadDependancesDecorator();
            }
            if (node.kind != SyntaxKind.VariableDeclaration) {
                this.isExported = BaseInfo.isExported(node);
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

    protected loadDependancesDecorator() {
        for (let decorator of this.decorators) {
            let temp = DependancesDecorator.is(decorator);
            if (temp) {
                for (let dependance of temp.dependances) {
                    this.addDependanceName(dependance.type, dependance.strong, 0, 0);
                }
            }
        }
    }

    protected preventDependanceAdd(name: string) {
        if (!this.dependancePrevented.includes(name)) {
            this.dependancePrevented.push(name);
        }
    }

    private loadExpression(x: Node, depth2: number = 0, isStrongDependance: boolean = false) {
        if (this.debug) {
            console.log("***" + depth2 + ". " + x.getText());
            console.log(SyntaxKind[x.kind]);
        }
        if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
            this.addDependance(x as ExpressionWithTypeArguments, isStrongDependance);
        }
        else if (x.kind == SyntaxKind.NewExpression) {
            let exp = (x as NewExpression);
            this.loadExpression(exp.expression, depth2 + 1, isStrongDependance);
        }
        else if (x.kind == SyntaxKind.PropertyAccessExpression) {
            let exp = (x as PropertyAccessExpression);
            let txt = exp.name.getText();
            let baseInfo = ParserTs.getBaseInfo(txt);
            if (baseInfo && exp.expression.getText() + "." + txt == baseInfo.fullName) {
                // when static call on external class
                this.addDependanceName(baseInfo.fullName, isStrongDependance, exp.expression.getStart(), exp.expression.getEnd());
            }
            else {
                // when static call on local class
                let localClassName = exp.expression.getText();
                if (localClassName != 'this' && !localClassName.includes('.')) {
                    if (ParserTs.hasLocal(localClassName)) {
                        this.addDependanceName(localClassName, isStrongDependance, exp.expression.getStart(), exp.expression.getEnd());
                    }
                    else if (ParserTs.hasImport(localClassName)) {
                        this.addDependanceName(localClassName, isStrongDependance, exp.expression.getStart(), exp.expression.getEnd());
                    }
                }
            }
            this.loadExpression(exp.expression, depth2 + 1, isStrongDependance);
        }
        else if (x.kind == SyntaxKind.Identifier) {
            if (x.parent.kind == SyntaxKind.PropertyAccessExpression) {
                return;
            }
            if (x.parent.kind >= SyntaxKind.VariableDeclaration && x.parent.kind <= SyntaxKind.JsxExpression) {
                return;
            }
            if ([
                SyntaxKind.PropertyDeclaration,
                SyntaxKind.MethodDeclaration,
                SyntaxKind.ClassStaticBlockDeclaration,

            ].includes(x.parent.kind)) {
                return;
            }
            if (x.parent.kind == SyntaxKind.MethodDeclaration) {
                return;
            }
            let localClassName = x.getText();
            if (localClassName != 'this' && !localClassName.includes('.')) {
                let baseInfo = ParserTs.getBaseInfo(localClassName);
                if (baseInfo) {
                    this.addDependanceName(localClassName, isStrongDependance, x.getStart(), x.getEnd());
                }
                else {
                    if (ParserTs.hasLocal(localClassName)) {
                        this.addDependanceName(localClassName, isStrongDependance, x.getStart(), x.getEnd());
                    }
                    else if (ParserTs.hasImport(localClassName)) {
                        this.addDependanceName(localClassName, isStrongDependance, x.getStart(), x.getEnd());
                    }
                }
            }
        }
        else if (x.kind == SyntaxKind.CallExpression) {
            let exp = (x as CallExpression);
            this.loadExpression(exp.expression, depth2 + 1, isStrongDependance);
        }
    }
    protected loadOnlyDependancesRecu(node: Node, depth: number = 0, isStrongDependance: boolean = false) {
        if (this.parserInfo.isLib) {
            return
        }
        forEachChild(node, x => {
            if (x.kind == SyntaxKind.TypeReference) {
                this.addDependance(x as TypeReferenceNode, isStrongDependance);
                return;
            }
            else {
                this.loadExpression(x, depth, isStrongDependance);
            }


            this.loadOnlyDependancesRecu(x, depth + 1, isStrongDependance);
        })
    }
    /**
     * return the fullName
     * @param name 
     * @param isStrongDependance 
     */
    protected addDependance(type: TypeNode, isStrongDependance: boolean): void {
        // TODO : add scope declaration variable
        const loop = (info: TypeInfo) => {
            if (info.kind == "type") {
                this.addDependanceName(info.value, isStrongDependance, info.start, info.endNonGeneric);
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
     * @param isStrongDependance 
     */
    protected addDependanceWaitName(type: TypeNode, isStrongDependance: boolean, cb: (names: string[]) => void): void {
        // TODO : add scope declaration variable
        let result: string[] = [];
        let nb = 0;
        let validated = false;
        const validate = () => {
            if (!validated && nb == 0) {
                validated = true;
                cb(result);
            }
        }
        const loop = (info: TypeInfo) => {
            if (info.kind == "type") {
                nb++;
                this.addDependanceName(info.value, isStrongDependance, info.start, info.endNonGeneric, (fullName) => {
                    if (fullName) result.push(fullName);
                    nb--;
                    validate();
                });
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
        validate();
    }
    protected addDependanceName(name: string, isStrongDependance: boolean, start: number, end: number, onNameTemp?: ((name?: string) => void)): void {
        let onName: (name?: string) => void
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
        if (this.debug) {
            console.log("try add dependance " + name);
        }
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
                !this.parserInfo.imports[name] &&
                !this.parserInfo.waitingImports[name] &&
                !this.parserInfo.npmImports[name]
            ) {
                onName();
                return
            }
        }

        if (start > 0 && end > 0) {
            if (!this.dependancesLocations[name]) {
                this.dependancesLocations[name] = {
                    locations: {},
                    replacement: null,
                    hotReloadReplacement: null
                }
            }
            let key = start + "_" + end;
            if (!this.dependancesLocations[name].locations) {
                GenericServer.showErrorMessage("For the admin : you can add " + name + " as dependance to avoid");
                onName();
                return
            }
            if (!this.dependancesLocations[name].locations[key]) {
                this.dependancesLocations[name].locations[key] = {
                    start: start,
                    end: end
                };
            }
        }


        if (!this.addDependanceNameCustomCheck(name)) {
            onName();
            return
        }
        if (this.dependancePrevented.includes(name)) {
            onName();
            return
        }
        if (this.dependanceNameLoaded.includes(name)) {
            onName();
            return
        }
        this.dependanceNameLoaded.push(name);

        if (name.includes(".")) {
            // lib name => impossible to be a local name
            this.dependances.push({
                fullName: name,
                uri: "@external",
                isStrong: isStrongDependance
            });
            onName(name);
            return;
        }
        if (this.parserInfo.internalObjects[name]) {
            let fullName = this.parserInfo.internalObjects[name].fullname
            let hotReloadName = [...this.build.namespaces, fullName].join(".");
            if (fullName == this.fullName) {
                isStrongDependance = false;
            }
            this.dependances.push({
                fullName: "$namespace$" + fullName,
                uri: '@local',
                isStrong: isStrongDependance
            });
            if (this.debug) {
                console.log("add dependance " + name + " : same file");
            }
            if (this.dependancesLocations[name]) {
                this.dependancesLocations[name].replacement = fullName;
                this.dependancesLocations[name].hotReloadReplacement = hotReloadName;
            }
            onName(fullName);
            return;
        }

        if (this.parserInfo.imports[name]) {
            // it's an imported class
            let fullName = this.parserInfo.imports[name].fullName
            let hotReloadName = [...this.build.namespaces, fullName].join(".");
            this.dependances.push({
                fullName: "$namespace$" + fullName,
                uri: this.parserInfo.imports[name].fileUri,
                isStrong: isStrongDependance
            });
            if (this.debug) {
                console.log("add dependance " + name + " : imported file");
            }
            if (this.dependancesLocations[name]) {
                this.dependancesLocations[name].replacement = fullName;
                this.dependancesLocations[name].hotReloadReplacement = hotReloadName;
            }
            onName(fullName);
            return
        }
        else if (this.parserInfo.waitingImports[name]) {
            // TODO maybe return a specific value to parsed after file is ready
            if (this.debug) {
                console.log("add dependance " + name + " : but waiting import file");
            }
            this.parserInfo.waitingImports[name].push((info) => {
                let fullName = this.parserInfo.imports[name].fullName;
                let hotReloadName = [...this.build.namespaces, fullName].join(".");

                if (this.dependancesLocations[name]) {
                    this.dependancesLocations[name].replacement = fullName;
                    this.dependancesLocations[name].hotReloadReplacement = hotReloadName;
                }
                this.dependances.push({
                    fullName: "$namespace$" + fullName,
                    uri: this.parserInfo.imports[name].fileUri,
                    isStrong: isStrongDependance
                });
                onName(fullName);
            })
            return;
        }

        if (this.parserInfo.npmImports[name]) {
            this.dependances.push({
                fullName: name,
                uri: "@npm",
                isStrong: isStrongDependance
            });
            if (this.debug) {
                console.log("add dependance " + name + " : npm");
            }
            if (this.dependancesLocations[name]) {
                let md5uri = md5(this.parserInfo.npmImports[name].uri);
                this.dependancesLocations[name].replacement = "npmCompilation['" + md5uri + "']." + name;
            }
            onName(name);
            return;
        }
        // should be a lib dependances outside the module
        this.dependances.push({
            fullName: name,
            uri: "@external",
            isStrong: isStrongDependance
        });
        if (this.debug) {
            console.log("add dependance " + name + " : external");
        }
        onName(name);
        return;
    }

    protected addDependanceNameCustomCheck(name: string): boolean {
        return true;
    }


    public static getContent(txt: string,
        start: number,
        end: number,
        dependancesLocations: { [name: string]: { replacement: string | null, hotReloadReplacement: string | null, locations: { [key: string]: { start: number, end: number } } } },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } }) {
        return this._getContent(txt, start, end, dependancesLocations, compileTransformations, false);
    }
    public static getContentHotReload(txt: string,
        start: number,
        end: number,
        dependancesLocations: { [name: string]: { replacement: string | null, hotReloadReplacement: string | null, locations: { [key: string]: { start: number, end: number } } } },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } }) {
        return this._getContent(txt, start, end, dependancesLocations, compileTransformations, true);
    }
    private static _getContent(
        txt: string,
        start: number,
        end: number,
        dependancesLocations: { [name: string]: { replacement: string | null, hotReloadReplacement: string | null, locations: { [key: string]: { start: number, end: number } } } },
        compileTransformations: { [key: string]: { newText: string, start: number, end: number } },
        isHotReload: boolean
    ) {
        let transformations: { newText: string, start: number, end: number }[] = [];
        for (let depName in dependancesLocations) {
            let replacement = isHotReload ? dependancesLocations[depName].hotReloadReplacement : dependancesLocations[depName].replacement;
            if (replacement) {
                for (let locationKey in dependancesLocations[depName].locations) {
                    let location = dependancesLocations[depName].locations[locationKey];
                    if (location.start >= start && location.end <= end) {
                        transformations.push({
                            newText: replacement,
                            start: location.start - start,
                            end: location.end - start,
                        })
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
        return txt;
    }
}