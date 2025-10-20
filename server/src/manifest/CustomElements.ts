import { AventusExtension } from '../definition';
import { AventusWebComponentLogicalFile } from '../language-services/ts/component/File';
import { AventusTsFile } from '../language-services/ts/File';
import { BaseInfo } from '../language-services/ts/parser/BaseInfo';
import { ClassInfo } from '../language-services/ts/parser/ClassInfo';
import { MethodInfo } from '../language-services/ts/parser/MethodInfo';
import { PropertyInfo } from '../language-services/ts/parser/PropertyInfo';
import { TypeInfo } from '../language-services/ts/parser/TypeInfo';
import { uriToPath, writeFile } from '../tools';
import { Attribute, ClassMember, CssCustomProperty, Declaration, Export, Module, Package, Parameter, Slot } from './CustomElementsSchema';
import { Manifest, ManifestInfo } from './Manifest';
import { join } from 'path';

export class CustomElements {

	private manifest: Manifest;
	private _package: Package;
	public constructor(manifest: Manifest) {
		this.manifest = manifest;
		this._package = {
			modules: [],
			schemaVersion: "1.0.0",
			readme: ""
		}
	}
	public write(dir: string) {
		writeFile(join(dir, "custom-elements.json"), JSON.stringify(this._package, null, 2), "build", this.manifest.build.buildConfig.name);
	}

	public register(file: AventusTsFile, info: ManifestInfo) {
		if (!file.fileParsed) return;
		if (!(file instanceof AventusWebComponentLogicalFile)) return
		const _class = info.class;
		const compilationResult = file.compileResult.find(p => p.classScript.split('.').pop() == file.componentClassName)!;
		if (!compilationResult) return;


		const _module: Module = {
			kind: "javascript-module",
			path: this.getLocalUri(file.file.uri),
			declarations: [],
			exports: []
		}

		//#region declaration
		const declaration: Declaration = {
			kind: "class",
			description: "",
			name: _class.name,
			customElement: true,
		}

		if (_class.documentation) declaration.summary = _class.documentation?.definitions.join("\n");
		if (compilationResult.tagName) declaration.tagName = compilationResult.tagName;

		//#region source
		if (this.manifest.manifestConfig.srcBaseUrl) {
			declaration.source = {
				href: this.getSourceUri(file.file.uri)
			}
		}
		//#endregion

		//#region superclass
		if (_class.extends && _class.extends.length > 0) {
			let parent = BaseInfo.getInfoByFullName(_class.extends[0], _class);
			if (parent && parent instanceof ClassInfo) {

				declaration.superclass = { name: parent.name };

				if (parent.fileUri.endsWith(AventusExtension.Package)) {
					const _package = this.manifest.build.externalPackageInformation.getByUri(parent.fileUri);
					if (_package && _package.npmUri) {
						declaration.superclass.package = _package.npmUri;
					}
				}
				else {
					declaration.superclass.module = this.getLocalUri(parent.fileUri);
				}
			}
		}
		//#endregion

		// cssParts // not ready
		// cssStates // not ready

		//#region cssProperties
		const cssProperties: CssCustomProperty[] = [];
		for (let property of info.cssProperties) {
			if (!property.local) continue;

			const cssProperty: CssCustomProperty = {
				name: property.name,
			}
			if (property.defaultValue) cssProperty.default = property.defaultValue;
			if (property.documentation) cssProperty.description = property.documentation;
			if (property.type) cssProperty.syntax = property.type;

			cssProperties.push(cssProperty);
		}
		if (cssProperties.length > 0) {
			declaration.cssProperties = cssProperties;
		}
		//#endregion

		//#region attributes
		const _attributes: Attribute[] = [];
		for (let attribute of info.attributes) {
			if (!attribute.local) continue;
			const _attribute: Attribute = {
				name: attribute.name,
				fieldName: attribute.name,
				type: { text: this.getTypeTxt(attribute.type) }
			}
			if (attribute.defaultValue) _attribute.default = attribute.defaultValue;
			if (attribute.documentation) _attribute.description = attribute.documentation.definitions.join("\n");
			if (attribute.isOverride) {
				const parent = _class.getFieldParentClass(attribute.name);
				if (parent) {
					_attribute.inheritedFrom = {
						name: parent.name,
					}
					if (parent.fileUri.endsWith(AventusExtension.Package)) {
						const _package = this.manifest.build.externalPackageInformation.getByUri(parent.fileUri);
						if (_package && _package.npmUri) {
							_attribute.inheritedFrom.package = _package.npmUri;
						}
					}
					else {
						_attribute.inheritedFrom.module = this.getLocalUri(parent.fileUri);
					}
				}
			}
			_attributes.push(_attribute);
		}

		if (_attributes.length > 0) {
			declaration.attributes = _attributes;
		}
		//#endregion

		//#region members
		const members: ClassMember[] = [];
		const loadProperty = (property: PropertyInfo & { local: boolean }, isStatic: boolean) => {
			if (!property.local) return;
			const name = property.name;
			const member: ClassMember = {
				kind: "field",
				name: property.name,
				static: isStatic,
			}
			if (property.defaultValue) member.default = property.defaultValue;
			if (property.documentation) member.description = property.documentation.definitions.join("\n");
			if (property.isPrivate) member.privacy = 'private';
			else if (property.isProtected) member.privacy = 'protected';
			else member.privacy = 'public';

			if (property.isOverride) {
				const parent = isStatic ? _class.getStaticFieldParentClass(name) : _class.getFieldParentClass(name);
				if (parent) {
					member.inheritedFrom = {
						name: parent.name,
					}
					if (parent.fileUri.endsWith(AventusExtension.Package)) {
						const _package = this.manifest.build.externalPackageInformation.getByUri(parent.fileUri);
						if (_package && _package.npmUri) {
							member.inheritedFrom.package = _package.npmUri;
						}
					}
					else {
						member.inheritedFrom.module = this.getLocalUri(parent.fileUri);
					}
				}
			}

			member.type = {
				text: this.getTypeTxt(property.type)
			}

			members.push(member);
		}
		for (let prop of info.props) {
			// TODO maybe remove attribues
			loadProperty(prop, false);
		}
		for (let prop of info.propsStatic) {
			loadProperty(prop, true);
		}
		const loadMethod = (method: MethodInfo & { local: boolean }, isStatic: boolean) => {
			if (!method.local) return;
			const name: string = method.name;
			const member: ClassMember = {
				kind: "method",
				name: method.name,
				static: isStatic,
			}
			if (method.documentation) member.description = method.documentation.definitions.join("\n");
			if (method.isPrivate) member.privacy = 'private';
			else if (method.isProtected) member.privacy = 'protected';
			else member.privacy = 'public';

			if (method.node.type) {
				const type = new TypeInfo(method.node.type);
				member.return = {
					type: { text: this.getTypeTxt(type) }
				}
				if (method.documentation?.documentationReturn) {
					member.return.description = method.documentation.documentationReturn;
				}
			}

			if (method.node.parameters.length > 0) {
				member.parameters = [];
				for (let p of method.node.parameters) {
					const name = p.name.getText();
					const parameter: Parameter = {
						name
					}

					if (p.type) {
						parameter.type = {
							text: this.getTypeTxt(new TypeInfo(p.type))
						}
					}

					// doc
					if (method.documentation?.documentationParameters[name]) {
						parameter.description = method.documentation?.documentationParameters[name];
					}

					if (p.questionToken) {
						parameter.optional = true;
					}

					if (p.initializer) {
						parameter.default = p.initializer.getText();
					}

					member.parameters.push(parameter);
				}
			}

			if (method.isOverride) {
				const parent = isStatic ? _class.getStaticMethodParentClass(name) : _class.getMethodParentClass(name);
				if (parent) {
					member.inheritedFrom = {
						name: parent.name,
					}
					if (parent.fileUri.endsWith(AventusExtension.Package)) {
						const _package = this.manifest.build.externalPackageInformation.getByUri(parent.fileUri);
						if (_package && _package.npmUri) {
							member.inheritedFrom.package = _package.npmUri;
						}
					}
					else {
						member.inheritedFrom.module = this.getLocalUri(parent.fileUri);
					}
				}
			}
		}
		for (let method of info.methods) {
			loadMethod(method, false);
		}
		for (let method of info.methodsStatic) {
			loadMethod(method, true);
		}

		if (members.length > 0) {
			declaration.members = members;
		}
		//#endregion

		//#region slots
		const slots: Slot[] = [];
		for (let name in info.slots) {
			if (!info.slots[name].local) continue;
			const slot: Slot = { name };

			slots.push(slot);
		}
		if (slots.length > 0) {
			declaration.slots = slots;
		}
		//#endregion

		// events // not ready

		_module.declarations!.push(declaration)
		//#endregion

		//#region exports
		const _export: Export = {
			kind: "custom-element-definition",
			name: _class.name,
			declaration: {
				name: _class.name,
				module: this.getLocalUri(file.file.uri)
			}
		}

		_module.exports!.push(_export);
		//#endregion

		if (_module.declarations?.length == 0) {
			delete _module.declarations;
		}
		if (_module.exports?.length == 0) {
			delete _module.exports;
		}
		this._package.modules.push(_module);
	}

	private getSourceUri(uri: string) {
		// TODO its wrong
		return this.manifest.manifestConfig.srcBaseUrl + '/' + this.getLocalUri(uri);
	}
	private getLocalUri(uri: string) {
		let rootUri = this.manifest.configFile.uri.replace(AventusExtension.Config, "");
		let localPath = uriToPath(uri.replace(rootUri, '')).replace(/\\/g, '/');
		localPath = localPath.replace(AventusExtension.Base, ".js");
		return "__src/" + localPath;
	}

	// todo add reference
	private getTypeTxt(typeInfo: TypeInfo) {
		return this.manifest.getTypeTxt(typeInfo);
	}
}