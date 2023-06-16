import { MethodDeclaration, SyntaxKind } from "typescript";
import { DecoratorInfo } from "./DecoratorInfo";
import { ParserTs } from './ParserTs';

export class MethodInfo {
    public name: string = "";
    public nameStart: number = 0;
    public nameEnd: number = 0;
    public content: string = "";
    public documentation: string[] = [];
    public decorators: DecoratorInfo[] = [];

    constructor(method: MethodDeclaration) {
        this.name = method.name.getText();
        this.nameStart = method.name.getStart();
        this.nameEnd = method.name.getEnd();
        this.content = method.getText();
        this.decorators = DecoratorInfo.buildDecorator(method);
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
        if(this.documentation.length == 0 && !isOverride && !isPrivate){
            ParserTs.addWarning(this.nameStart, this.nameEnd, "You should add documentation for " + this.name);
        }
        if (accessModDefine === false) {
            ParserTs.addError(this.nameStart, this.nameEnd, "A accessibility modifier (public / private / protected) is mandatory for " + this.name);
        }
    }
}