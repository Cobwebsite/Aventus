import { NodeFlags, VariableDeclaration, VariableStatement } from 'typescript';
import { BaseInfo, InfoType } from "./BaseInfo";
import { ParserTs } from './ParserTs';
import { IStoryContentVariable } from '@aventusjs/storybook';
import { TypeInfo } from './TypeInfo';
import { InternalDecorator } from './decorators/InternalDecorator';
import { DecoratorInfo } from './DecoratorInfo';

export enum VariableInfoType {
	var = "var",
	let = "let",
	const = "const"
}

export class VariableInfo extends BaseInfo {

	public type: VariableInfoType = VariableInfoType.var;
	private node: VariableDeclaration;
	constructor(node: VariableDeclaration, namespaces: string[], parserInfo: ParserTs, statement: VariableStatement) {
		super(node, namespaces, parserInfo);
		this.decorators = DecoratorInfo.buildDecorator(statement, this);
		this.node = node;
		this.infoType = InfoType.variable;
		if (node.parent.flags == NodeFlags.Let) {
			this.type = VariableInfoType.let;
		}
		else if (node.parent.flags == NodeFlags.Const) {
			this.type = VariableInfoType.const;
		}
		this.isExported = BaseInfo.isExported(statement);
		this.isInternalExported = this.isExported;
		for (let decorator of this.decorators) {
			let deco = InternalDecorator.is(decorator);
			if (deco) {
				this.isExported = false;
				break;
			}
		}
		this.loadOnlyDependancesRecu(node, 0, true);
	}

	protected defineStoryContent(): IStoryContentVariable {
		let result: IStoryContentVariable = {
			kind: "variable",
			name: this.name,
			modifier: this.type == VariableInfoType.const ? 'const' : this.type == VariableInfoType.let ? 'let' : 'var'
		};
		this.setNamespaceForStroy(result);
		this.setDocumentationForStroy(result);
		this.setAccessibilityForStroy(result);

		if (this.node.type) {
			const type = new TypeInfo(this.node.type);
			const typeResult = this.transformTypeForStory(type, this);
			if (typeResult) {
				result.type = typeResult;
			}
		}


		return result
	}
}