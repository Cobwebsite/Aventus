import { FunctionDeclaration, SyntaxKind, TypeNode, forEachChild, Node, ExpressionWithTypeArguments, NewExpression, PropertyAccessExpression, CallExpression, TypeReferenceNode } from 'typescript';
import { BaseInfo } from './BaseInfo';
import { ParserTs } from './ParserTs';
import { TypeInfo } from './TypeInfo';
import { BaseLibInfo } from './BaseLibInfo';


export class FunctionInfo extends BaseInfo {

	constructor(node: FunctionDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo);
		for (let param of node.parameters) {
			if (param.type) {
				this.addDependance(param.type, false);
			}
		}
		
		forEachChild(node, x => {
			if (x.kind == SyntaxKind.Block) {
				this.loadOnlyDependancesRecu(x);
			}
		})
	}
}