import { EnumDeclaration } from 'typescript';
import { BaseInfo, InfoType } from "./BaseInfo";
import { ParserTs } from './ParserTs';

export class EnumInfo extends BaseInfo {
	constructor(node: EnumDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo, false);
		this.infoType = InfoType.enum;
	}
}