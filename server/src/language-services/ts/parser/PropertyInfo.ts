import { ExpressionWithTypeArguments, GetAccessorDeclaration, PropertyDeclaration, SetAccessorDeclaration, SyntaxKind } from "typescript";
import { DecoratorInfo } from "./DecoratorInfo";
import { ParserTs } from './ParserTs';
import { getArg } from './tools';
import { TypeInfo } from './TypeInfo';

type PropType = PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;
export class PropertyInfo {
    public name: string = "";
    public nameStart: number = 0;
    public nameEnd: number = 0;
    public documentation: string[] = [];
    public decorators: DecoratorInfo[] = [];
    public defaultValue: string | null = null;
    public content: string = "";
    public type: TypeInfo;
    public prop: PropType;
    public isAbstract: boolean = false;
    public isGet: boolean = false;
    public isSet: boolean = false;
    public isGetSet: boolean = false;
    public isInsideInterface: boolean = false;
    public isStatic: boolean = false;
    public fullStart: number = 0;
    public fullEnd: number = 0;

    constructor(prop: PropType, isInsideInterface: boolean) {
        this.isInsideInterface = isInsideInterface;
        this.prop = prop;
        this.name = prop.name.getText();
        this.nameStart = prop.name.getStart();
        this.nameEnd = prop.name.getEnd();
        this.fullStart = prop.getStart();
        this.fullEnd = prop.getEnd();
        this.content = prop.getText();
        this.decorators = DecoratorInfo.buildDecorator(prop);
        if (prop.kind == SyntaxKind.GetAccessor) {
            this.isGet = true;
        }
        else if (prop.kind == SyntaxKind.SetAccessor) {
            this.isSet = true;
        }
        else {
            this.isGetSet = true;
        }
        if (prop['jsDoc']) {
            for (let jsDoc of prop['jsDoc']) {
                this.documentation.push(jsDoc.comment);
            }
        }
        this.loadAccessibilityModifier(prop);
        this.type = this.loadType(prop);
        this.loadInitializer(prop);
    }

    private loadAccessibilityModifier(prop: PropType) {
        if(this.isInsideInterface){
            // we can't have accessility modifier inside interface
            return
        }
        let accessModDefine = false;
        let isOverride = false;
        let isPrivate = false;
        if (prop.modifiers) {
            for (let modifier of prop.modifiers) {
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
                else if (modifier.kind == SyntaxKind.AbstractKeyword) {
                    this.isAbstract = true;
                }
                else if (modifier.kind == SyntaxKind.OverrideKeyword) {
                    isOverride = true;
                }
                else if (modifier.kind == SyntaxKind.StaticKeyword) {
                    this.isStatic = true;
                }
            }

        }
        if (this.documentation.length == 0 && !isOverride && !isPrivate) {
            ParserTs.addWarning(this.nameStart, this.nameEnd, "You should add documentation for " + this.name);
        }
        if (accessModDefine === false) {
            ParserTs.addError(prop.getStart(), prop.getEnd(), "A accessibility modifier (public / private / protected) is mandatory for " + this.name);
        }
    }
    private loadType(prop: PropType) {
        let propInfo = prop as PropertyDeclaration;
        let type: TypeInfo;
        if (propInfo.type) {
            type = new TypeInfo(propInfo.type);
        }
        else if (propInfo.initializer) {
            if (propInfo.initializer.kind == SyntaxKind.ExpressionWithTypeArguments) {
                type = new TypeInfo(propInfo.initializer as ExpressionWithTypeArguments);
            }
            else {
                type = new TypeInfo(null);
            }
        }
        else {
            type = new TypeInfo(null);
        }
        return type;
    }
    private loadInitializer(prop: PropType) {
        let propInfo = prop as PropertyDeclaration;
        if (propInfo.initializer) {
            this.defaultValue = propInfo.initializer.getText();
        }
    }
}