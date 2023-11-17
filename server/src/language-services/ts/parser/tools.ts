import { ArrayLiteralExpression, Expression, NodeFlags, ObjectLiteralExpression, SyntaxKind } from "typescript";



export function hasFlag(val: NodeFlags, flag: number) {
    return (val & flag) != 0;
}

export function buildJSON(e: ObjectLiteralExpression | ArrayLiteralExpression, obj: any = null) {
    if (e.kind == SyntaxKind.ObjectLiteralExpression) {
        if (obj == null) {
            obj = {};
        }
        for (let prop of e.properties) {
            if (prop.kind == SyntaxKind.PropertyAssignment) {
                if (prop.initializer.kind == SyntaxKind.StringLiteral) {
                    obj[prop.name.getText()] = prop.initializer.getText()
                }
                else if (prop.initializer.kind == SyntaxKind.NumericLiteral) {
                    obj[prop.name.getText()] = Number(prop.initializer.getText());
                }
                else if (prop.initializer.kind == SyntaxKind.FalseKeyword) {
                    obj[prop.name.getText()] = false;
                }
                else if (prop.initializer.kind == SyntaxKind.TrueKeyword) {
                    obj[prop.name.getText()] = true;
                }
                else if (prop.initializer.kind == SyntaxKind.Identifier) {
                    obj[prop.name.getText()] = prop.initializer.getText();
                }
                else if (prop.initializer.kind == SyntaxKind.ObjectLiteralExpression) {
                    let objTemp = {};
                    buildJSON(prop.initializer as ObjectLiteralExpression, objTemp);
                    obj[prop.name.getText()] = objTemp;
                }
                else if (prop.initializer.kind == SyntaxKind.ArrayLiteralExpression) {
                    let objTemp = [];
                    buildJSON(prop.initializer as ArrayLiteralExpression, objTemp);
                    obj[prop.name.getText()] = objTemp;
                }
            }
        }
    }
    else if (e.kind == SyntaxKind.ArrayLiteralExpression) {
        if (obj == null) {
            obj = [];
        }
        for (let element of e.elements) {
            if (element.kind == SyntaxKind.StringLiteral) {
                obj.push(element.getText());
            }
            else if (element.kind == SyntaxKind.NumericLiteral) {
                obj.push(Number(element.getText()));
            }
            else if (element.kind == SyntaxKind.FalseKeyword) {
                obj.push(false);
            }
            else if (element.kind == SyntaxKind.TrueKeyword) {
                obj.push(true);
            }
            else if (element.kind == SyntaxKind.ObjectLiteralExpression) {
                let objTemp = {};
                buildJSON(element as ObjectLiteralExpression, objTemp);
                obj.push(objTemp);
            }
            else if (element.kind == SyntaxKind.ArrayLiteralExpression) {
                let objTemp = [];
                buildJSON(element as ArrayLiteralExpression, objTemp);
                obj.push(objTemp);
            }
        }
    }

    return JSON.stringify(obj);
}

export type ArgType = "string" | 'number' | 'boolean' | 'object' | 'array' | 'identifier' | 'call';
export function getArg(node: Expression): { type: ArgType, value: string } | null {
    if (node.kind == SyntaxKind.StringLiteral) {
        return {
            type: "string",
            value: node.getText()
        }
    }
    else if (node.kind == SyntaxKind.NumericLiteral) {
        return {
            type: "number",
            value: node.getText()
        }
    }
    else if (node.kind == SyntaxKind.FalseKeyword) {
        return {
            type: "boolean",
            value: "false"
        }
    }
    else if (node.kind == SyntaxKind.TrueKeyword) {
        return {
            type: "boolean",
            value: "true"
        }
    }
    else if (node.kind == SyntaxKind.ObjectLiteralExpression) {
        return {
            type: "object",
            value: buildJSON(node as ObjectLiteralExpression)
        }
    }
    else if (node.kind == SyntaxKind.ArrayLiteralExpression) {
        return {
            type: "array",
            value: buildJSON(node as ArrayLiteralExpression)
        }
    }
    else if (node.kind == SyntaxKind.Identifier) {
        return {
            type: "identifier",
            value: node.getText()
        }
    }
    else if (node.kind == SyntaxKind.CallExpression || node.kind == SyntaxKind.ArrowFunction || node.kind == SyntaxKind.FunctionExpression) {
        return {
            type: "call",
            value: node.getText()
        }
    }
   
    return null;
}