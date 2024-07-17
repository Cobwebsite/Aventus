import { FunctionDeclaration, SyntaxKind, forEachChild } from 'typescript';
import { BaseInfo, InfoType } from './BaseInfo';
import { ParserTs } from './ParserTs';
import { IStoryContentFunction, IStoryContentReturn } from '@aventusjs/storybook';
import { TypeInfo } from './TypeInfo';


export class FunctionInfo extends BaseInfo {

	private node: FunctionDeclaration;
	constructor(node: FunctionDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo);
		this.node = node;
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

	protected defineStoryContent(): IStoryContentFunction {
		let result: IStoryContentFunction = {
			kind: "function",
			name: this.name,
		};
		this.setNamespaceForStroy(result);
		this.setDocumentationForStroy(result);
		this.setAccessibilityForStroy(result);

		// generic
		if (this.node.typeParameters) {
			result.generics = [];
			for (let param of this.node.typeParameters) {
				result.generics.push(this.loadGenericForStory(param));
			}
		}

		// parameters
		if (this.node.parameters.length > 0) {
			result.parameters = [];
			for (let p of this.node.parameters) {
				result.parameters.push(this.loadParameterForStory(p));
			}
		}

		// return type
		if (this.node.type) {
			const type = new TypeInfo(this.node.type);
			const typeResult = this.transformTypeForStory(type, this);
			if (typeResult) {
				const returnInfo: IStoryContentReturn = {
					type: typeResult
				}
				if (this.documentation?.documentationReturn) {
					returnInfo.documentation = this.documentation.documentationReturn;
				}
				result.return = returnInfo;
			}
		}

		return result;
	}
}