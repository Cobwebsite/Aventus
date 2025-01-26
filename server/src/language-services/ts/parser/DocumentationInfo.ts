import { JSDoc, JSDocParameterTag, JSDocTemplateTag, Node, SyntaxKind } from 'typescript';

export class DocumentationInfo {

	public hasDoc: boolean = false;
	public definitions: string[] = [];
	public documentationParameters: { [key: string]: string } = {}
	public documentationTemplates: { [key: string]: string } = {}
	public documentationSlots: { [key: string]: string } = {}
	public documentationReturn?: string;
	public fullDefinitions: string[] = [];

	public constructor(node: Node & { jsDoc?: JSDoc[] }) {
		if (node.jsDoc) {
			this.hasDoc = true

			for (let jsDoc of node.jsDoc) {
				if (typeof jsDoc.comment == 'string') {
					this.fullDefinitions.push(jsDoc.getText());
					this.definitions.push(jsDoc.comment);
				}

				if (jsDoc.tags) {
					for (let tag of jsDoc.tags) {
						this.fullDefinitions.push(tag.getText());
						if (tag.kind == SyntaxKind.JSDocParameterTag) {
							let docParam = tag as JSDocParameterTag;
							if (typeof docParam.comment == 'string') {
								this.documentationParameters[docParam.name.getText()] = docParam.comment
							}
						}
						else if (tag.kind == SyntaxKind.JSDocReturnTag) {
							let docParam = tag as JSDocParameterTag;
							if (typeof docParam.comment == 'string') {
								this.documentationReturn = docParam.comment;
							}
						}
						else if (tag.kind == SyntaxKind.JSDocTemplateTag) {
							let templateParam = tag as JSDocTemplateTag;
							if (typeof templateParam.comment == 'string') {
								for (let type of templateParam.typeParameters) {
									this.documentationTemplates[type.name.getText()] = templateParam.comment
								}
							}
						}
						else if (tag.kind == SyntaxKind.JSDocTag) {
							let text = tag.getText().trim();
							if (text.startsWith("@slot")) {
								let regex = /@slot\s*([a-zA-z\-]*)\s*?(-|$)(.*)/gm
								const match = regex.exec(text);
								if (match) {
									let name = match[1];
									if (!name) {
										name = "default";
									}
									let description = match[3];
									if (description) {
										this.documentationSlots[name] = description.trim();
									}
								}

							}
						}
					}
				}
			}
		}
	}
}