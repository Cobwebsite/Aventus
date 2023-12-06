import { CallExpression, SyntaxKind, Node, canHaveDecorators, getDecorators, HasDecorators } from "typescript";
import { ParserTs } from './ParserTs';
import { ArgType, getArg } from "./tools";
import { FunctionDeclaration } from '../../scss/helper/CSSNode';
import { GenericServer } from '../../../GenericServer';
import { BaseInfo } from './BaseInfo';

export class DecoratorInfo {
    public name: string = "";
    public content: string = "";
    public start: number = 0;
    public end: number = 0;
    public arguments: { value: string, type: ArgType }[] = [];
    public baseInfo: BaseInfo;

    private constructor(baseInfo: BaseInfo) {
        this.baseInfo = baseInfo;
    }

    public static buildDecorator(node: Node, baseInfo: BaseInfo): DecoratorInfo[] {
        let result: DecoratorInfo[] = [];

        // canHaveDecorators(node)
        try {
            let decorators = getDecorators(node as HasDecorators) || [];
            for (let decorator of decorators) {
                let e = decorator.expression;
                let info = new DecoratorInfo(baseInfo);
                info.content = "@" + e.getText();
                if (e.kind === SyntaxKind.CallExpression) {
                    var call: CallExpression = <CallExpression>e;
                    info.name = call.expression.getText();
                    info.start = e.getStart();
                    info.end = e.getEnd();
                    for (let argument of call.arguments) {
                        let arg = getArg(argument);
                        if (arg) {
                            info.arguments.push(arg);
                        }
                    }
                    result.push(info);
                }
                else {
                    ParserTs.addError(decorator.getStart(), decorator.getEnd(), "Missing paramaters for Decorator");
                }
            }
        } catch (e) {
            GenericServer.showErrorMessage(e + "");
        }
        return result;
    }
}