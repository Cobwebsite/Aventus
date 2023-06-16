import { TypeAliasDeclaration } from 'typescript';
import { BaseInfo } from './BaseInfo';
import { ParserTs } from './ParserTs';
import { TypeInfo } from './TypeInfo';

export class AliasInfo extends BaseInfo {
	public type: TypeInfo;
	constructor(node: TypeAliasDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo);
		this.type = new TypeInfo(node.type);
	}

}