import { FunctionDeclaration, SyntaxKind, forEachChild } from 'typescript';
import { BaseInfo, InfoType } from './BaseInfo';
import { ParserTs } from './ParserTs';


export class FunctionInfo extends BaseInfo {

	constructor(node: FunctionDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo);
		this.infoType = InfoType.function;
		if (node.typeParameters) {
			for (let typeParam of node.typeParameters) {
				this.preventDependanceAdd(typeParam.name.getText());
				if (typeParam.constraint) {
					this.addDependance(typeParam.constraint, true);
				}
			}
		}
		for (let param of node.parameters) {
			if (param.type) {
				this.addDependance(param.type, false);
			}
		}

		forEachChild(node, x => {
			if (x.kind == SyntaxKind.Block) {
				this.loadOnlyDependancesRecu(x, 0, false);
			}
		})

		
	}
}