import { ScriptTarget, TypeAliasDeclaration, createSourceFile } from 'typescript';
import { BaseInfo } from './BaseInfo';
import { ParserTs } from './ParserTs';
import { TypeInfo } from './TypeInfo';
import { IStoryContentType } from '@aventusjs/storybook';
import { DocumentationInfo } from './DocumentationInfo';

export class AliasInfo extends BaseInfo {
	private node: TypeAliasDeclaration;
	public type: TypeInfo;
	constructor(node: TypeAliasDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo);
		if (!this.documentation) {
			const comment = node.getFullText().match(/\/\*\*[\s\S]*?\*\//g)?.at(-1);
			if (comment) {
				const source = createSourceFile('alias-doc.ts', comment + '\ntype Alias = unknown;', ScriptTarget.Latest, true);
				const documentation = new DocumentationInfo(source.statements[0]);
				if (documentation.hasDoc) this.documentation = documentation;
			}
		}
		this.node = node;
		this.type = new TypeInfo(this.node.type);
		this.loadOnlyDependenciesRecu(node);
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
