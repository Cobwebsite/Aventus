import { join } from 'path';
import { AventusTsFile } from '../language-services/ts/File';
import { writeFile } from '../tools';
import { Manifest, ManifestInfo } from './Manifest';
import { Attribute, AttributeValue, Tag, VSCodeHTMLCustomDataFormat } from './HtmlCustomDataSchema';
import { AventusWebComponentLogicalFile } from '../language-services/ts/component/File';
import { ClassInfo } from '../language-services/ts/parser/ClassInfo';
import { TypeInfo } from '../language-services/ts/parser/TypeInfo';
import { MethodInfo } from '../language-services/ts/parser/MethodInfo';
import { PropertyInfo } from '../language-services/ts/parser/PropertyInfo';


export class HtmlCustomData {

	private manifest: Manifest;
	private _package: VSCodeHTMLCustomDataFormat;
	public constructor(manifest: Manifest) {
		this.manifest = manifest;
		this._package = {
			version: 1.1,
			tags: []
		}
	}

	public write(dir: string) {
		writeFile(join(dir, "vscode.html-custom-data.json"), JSON.stringify(this._package, null, 2), "build", this.manifest.build.buildConfig.name);
	}

	public register(file: AventusTsFile, info: ManifestInfo) {
		if (!file.fileParsed) return;
		if (!(file instanceof AventusWebComponentLogicalFile)) return
		const _class = info.class;
		const compilationResult = file.compileResult.find(p => p.classScript.split('.').pop() == file.componentClassName)!;
		if (!_class) return;
		if (!compilationResult) return;
		if (!compilationResult.tagName) return;

		const tag: Tag = {
			name: compilationResult.tagName
		}

		const { attributes } = info;
		const _attributes: Attribute[] = [];
		for (let attribute of attributes) {
			const _attribute: Attribute = {
				name: attribute.name,
			}
			const type = this.getTypeTxt(attribute.type);
			const doc = attribute.documentation?.definitions.join("\n");
			let description: string = "";
			if (type) {
				description = type
			}
			if (doc) {
				if (description) {
					description += "\n\n";
				}
				description += doc;
			}
			if (description) _attribute.description = description;

			const values: AttributeValue[] = [];
			if (attribute.type.kind == "literal") {
				let value = attribute.type.value;
				if (value.startsWith("'") || value.startsWith('"')) {
					value = value.substring(1);
				}
				if (value.endsWith("'") || value.endsWith('"')) {
					value = value.substring(0, value.length - 1);
				}
				values.push({ name: value });
			}
			else if (attribute.type.kind == "union") {
				for (let nested of attribute.type.nested) {
					let value = nested.value;
					if (value.startsWith("'") || value.startsWith('"')) {
						value = value.substring(1);
					}
					if (value.endsWith("'") || value.endsWith('"')) {
						value = value.substring(0, value.length - 1);
					}
					values.push({ name: value });
				}
			}

			if (values.length > 0) {
				_attribute.values = values;
			}

			_attributes.push(_attribute);
		}

		if (_attributes.length > 0) {
			tag.attributes = _attributes;
		}

		const description = this.generateDescription(info);
		if (description) tag.description = description;

		this._package.tags.push(tag);
	}

	private generateDescription(info: ManifestInfo) {

		let result = "## " + info.fullName;
		if (info.class.documentation) {
			result += "\n" + info.class.documentation?.definitions.join("\n");
		}
		result += "\n";

		const addTitle = (title: string) => {
			result += `\n### **${title}:**\n`
		}
		const addProp = (name: string, value?: string) => {
			if (value) {
				result += ` - **${name}** - ${value}\n`
			}
			else {
				result += ` - **${name}**\n`
			}
		}

		const { attributes, methods, methodsStatic, props, propsStatic, slots, cssProperties } = info;


		const addProps = (properties: PropertyInfo[], title: string) => {
			if (properties.length > 0) {
				addTitle(title);
				for (let field of properties) {
					let values: string = this.getTypeTxt(field.type)
					const descr = field.documentation?.definitions.join("\n");
					if (values) {
						addProp(field.name + ": " + values, descr)
					}
					else {
						addProp(field.name, descr)
					}
				}
			}
		}
		addProps(attributes, "Attributes")
		addProps(props, "Properties")
		addProps(propsStatic, "Static Properties")

		// add slot
		if (Object.keys(slots).length > 0) {
			addTitle("Slots");
			for (let name in slots) {
				addProp(name, slots[name].doc);
			}
		}
		// add css variables
		if (cssProperties.length > 0) {
			addTitle("CSS Variables");
			for (let cssVar of cssProperties) {

				let name = cssVar.name;
				if (cssVar.type) {
					if (cssVar.type == "literal" && cssVar.typeValues) {
						name += ": " + cssVar.typeValues.join(" | ");
					}
					else {
						name += ": " + cssVar.type
					}
				}
				addProp(name, cssVar.documentation);

				if (cssVar.chainValues) {
					result += `   - ${cssVar.chainValues.join(" < ")}\n`
				}
			}
		}
		// add cssPart // not ready

		// add method
		const addMethod = (methods: MethodInfo[], title: string) => {
			if (methods.length > 0) {
				addTitle(title);
				for (let method of methods) {
					const parameters: string[] = [];
					if (method.node.parameters.length > 0) {
						for (let p of method.node.parameters) {
							let txt = p.name.getText();

							if (p.questionToken) {
								txt += "?";
							}
							if (p.type) {
								txt += ": " + this.getTypeTxt(new TypeInfo(p.type))
							}
							if (p.initializer) {
								txt += " = " + p.initializer.getText();
							}
							parameters.push(txt);
						}
					}
					let descr = `${method.name}(${parameters.join(", ")})`;
					if (method.node.type) {
						const type = this.getTypeTxt(new TypeInfo(method.node.type));
						descr += ": " + type;
					}
					addProp(descr, method.documentation?.definitions.join("\n"))
				}
			}
		}
		addMethod(methods, "Methods");
		addMethod(methodsStatic, "Static Methods");

		if (result.endsWith("\n")) {
			result = result.substring(0, result.length - 1);
		}

		return result;
	}

	private getTypeTxt(typeInfo: TypeInfo) {
		return this.manifest.getTypeTxt(typeInfo);
	}
}