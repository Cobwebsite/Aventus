import { Node, CallExpression, ClassDeclaration, EnumDeclaration, FunctionDeclaration, InterfaceDeclaration, SyntaxKind, TypeAliasDeclaration, TypeNode, TypeReferenceNode, forEachChild, ExpressionWithTypeArguments, NewExpression, PropertyAccessExpression, VariableStatement, VariableDeclaration } from "typescript";
import { ParserTs } from './ParserTs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BaseLibInfo } from './BaseLibInfo';
import { TypeInfo } from './TypeInfo';
import { syntaxName } from './tools';
import { DecoratorInfo } from './DecoratorInfo';
import { DependancesDecorator } from './decorators/DependancesDecorator';


export enum InfoType {
    none,
    class,
    classData,
    interface,
    function,
    variable,
    enum
}

export abstract class BaseInfo {
    private static infoByShortName: { [shortName: string]: BaseInfo } = {};
    private static infoByFullName: { [shortName: string]: BaseInfo } = {};
    public static getInfoByShortName(shortName: string): BaseInfo | undefined {
        return this.infoByShortName[shortName];
    }
    public static getInfoByFullName(fullName: string): BaseInfo | undefined {
        return this.infoByFullName[fullName];
    }

    public static isExported(node: ClassDeclaration | EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration | FunctionDeclaration | VariableStatement) {
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
    public dependances: {
        fullName: string,
        uri: string, // @local (same file), @external (lib), file uri (same build) 
        isStrong: boolean,
    }[] = []
    public compiled: string = "";
    public documentation: string[] = [];
    public isExported: boolean = false;
    private _parserInfo: ParserTs;
    public content: string = "";
    public get fileUri() {
        return this.document.uri;
    }
    public debug: boolean = false;
    public document: TextDocument;
    private dependanceNameLoaded: string[] = [];
    private dependancePrevented: string[] = [];
    private dependancesLocations: { [name: string]: { start: number, end: number }[] } = {};
    public infoType: InfoType = InfoType.none;

    public get parserInfo() {
        return this._parserInfo;
    }

    constructor(node: ClassDeclaration | EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration | FunctionDeclaration | VariableDeclaration, namespaces: string[], parserInfo: ParserTs, autoLoadDepDecorator: boolean = true) {
        this._parserInfo = parserInfo;
        this.document = parserInfo.document;
        this.decorators = DecoratorInfo.buildDecorator(node);
        this.dependancesLocations = {};
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
            if (node.kind != SyntaxKind.VariableDeclaration) {
                this.isExported = BaseInfo.isExported(node);
            }
            BaseInfo.infoByFullName[this.fullName] = this;
        }

        if (autoLoadDepDecorator) {
            this.loadDependancesDecorator();
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

    protected loadOnlyDependancesRecu(node: Node, depth: number = 0, isStrongDependance: boolean = false) {
        if (this.parserInfo.isLib) {
            return
        }
        const loadExpression = (x: Node, depth2: number = 0) => {
            if (this.debug) {
                console.log("***" + depth + ". " + x.getText());
                console.log(syntaxName[x.kind]);
            }
            if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
                this.addDependance(x as ExpressionWithTypeArguments, isStrongDependance);
            }
            else if (x.kind == SyntaxKind.NewExpression) {
                let exp = (x as NewExpression);
                loadExpression(exp.expression, depth2 + 1);
            }
            else if (x.kind == SyntaxKind.PropertyAccessExpression) {
                let exp = (x as PropertyAccessExpression);
                let txt = exp.name.getText();
                let baseInfo = ParserTs.getBaseInfo(txt);
                if (baseInfo) {
                    // when static call on external class
                    if (exp.expression.getText() + "." + txt == baseInfo.fullName) {
                        this.addDependanceName(baseInfo.fullName, isStrongDependance, exp.expression.getStart(), exp.expression.getEnd());
                    }
                }
                else {
                    // when static call on local class
                    let localClassName = exp.expression.getText();
                    if (localClassName != 'this' && !localClassName.includes('.')) {
                        if (ParserTs.hasImport(localClassName)) {
                            this.addDependanceName(localClassName, isStrongDependance, exp.expression.getStart(), exp.expression.getEnd());
                        }
                    }
                }
                loadExpression(exp.expression, depth2 + 1);
            }
            else if (x.kind == SyntaxKind.Identifier) {
                if (x.parent.kind == SyntaxKind.PropertyAccessExpression) {
                    return;
                }
                else if (x.parent.kind >= SyntaxKind.VariableDeclaration && x.parent.kind <= SyntaxKind.JsxExpression) {
                    return;
                }
                let localClassName = x.getText();
                if (localClassName != 'this' && !localClassName.includes('.')) {
                    let baseInfo = ParserTs.getBaseInfo(localClassName);
                    if (baseInfo) {
                        this.addDependanceName(localClassName, isStrongDependance, x.getStart(), x.getEnd());
                    }
                    else {
                        if (ParserTs.hasImport(localClassName)) {
                            this.addDependanceName(localClassName, isStrongDependance, x.getStart(), x.getEnd());
                        }
                    }
                }
            }
            else if (x.kind == SyntaxKind.CallExpression) {
                let exp = (x as CallExpression);
                loadExpression(exp.expression, depth2 + 1);
            }

        }
        forEachChild(node, x => {
            if (x.kind == SyntaxKind.TypeReference) {
                this.addDependance(x as TypeReferenceNode, isStrongDependance);
                return;
            }
            else {
                loadExpression(x);
            }

            if (this.debug) {
                console.log("***" + depth + ". " + x.getText());
                console.log(syntaxName[x.kind]);
            }
            this.loadOnlyDependancesRecu(x, depth + 1, isStrongDependance);
        })
    }
    /**
     * return the fullName
     * @param name 
     * @param isStrongDependance 
     */
    protected addDependance(type: TypeNode, isStrongDependance: boolean): string[] {
        let result: string[] = [];
        const loop = (info: TypeInfo) => {
            if (info.kind == "type") {
                let fullName = this.addDependanceName(info.value, isStrongDependance, info.start, info.end);
                if (fullName !== null) {
                    result.push(fullName);
                }
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


        return result;
    }
    protected addDependanceName(name: string, isStrongDependance: boolean, start: number, end: number): string | null {
        if (!name) {
            return null;
        }
        name = name.replace(/<.*>/g, '');
        // if same class
        if (name == this.fullName) {
            return null;
        }
        // if its come from js native
        if (BaseLibInfo.exists(name)) {
            return null;
        }

        if (start > 0 && end > 0) {
            if (!Array.isArray(this.dependancesLocations[name])) {
                this.dependancesLocations[name] = []
            }
            this.dependancesLocations[name].push({
                start: start,
                end: end
            });
        }


        if (!this.addDependanceNameCustomCheck(name)) {
            return null;
        }
        if (this.dependancePrevented.includes(name)) {
            return null;
        }
        if (this.dependanceNameLoaded.includes(name)) {
            return null;
        }
        this.dependanceNameLoaded.push(name);

        if (name.includes(".")) {
            // lib name => impossible to be a local name
            this.dependances.push({
                fullName: name,
                uri: "@external",
                isStrong: isStrongDependance
            });
            return name;
        }
        let types = [this.parserInfo.classes, this.parserInfo.enums, this.parserInfo.aliases, this.parserInfo.functions, this.parserInfo.variables];
        for (let type of types) {
            if (type[name]) {
                // it's a class inside the same file
                let fullName = type[name].fullName
                this.dependances.push({
                    fullName: "$namespace$" + fullName,
                    uri: '@local',
                    isStrong: isStrongDependance
                });

                return fullName;
            }
        }

        if (this.parserInfo.imports[name]) {
            // it's an imported class
            let fullName = this.parserInfo.imports[name].fullName
            this.dependances.push({
                fullName: "$namespace$" + fullName,
                uri: this.parserInfo.imports[name].fileUri,
                isStrong: isStrongDependance
            });
            return fullName;
        }
        else if (this.parserInfo.waitingImports[name]) {
            // TODO maybe return a specific value to parsed after file is ready

        }


        // should be a lib dependances outside the module
        this.dependances.push({
            fullName: name,
            uri: "@external",
            isStrong: isStrongDependance
        });
        return name;
    }

    protected addDependanceNameCustomCheck(name: string): boolean {
        return true;
    }


}