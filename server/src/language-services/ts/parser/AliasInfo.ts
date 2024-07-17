import { TypeAliasDeclaration } from 'typescript';
import { BaseInfo } from './BaseInfo';
import { ParserTs } from './ParserTs';
import { TypeInfo } from './TypeInfo';
import { IStoryContentType } from '@aventusjs/storybook';

export class AliasInfo extends BaseInfo {
	private node: TypeAliasDeclaration;
	public type: TypeInfo;
	constructor(node: TypeAliasDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo);
		this.node = node;
		this.type = new TypeInfo(this.node.type);
		this.loadOnlyDependancesRecu(node);
	}

	protected defineStoryContent(): IStoryContentType {
		let result: IStoryContentType = {
			kind: "type",
			name: this.name,
		};
		this.setNamespaceForStroy(result);
		this.setDocumentationForStroy(result);
		this.setAccessibilityForStroy(result);

		const typeResult = this.transformTypeForStory(new TypeInfo(this.node.type), this);
		if (typeResult) {
			result.type = typeResult;
		}

		if (this.node.typeParameters) {
			result.generics = [];
			for (let param of this.node.typeParameters) {
				result.generics.push(this.loadGenericForStory(param));
			}
		}

		return result
	}
}