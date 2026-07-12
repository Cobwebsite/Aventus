import { join } from 'path';
import { GenericServer } from '../GenericServer';
import { AventusPackageFile, AventusPackageTsFileExport } from '../language-services/ts/package/File';
import { uriToPath, writeFile } from '../tools';
import { EmmetCustomDataSchema } from './EmmetCustomDataSchema';
import { existsSync, mkdirSync } from 'fs';
import { EOL } from 'os';
import { InfoType } from '../language-services/ts/parser/BaseInfo';
import { PropertyDecorator } from '../language-services/ts/parser/decorators/PropertyDecorator';
import { AttributeDecorator } from '../language-services/ts/parser/decorators/AttributeDecorator';
import { WatchDecorator } from '../language-services/ts/parser/decorators/WatchDecorator';
import { SignalDecorator } from '../language-services/ts/parser/decorators/SignalDecorator';
import { PropertyInfo } from '../language-services/ts/parser/PropertyInfo';
import { MethodInfo } from '../language-services/ts/parser/MethodInfo';
import { SCSSDoc } from '../language-services/scss/helper/CSSCustomNode';
import { TypeInfo } from '../language-services/ts/parser/TypeInfo';
import { TypeNode } from 'typescript';

export class ManifestPackage {

	public static files: Record<string, AventusPackageFile> = {};
	public static done: boolean = false;

	public static register(file: AventusPackageFile) {
		if (!this.files[file.file.uri]) {
			this.files[file.file.uri] = file;
			if (this.done) {
				this.write();
			}
		}
	}

	public static write() {
		const result: EmmetCustomDataSchema = {
			html: {
				snippets: {
					"block": `<block name="\${1}">\${2}</block>`
				}
			}
		};
		let canWrite: boolean = false;
		for (const uri in this.files) {
			const exports = this.files[uri].srcInfo.available;
			for (const info of exports) {
				if (info.tagName) {
					const tag = info.tagName;
					result.html.snippets[tag] = `<${tag}>\${1}</${tag}>`
					canWrite = true;
				}
			}
		}

		if (canWrite) {
			const dir = uriToPath(GenericServer.getWorkspaceUri());
			const emmetPath = join(dir, ".aventus", "emmet");
			if (!existsSync(emmetPath)) {
				mkdirSync(emmetPath, { recursive: true })
			}
			writeFile(join(emmetPath, "snippets.json"), JSON.stringify(result, null, 2), "manifest");
			this.done = true;
		}

	}

	public static getMarkdown(uri: string): string {
		if (this.files[uri]) {
			const md = new ManifestPackageMd(this.files[uri]);
			return md.getContent();
		}
		return "";
	}

}

type ManifestRoot = {
	name: string,
	example?: string,
	description?: string,
}

type ManifestProp = {
	name: string,
	type: string,
	description: string,
	decorator?: string
}
type ManifestMethod = {
	name: string,
	result: string,
	isAbstract?: boolean,
	description?: string,
}



type ManifestSlot = {
	name: string,
	description?: string,
}

type ManifestClass = ManifestRoot & {
	isWebComponent: boolean,
	tag?: string,
	type: string,
	import: string,
	parent?: string,
	impl: string,
	cssProps?: ManifestProp[],
	htmlSlots?: ManifestSlot[],
	jsProps?: ManifestProp[],
	jsPropsStatic?: ManifestProp[],
	jsMethods?: ManifestMethod[],
	jsMethodsStatic?: ManifestMethod[],
}

type ManifestFunction = ManifestRoot & ManifestMethod & {
}

export class ManifestPackageMd {
	private file: AventusPackageFile;

	private content: string[] = [];

	private overviews: { name: string, type: string, description?: string }[] = []
	private parts: (ManifestClass | ManifestFunction)[] = []
	private scss: SCSSDoc

	public constructor(file: AventusPackageFile) {
		this.file = file;
		this.scss = file.build.scssLanguageService.getExternalDefinition(this.file.file.uri) ?? {};

		const exports = this.file.srcInfo.available;
		if (this.file.fileParsed) {
			for (const info of exports) {
				if (info.type == InfoType.class || info.type == InfoType.classData || info.type == InfoType.interface) {
					this.loadClass(info);
				}
				else if (info.type == InfoType.function) {
					this.loadFunction(info);
				}
				
				// else if (info.type == InfoType.enum) {
				// 	this.loadEnum(info);
				// }
				// else if (info.type == InfoType.variable) {
				// 	this.loadVariable(info);
				// }
			}
		}

		if (this.overviews.length > 0) {
			this.writeOverview();
			this.writeContent();
		}
	}

	private isManifestClass(item: ManifestRoot): item is ManifestClass {
		return (item as ManifestClass).isWebComponent !== undefined;
	}
	private isManifestFunction(item: ManifestRoot): item is ManifestFunction {
		return (item as ManifestFunction).result !== undefined;
	}

	private getType(node: TypeNode | TypeInfo): string {
		if (!(node instanceof TypeInfo)) {
			node = new TypeInfo(node);
		}
		let result = node.getFullTxt().trim();
		if (result.startsWith("___")) {
			result = result.substring(3);
		}
		result = result.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\|/g, "&vert;")
		return result;
	}
	private loadFunction(info: AventusPackageTsFileExport): void {
		const _function = this.file.fileParsed!.functions[info.fullName];

		let name = _function.fullName;

		if (_function.node.typeParameters) {
			const generics: string[] = []
			for (let param of _function.node.typeParameters) {
				let temp = param.name.getText();
				if (param.constraint) {
					temp += " extends " + this.getType(param.constraint)
				}
				if (param.default) {
					temp += " = " + this.getType(param.default)
				}
				generics.push(temp);
			}
			if (generics.length > 0) {
				name += `<${generics.join(", ")}>`
			}
		}
		const parameters: string[] = []

		for (let param of _function.node.parameters) {
			let temp = param.name.getText();
			if (param.type) {
				temp += ": " + this.getType(param.type)
			}
			else {
				temp += ": any";
			}
			parameters.push(temp)
		}
		name += `(${parameters.join(", ")})`
		// todo load example
		const temp: ManifestFunction = {
			name: name,
			result: _function.node.type ? this.getType(_function.node.type) : "any",
			description: _function.documentation?.definitions.join(EOL) ?? "",
			isAbstract: false
		};
		this.parts.push(temp);
	}

	private loadClass(info: AventusPackageTsFileExport) {
		const _class = this.file.fileParsed!.classes[info.fullName];

		let name = _class.fullName;
		if (_class.node.typeParameters) {
			const generics: string[] = []
			for (let param of _class.node.typeParameters) {
				let temp = param.name.getText();
				if (param.constraint) {
					temp += " extends " + this.getType(param.constraint)
				}
				if (param.default) {
					temp += " = " + this.getType(param.default)
				}
				generics.push(temp);
			}
			if (generics.length > 0) {
				name += `<${generics.join(", ")}>`
			}
		}

		const temp: ManifestClass = {
			name: name,
			isWebComponent: _class.isWebcomponent,
			tag: info.tagName ? `&lt;${info.tagName}&gt;&lt;/${info.tagName}&gt;` : undefined,
			type: _class.isInterface ? "Interface" : "Class",
			description: _class.documentation?.definitions.join(EOL) ?? "",
			import: `import { ${_class.name} } from "${this.file.name}:${_class.namespace}.package.avt"`,
			parent: _class.parentClass?.fullName,
			impl: _class.implementsType.map(p => this.getType(p)).join(", "),
		}

		if (Object.keys(_class.properties).length > 0) {
			temp.jsProps = [];
			for (let name in _class.properties) {
				const prop = this.loadProperty(_class.properties[name]);
				if (prop) {
					temp.jsProps.push(prop);
				}
			}
		}
		if (Object.keys(_class.propertiesStatic).length > 0) {
			temp.jsPropsStatic = [];
			for (let name in _class.propertiesStatic) {
				const prop = this.loadProperty(_class.propertiesStatic[name]);
				if (prop) {
					temp.jsPropsStatic.push(prop);
				}
			}
		}

		if (Object.keys(_class.methods).length > 0) {
			temp.jsMethods = [];
			for (let name in _class.methods) {
				const method = this.loadMethod(_class.methods[name]);
				if (method) {
					temp.jsMethods.push(method);
				}
			}
		}

		if (Object.keys(_class.methodsStatic).length > 0) {
			temp.jsMethodsStatic = [];
			for (let name in _class.methodsStatic) {
				const method = this.loadMethod(_class.methodsStatic[name]);
				if (method) {
					temp.jsMethodsStatic.push(method);
				}
			}
		}

		if (_class.isWebcomponent) {
			if (info.tagName && this.scss[info.tagName] && this.scss[info.tagName].length > 0) {
				const variables = this.scss[info.tagName];
				temp.cssProps = [];
				for (let variable of variables) {
					temp.cssProps.push({
						name: variable.name,
						type: variable.type ?? '',
						description: variable.documentation ?? "",
					})
				}
			}

			if (info.slots && Object.keys(info.slots).length > 0) {
				temp.htmlSlots = [];

				for (let name in info.slots) {
					temp.htmlSlots.push({
						name: name,
						description: info.slots[name].doc
					})
				}
			}
		}

		this.overviews.push({
			name: _class.fullName,
			type: temp.isWebComponent ? temp.type + " (Webcomponent)" : temp.type,
			description: temp.tag ? temp.description + " (" + temp.tag + ")" : temp.description
		})

		this.parts.push(temp);
	}
	private loadProperty(prop: PropertyInfo): ManifestProp | null {
		if (prop.isPrivate || prop.isProtected) return null;

		let decorator: string | undefined = undefined;
		if (prop.decorators.find(p => PropertyDecorator.is(p))) {
			decorator = "@Property()"
		}
		if (prop.decorators.find(p => AttributeDecorator.is(p))) {
			decorator = "@Attribute()"
		}
		if (prop.decorators.find(p => WatchDecorator.is(p))) {
			decorator = "@Watch()"
		}
		if (prop.decorators.find(p => SignalDecorator.is(p))) {
			decorator = "@Signal()"
		}
		return {
			name: prop.name,
			type: this.getType(prop.type),
			description: prop.documentation?.definitions.join(EOL) ?? "",
			decorator: decorator
		}
	}
	private loadMethod(method: MethodInfo): ManifestMethod | null {
		if (method.isPrivate || method.isProtected) return null;

		let name = method.name;

		if (method.node.typeParameters) {
			const generics: string[] = []
			for (let param of method.node.typeParameters) {
				let temp = param.name.getText();
				if (param.constraint) {
					temp += " extends " + this.getType(param.constraint)
				}
				if (param.default) {
					temp += " = " + this.getType(param.default)
				}
				generics.push(temp);
			}
			if (generics.length > 0) {
				name += `<${generics.join(", ")}>`
			}
		}
		const parameters: string[] = []

		for (let param of method.node.parameters) {
			let temp = param.name.getText();
			if (param.type) {
				temp += ": " + this.getType(param.type)
			}
			else {
				temp += ": any";
			}
			parameters.push(temp)
		}
		name += `(${parameters.join(", ")})`
		return {
			name: name,
			result: method.node.type ? this.getType(method.node.type) : "any",
			description: method.documentation?.definitions.join(EOL) ?? "",
			isAbstract: method.isAbstract
		};
	}

	public getContent(): string {
		return this.content.join(EOL);
	}

	private writeOverview() {
		this.add("# " + this.file.name)
		this.line();
		if (this.file.description) {
			this.add(this.file.description)
			this.line();
		}
		this.add("## Overview")
		this.line();
		this.addColumnsHeader(["Nom", "Type", "Description"])
		this.overviews.sort((a, b) => a.name.localeCompare(b.name))
		for (let overview of this.overviews) {
			this.addColumns([
				`[${overview.name}](${overview.name.toLowerCase()})`,
				overview.type,
				overview.description ?? ''
			])
		}
		this.line();
	}

	private writeContent() {
		this.parts.sort((a, b) => a.name.localeCompare(b.name))

		for (let part of this.parts) {

			this.add("## " + part.name)
			this.line();

			if (part.description) {
				this.add(`${part.description}`)
				this.line();
			}

			if (this.isManifestClass(part)) {
				this.writeClass(part)
			} else if (this.isManifestFunction(part)) {
				this.writeFunction(part)
			}

			if (part.example) {
				this.add("### Example")
				this.line();
				this.add(part.example);
			}
		}
	}

	private writeClass(part: ManifestClass) {
		if (part.isWebComponent) {
			this.add(` - Type : ${part.type} (Webcomponent)`)
		}
		else {
			this.add(` - Type : ${part.type}`)
		}
		if (part.tag)
			this.add(` - Tag : ${part.tag}`)

		this.add(` - Import : ${part.import}`)
		if (part.parent)
			this.add(` - Parent : ${part.parent}`)
		if (part.impl)
			this.add(` - Implements : ${part.impl}`)

		const withDeco: boolean = part.isWebComponent;

		this.line();


		if (part.jsProps && part.jsProps.length > 0) {
			this.add("### JS Props")
			this.line();
			this.writeProps(part.jsProps, withDeco);
			this.line();
		}

		if (part.jsMethods && part.jsMethods.length > 0) {
			this.add("### Methods")
			this.line();
			this.writeMethods(part.jsMethods);
			this.line();
		}

		if (part.jsPropsStatic && part.jsPropsStatic.length > 0) {
			this.add("### JS Props Static")
			this.line();
			this.writeProps(part.jsPropsStatic, withDeco);
			this.line();
		}

		if (part.jsMethodsStatic && part.jsMethodsStatic.length > 0) {
			this.add("### Methods Static")
			this.line();
			this.writeMethods(part.jsMethodsStatic);
			this.line();
		}

		if (part.htmlSlots && part.htmlSlots.length > 0) {
			this.add("### HTML Slots")
			this.line();
			this.addColumnsHeader(["Name", "Description"]);
			for (let slot of part.htmlSlots) {
				this.addColumns([
					slot.name,
					slot.description ?? '',
				])
			}
			this.line();
		}

		if (part.cssProps && part.cssProps.length > 0) {
			this.add("### CSS Props")
			this.line();
			this.writeProps(part.cssProps, false);
			this.line();
		}
	}
	private writeFunction(part: ManifestFunction) {
		this.add(` - Return : ${part.result}`)
	}

	private writeProps(props: ManifestProp[], withDeco: boolean) {
		if (props.length == 0) return;

		if (withDeco) {
			this.addColumnsHeader(["Name", "Type", "Description", "Decorator"]);
			for (let prop of props) {
				this.addColumns([
					prop.name,
					prop.type,
					prop.description,
					prop.decorator ?? ''
				])
			}
		}
		else {
			this.addColumnsHeader(["Name", "Type", "Description"]);
			for (let prop of props) {
				this.addColumns([
					prop.name,
					prop.type,
					prop.description
				])
			}
		}

	}
	private writeMethods(methods: ManifestFunction[]) {
		if (methods.length == 0) return;

		this.addColumnsHeader(["Name", "Return", "Description"]);
		for (let method of methods) {
			let description = method.description ?? '';
			if (method.isAbstract) {
				description = "(abstract) " + description
			}
			this.addColumns([
				method.name,
				method.result,
				description
			])
		}
	}

	private line() {
		this.content.push("")
	}
	private add(txt: string) {
		this.content.push(txt)
	}

	private addColumns(cols: string[]) {
		let txt = `| ${cols.map(p => p.replace(/\r\n|\n/g, '').replace(/ {2,}/g, ' ').trim()).join(" | ")} |`;
		this.add(txt);
	}
	private addColumnsHeader(cols: string[]) {
		this.addColumns(cols);
		const split: string[] = [];
		for (let i = 0; i < cols.length; i++) {
			split.push("---")
		}
		let txt = `| ${split.join(" | ")} |`;
		this.add(txt);
	}
}