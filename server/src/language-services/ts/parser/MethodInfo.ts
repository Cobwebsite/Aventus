import { MethodDeclaration, SyntaxKind } from "typescript";
import { DecoratorInfo } from "./DecoratorInfo";
import { ParserTs } from './ParserTs';
import { ClassInfo } from './ClassInfo';

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
    public get compiledContent(): string {
        let txt = this.content;
        let transformations: { newText: string, start: number, end: number }[] = [];
        for (let depName in this._class.dependancesLocations) {
            let replacement = this._class.dependancesLocations[depName].replacement;
            if (replacement) {
                for (let locationKey in this._class.dependancesLocations[depName].locations) {
                    let location = this._class.dependancesLocations[depName].locations[locationKey];
                    if(location.start >= this.start && location.end <= this.end) {
                        transformations.push({
                            newText: replacement,
                            start: location.start - this.start,
                            end: location.end - this.start,
                        })
                    }
                }
            }
        }
        transformations.sort((a, b) => b.end - a.end); // order from end file to start file
        for (let transformation of transformations) {
            txt = txt.slice(0, transformation.start) + transformation.newText + txt.slice(transformation.end, txt.length);
        }
        return txt;
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
    }

    private loadAccessibilityModifier(method: MethodDeclaration) {
        let accessModDefine = false;
        let isOverride = false;
        let isPrivate = false;
        if (method.modifiers) {
            for (let modifier of method.modifiers) {
                if (modifier.kind == SyntaxKind.PublicKeyword) {
                    accessModDefine = true;
                }
                else if (modifier.kind == SyntaxKind.ProtectedKeyword) {
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