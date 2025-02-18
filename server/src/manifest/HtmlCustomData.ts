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

		const description = this.manifest.generateDescription(info);
		if (description) tag.description = description;

		this._package.tags.push(tag);
	}


	private getTypeTxt(typeInfo: TypeInfo) {
		return this.manifest.getTypeTxt(typeInfo);
	}
}