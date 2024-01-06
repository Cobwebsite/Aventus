import { MethodDeclaration, SyntaxKind } from "typescript";
import { DecoratorInfo } from "./DecoratorInfo";
import { ParserTs } from './ParserTs';
import { ClassInfo } from './ClassInfo';
import { InternalDecorator, InternalProtectedDecorator } from './decorators/InternalDecorator';
import { BaseInfo } from './BaseInfo';
import { NoCompileDecorator } from './decorators/NoCompileDecorator';

export class MethodInfo {
    public fullStart: number = 0;
    public start: number = 0;
    public end: number = 0;
    public name: string = "";
    public nameStart: number = 0;
    public nameEnd: number = 0;
    public content: string = "";
    public documentation: string[] = [];
    public decorators: DecoratorInfo[] = [];
    public _class: ClassInfo;
    public accessibilityModifierTransformation?: { newText: string, start: number, end: number };
    public mustBeCompiled: boolean = true;
    public get compiledContent(): string {
        return BaseInfo.getContent(this.content, this.start, this.end, this._class.dependancesLocations, this._class.compileTransformations);
    }

    constructor(method: MethodDeclaration, _class: ClassInfo) {
        this._class = _class;
        this.fullStart = method.getFullStart();
        this.start = method.getStart();
        this.end = method.getEnd();
        this.name = method.name.getText();
        this.nameStart = method.name.getStart();
        this.nameEnd = method.name.getEnd();
        this.content = method.getText();
        this.decorators = DecoratorInfo.buildDecorator(method, _class);
        if (method['jsDoc']) {
            for (let jsDoc of method['jsDoc']) {
                this.documentation.push(jsDoc.comment);
            }
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
        let isOverride = false;
        let isPrivate = false;
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
                    }
                    accessModDefine = true;
                }
                else if (modifier.kind == SyntaxKind.PrivateKeyword) {
                    accessModDefine = true;
                    isPrivate = true;
                }
                else if (modifier.kind == SyntaxKind.OverrideKeyword) {
                    isOverride = true;
                }
            }
        }
        if (this.documentation.length == 0 && !isOverride && !isPrivate) {
            ParserTs.addWarning(this.nameStart, this.nameEnd, "You should add documentation for " + this.name);
        }
        if (accessModDefine === false) {
            ParserTs.addError(this.nameStart, this.nameEnd, "A accessibility modifier (public / private / protected) is mandatory for " + this.name);
        }
    }
}