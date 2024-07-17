import { JSDoc, JSDocParameterTag, MethodDeclaration, SyntaxKind } from "typescript";
import { DecoratorInfo } from "./DecoratorInfo";
import { ParserTs } from './ParserTs';
import { ClassInfo } from './ClassInfo';
import { InternalDecorator, InternalProtectedDecorator } from './decorators/InternalDecorator';
import { BaseInfo } from './BaseInfo';
import { NoCompileDecorator } from './decorators/NoCompileDecorator';
import { DocumentationInfo } from './DocumentationInfo';

export class MethodInfo {
    public fullStart: number = 0;
    public start: number = 0;
    public end: number = 0;
    public name: string = "";
    public nameStart: number = 0;
    public nameEnd: number = 0;
    public content: string = "";
    public documentation?: DocumentationInfo;
    public decorators: DecoratorInfo[] = [];
    public _class: ClassInfo;
    public accessibilityModifierTransformation?: { newText: string, start: number, end: number };
    public mustBeCompiled: boolean = true;
    public isStatic: boolean = false;
    public isOverride: boolean = false;
    public isAbstract: boolean = false;
    public isPrivate: boolean = false;
    public isProtected: boolean = false;
    public readonly node: MethodDeclaration;
    public documentationParameters: { [key: string]: string } = {}
    public documentationReturn?: string;
    public get compiledContent(): string {
        let txt = BaseInfo.getContent(this.content, this.start, this.end, this._class.dependancesLocations, this._class.compileTransformations);
        return txt;
    }
    public get compiledContentHotReload(): string {
        let txt = BaseInfo.getContentHotReload(this.content, this.start, this.end, this._class.dependancesLocations, this._class.compileTransformations);
        return txt;
    }
    public get compiledContentNpm(): string {
        let txt = BaseInfo.getContentNpm(this.content, this.start, this.end, this._class.dependancesLocations, this._class.compileTransformations);
        return txt;
    }

    constructor(method: MethodDeclaration, _class: ClassInfo) {
        this.node = method;
        this._class = _class;
        this.fullStart = method.getFullStart();
        this.start = method.getStart();
        this.end = method.getEnd();
        this.name = method.name.getText();
        this.nameStart = method.name.getStart();
        this.nameEnd = method.name.getEnd();
        this.content = method.getText();
        this.decorators = DecoratorInfo.buildDecorator(method, _class);

        let docTemp = new DocumentationInfo(method);
        if(docTemp.hasDoc) {
            this.documentation = docTemp;
        }
        this.loadAccessibilityModifier(method);
        for (let decorator of this.decorators) {
            if (NoCompileDecorator.is(decorator)) {
                this.mustBeCompiled = false;
                break;
            }
        }
    }

    private loadAccessibilityModifier(method: MethodDeclaration) {
        let accessModDefine = false;
        let isInternal: InternalDecorator | InternalProtectedDecorator | null = null;
        for (let decorator of this.decorators) {
            let deco = InternalDecorator.is(decorator);
            if (deco) {
                isInternal = deco;
                break;
            }
            let decoP = InternalProtectedDecorator.is(decorator);
            if (decoP) {
                isInternal = decoP;
                break;
            }
        }
        if (method.modifiers) {
            for (let modifier of method.modifiers) {
                if (modifier.kind == SyntaxKind.PublicKeyword) {
                    if (isInternal) {
                        let txt = isInternal instanceof InternalDecorator ? "private" : "protected";
                        this.accessibilityModifierTransformation = {
                            start: modifier.getStart(),
                            end: modifier.getEnd(),
                            newText: txt
                        }
                        if (txt == "private") {
                            this.isPrivate = true;
                        }
                        else if (txt == "protected") {
                            this.isProtected = true;
                        }
                    }
                    accessModDefine = true;
                }
                else if (modifier.kind == SyntaxKind.ProtectedKeyword) {
                    if (isInternal instanceof InternalDecorator) {
                        this.accessibilityModifierTransformation = {
                            start: modifier.getStart(),
                            end: modifier.getEnd(),
                            newText: "private"
                        }
                        this.isPrivate = true;
                    }
                    else {
                        this.isProtected = true;
                    }
                    accessModDefine = true;
                }
                else if (modifier.kind == SyntaxKind.PrivateKeyword) {
                    accessModDefine = true;
                    this.isPrivate = true;
                }
                else if (modifier.kind == SyntaxKind.OverrideKeyword) {
                    this.isOverride = true;
                }
                else if (modifier.kind == SyntaxKind.StaticKeyword) {
                    this.isStatic = true;
                }
                else if (modifier.kind == SyntaxKind.AbstractKeyword) {
                    this.isAbstract = true;
                }
            }
        }
        if (!this.documentation && !this.isOverride && !this.isPrivate) {
            ParserTs.addWarning(this.nameStart, this.nameEnd, "You should add documentation for " + this.name);
        }
        if (accessModDefine === false && !this._class.isInterface) {
            ParserTs.addError(this.nameStart, this.nameEnd, "A accessibility modifier (public / private / protected) is mandatory for " + this.name);
        }
    }

}