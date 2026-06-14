import { join } from 'path';
import { AventusTsFile } from '../language-services/ts/File';
import { writeFile } from '../tools';
import { Manifest, ManifestInfo } from './Manifest';
import { AventusWebComponentLogicalFile } from '../language-services/ts/component/File';
import { TypeInfo } from '../language-services/ts/parser/TypeInfo';
import { GenericHtmlContributionOrProperty, GenericHtmlContributions, HtmlAttribute, HtmlElement, JSONSchemaForWebTypes, JsProperty } from './WebTypesSchema';


export class WebTypes {

	private manifest: Manifest;
	private _package: JSONSchemaForWebTypes;
	public constructor(manifest: Manifest) {
		this.manifest = manifest;
		this._package = {
			$schema: "https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json",
			name: "",
			version: "2.20.0",
			"description-markup": "markdown",
			contributions: {
				html: {
					elements: []
				},
			},
		}
	}

	public write(dir: string) {
		writeFile(join(dir, "web-types.json"), JSON.stringify(this._package, null, 2), "build", this.manifest.build.buildConfig.fullname);
	}

	public register(file: AventusWebComponentLogicalFile, info: ManifestInfo) {
		if (!this._package.contributions?.html?.elements) return;

		const compilationResult = file.compileResult.find(p => p.classScript.split('.').pop() == file.componentClassName)!;
		if (!compilationResult) return;
		const element: HtmlElement = {
			name: compilationResult.tagName,
			description: this.manifest.generateDescription(info),
			"doc-url": "",
		}
		if (info.class.isAbstract) {
			element.abstract = true;
		}

		// attributes
		const attributes: HtmlAttribute[] = [];
		for (let attribute of info.attributes) {
			const _attribute: HtmlAttribute = {
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

			const values: { type: string, default?: string }[] = [];
			if (attribute.type.kind == "literal") {
				let value = attribute.type.value;
				if (value.startsWith("'") || value.startsWith('"')) {
					value = value.substring(1);
				}
				if (value.endsWith("'") || value.endsWith('"')) {
					value = value.substring(0, value.length - 1);
				}
				values.push({ type: value });
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
					values.push({ type: value });
				}
			}

			if (values.length > 0) {
				_attribute.values = values;
			}

		}
		if (attributes.length > 0) {
			element.attributes = attributes;
		}
		// slots
		const slots: GenericHtmlContributionOrProperty[] = [];
		for (let name in info.slots) {
			if (!info.slots[name].local) continue;
			const slot: GenericHtmlContributionOrProperty = { name };
			if (info.slots[name].doc) {
				slot.description = info.slots[name].doc
			}
			slots.push(slot);
		}
		if (slots.length > 0) {
			element.slots = slots;
		}

		// properties
		const props: JsProperty[] = []
		for (let prop of info.props) {
			const temp: JsProperty = {};
			temp.name = prop.name
			if (prop.isAbstract) {
				temp.abstract = prop.isAbstract;
			}
			if (prop.documentation) temp.description = prop.documentation.definitions.join("\n");
			temp.type = this.getTypeTxt(prop.type)

			props.push(temp);
		}
		if (props.length > 0) {
			if (!element.js) element.js = {};
			element.js.properties = props;
		}

		// events		
		

		this._package.contributions.html.elements.push(element);
	}


	private getTypeTxt(typeInfo: TypeInfo) {
		return this.manifest.getTypeTxt(typeInfo);
	}
}