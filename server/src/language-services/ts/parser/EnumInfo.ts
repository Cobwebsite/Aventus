import { EnumDeclaration, getJSDocTags } from 'typescript';
import { BaseInfo, InfoType } from "./BaseInfo";
import { ParserTs } from './ParserTs';
import { IStoryContentEnum, IStoryContentEnumValue } from '@aventusjs/storybook';
import { DocumentationInfo } from './DocumentationInfo';

export class EnumInfo extends BaseInfo {

	private node: EnumDeclaration;
	constructor(node: EnumDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo, false);
		this.infoType = InfoType.enum;
		this.node = node;
	}

	protected defineStoryContent(): IStoryContentEnum {
		let result: IStoryContentEnum = {
			kind: "enum",
			name: this.name,
			properties: []
		};

		this.setNamespaceForStroy(result);
		this.setDocumentationForStroy(result);
		this.setAccessibilityForStroy(result);

		let inferredValue = 0;

		for (let member of this.node.members) {
			// get name, value and documentation
			const propertyTemp: IStoryContentEnumValue = {
				name: member.name.getText(),
			}
			let value;
			if (member.initializer) {
				value = eval(member.initializer.getText());
				inferredValue = value + 1;
			}
			else {
				value = inferredValue++;
			}
			propertyTemp.value = value + '';

			let docTemp = new DocumentationInfo(member);
			if (docTemp.hasDoc) {
				propertyTemp.documentation = docTemp.definitions.join("\n");
			}

			result.properties.push(propertyTemp);
		}

		return result
	}
}