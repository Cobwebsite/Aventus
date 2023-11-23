import { NodeFlags, VariableDeclaration } from 'typescript';
import { BaseInfo, InfoType } from "./BaseInfo";
import { ParserTs } from './ParserTs';

export enum VariableInfoType {
	var = "var",
	let = "let",
	const = "const"
}

export class VariableInfo extends BaseInfo {

	public type: VariableInfoType = VariableInfoType.var;

	constructor(node: VariableDeclaration, namespaces: string[], parserInfo: ParserTs, isExported: boolean) {
		super(node, namespaces, parserInfo);
		this.infoType = InfoType.variable;
		if (node.parent.flags == NodeFlags.Let) {
			this.type = VariableInfoType.let;
		}
		else if (node.parent.flags == NodeFlags.Const) {
			this.type = VariableInfoType.const;
		}
		this.isExported = isExported;

		this.loadOnlyDependancesRecu(node, 0, true);
	}
}