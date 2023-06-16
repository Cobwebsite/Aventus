import { CallExpression, SyntaxKind, Node, canHaveDecorators, getDecorators } from "typescript";
import { ParserTs } from './ParserTs';
import { ArgType, getArg } from "./tools";

export class DecoratorInfo {
    public name: string = "";
    public content: string = "";
    public start: number = 0;
    public end: number = 0;
    public arguments: { value: string, type: ArgType }[] = [];

    public static buildDecorator(node: Node): DecoratorInfo[] {
        let result: DecoratorInfo[] = [];
        if (canHaveDecorators(node)) {
            let decorators = getDecorators(node) || [];
            for (let decorator of decorators) {
                let e = decorator.expression;
                let info = new DecoratorInfo();
                info.content = "@" + e.getText();
                if (e.kind === SyntaxKind.CallExpression) {
                    var call: CallExpression = <CallExpression>e;
                    info.name = call.expression.getText();
                    info.start = e.getStart();
                    info.end = e.getEnd();
                    for(let argument of call.arguments){
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
        }
        return result;
    }
}