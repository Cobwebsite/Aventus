import { AventusFile } from '../files/AventusFile';
import { AventusConfigBuildCompileOutputNpmManifest } from '../language-services/json/definition';
import { CustomCssProperty } from '../language-services/scss/helper/CSSNode';
import { AventusWebComponentLogicalFile } from '../language-services/ts/component/File';
import { AventusTsFile } from '../language-services/ts/File';
import { ClassInfo } from '../language-services/ts/parser/ClassInfo';
import { AttributeDecorator } from '../language-services/ts/parser/decorators/AttributeDecorator';
import { OverrideViewDecorator } from '../language-services/ts/parser/decorators/OverrideViewDecorator';
import { PropertyDecorator } from '../language-services/ts/parser/decorators/PropertyDecorator';
import { MethodInfo } from '../language-services/ts/parser/MethodInfo';
import { PropertyInfo } from '../language-services/ts/parser/PropertyInfo';
import { TypeInfo } from '../language-services/ts/parser/TypeInfo';
import { Build } from '../project/Build';
import { CustomElements } from './CustomElements';
import { HtmlCustomData } from './HtmlCustomData';

type SlotsInfo = { [name: string]: { local: boolean, doc?: string } }
export type ManifestInfo = {
	fullName: string,
	class: ClassInfo,
	attributes: (PropertyInfo & { local: boolean })[],
	props: (PropertyInfo & { local: boolean })[],
	propsStatic: (PropertyInfo & { local: boolean })[],
	methods: (MethodInfo & { local: boolean })[],
	methodsStatic: (MethodInfo & { local: boolean })[],
	cssProperties: (CustomCssProperty & { local: boolean })[],
	slots: SlotsInfo
};

export class Manifest {

	private customElements: CustomElements;
	private htmlCustomData: HtmlCustomData;
	public configFile: AventusFile;
	public manifestConfig: AventusConfigBuildCompileOutputNpmManifest;
	public build: Build;
	public constructor(manifest: AventusConfigBuildCompileOutputNpmManifest, build: Build) {
		this.build = build;
		this.customElements = new CustomElements(this);
		this.htmlCustomData = new HtmlCustomData(this);
		this.manifestConfig = manifest;
		this.configFile = this.build.project.getConfigFile();
	}

	public register(file: AventusTsFile) {
		if (file instanceof AventusWebComponentLogicalFile && file.fileParsed) {
			const _class = file.fileParsed.classes[file.componentClassName];
			if (!_class) return;
			const attributes: (PropertyInfo & { local: boolean })[] = [];
			const props: (PropertyInfo & { local: boolean })[] = [];
			const propsStatic: (PropertyInfo & { local: boolean })[] = [];
			const methods: (MethodInfo & { local: boolean })[] = [];
			const methodsStatic: (MethodInfo & { local: boolean })[] = [];
			const cssProperties: (CustomCssProperty & { local: boolean })[] = [];
			let slots: { [name: string]: { local: boolean, doc?: string } } = {};
			const preventSlots: string[] = [];
			let noMoreSlots: boolean = false;
			let classTemp: ClassInfo | null = _class;
			while (classTemp && classTemp.fullName != 'Aventus.WebComponent') {
				for (let name in classTemp.properties) {
					const prop = { ...classTemp.properties[name] } as (PropertyInfo & { local: boolean });
					prop.local = classTemp == _class;
					if (prop.isPrivate || prop.isProtected) continue;
					const deco = prop.decorators.find(p => PropertyDecorator.is(p) || AttributeDecorator.is(p))
					if (deco) {
						attributes.push(prop)
					}
					else {
						props.push(prop);
					}
				}
				for (let name in classTemp.propertiesStatic) {
					const prop = { ...classTemp.propertiesStatic[name] } as (PropertyInfo & { local: boolean });
					prop.local = classTemp == _class;
					if (prop.isPrivate || prop.isProtected) continue;
					propsStatic.push(prop);
				}
				for (let name in classTemp.methods) {
					const method = { ...classTemp.methods[name] } as (MethodInfo & { local: boolean });
					method.local = classTemp == _class;
					if (method.isPrivate || method.isProtected) continue;
					methods.push(method);
				}
				for (let name in classTemp.methodsStatic) {
					const method = { ...classTemp.methodsStatic[name] } as (MethodInfo & { local: boolean });
					method.local = classTemp == _class;
					if (method.isPrivate || method.isProtected) continue;
					methodsStatic.push(method);
				}
				const tsfile = this.build.tsFiles[classTemp.fileUri];
				if (tsfile instanceof AventusWebComponentLogicalFile) {
					if (tsfile.SCSSFile) {
						for (let property of tsfile.SCSSFile.customProperties) {
							const cssProperty = { ...property } as (CustomCssProperty & { local: boolean });
							cssProperty.local = classTemp == _class;
							cssProperties.push(cssProperty);
						}
					}
					if (tsfile.HTMLFile?.fileParsed?.slotsInfo && !noMoreSlots) {
						for (let name in tsfile.HTMLFile.fileParsed.slotsInfo) {
							if (preventSlots.includes(name)) continue;
							if (!slots[name]) {
								slots[name] = {
									local: classTemp == _class,
								}
							}
							if (!slots[name].doc && classTemp.documentation?.documentationSlots[name]) {
								slots[name].doc = classTemp.documentation?.documentationSlots[name];
							}
						}
						for (let name in tsfile.HTMLFile.fileParsed.blocksInfo) {
							// if there is no slot name X inside children
							if (!slots[name]) {
								// we prevent adding slot
								preventSlots.push(name);
							}
						}
					}
				}
				if (classTemp.decorators.find(p => OverrideViewDecorator.is(p))) {
					noMoreSlots = true;
				}
				classTemp = classTemp.parentClass;
			}

			const fullName = this.build.noNamespaceUri[file.file.uri] ? _class.fullName : this.build.buildConfig.module + "." + _class.fullName;

			// sort
			attributes.sort((a, b) => a.name.localeCompare(b.name));
			props.sort((a, b) => a.name.localeCompare(b.name));
			propsStatic.sort((a, b) => a.name.localeCompare(b.name));
			methods.sort((a, b) => a.name.localeCompare(b.name));
			methodsStatic.sort((a, b) => a.name.localeCompare(b.name));
			cssProperties.sort((a, b) => a.name.localeCompare(b.name));
			slots = Object.keys(slots).sort().reduce((obj, key) => { obj[key] = slots[key]; return obj; }, {} as SlotsInfo);

			const info: ManifestInfo = { fullName, class: _class, attributes, props, propsStatic, methods, methodsStatic, slots, cssProperties }

			this.customElements.register(file, info)
			this.htmlCustomData.register(file, info)
		}
	}

	public write(dir: string) {
		this.customElements.write(dir);
		this.htmlCustomData.write(dir)
	}

	public getTypeTxt(typeInfo: TypeInfo) {
		let result = "";
		if (typeInfo.kind == "union") {
			const resultTemp: string[] = [];
			for (let type of typeInfo.nested) {
				resultTemp.push(this.getTypeTxt(type))
			}
			result = resultTemp.join(" | ");
		}
		else if (typeInfo.kind == "intersection") {
			const resultTemp: string[] = [];
			for (let type of typeInfo.nested) {
				resultTemp.push(this.getTypeTxt(type))
			}
			result = resultTemp.join(" & ");
		}
		else if (typeInfo.kind == "literal") {
			result = typeInfo.value;
		}
		else if (typeInfo.kind == "type") {
			result = typeInfo.value;
			const generics: string[] = [];
			for (let generic of typeInfo.genericValue) {
				generics.push(this.getTypeTxt(generic));
			}
			if (generics.length > 0) {
				result += `<${generics.join(", ")}>`;
			}
		}
		else if (typeInfo.kind == "typeOperator") {
			result = typeInfo.value;
			if (typeInfo.nested.length > 0) {
				result += `typeof ${this.getTypeTxt(typeInfo.nested[0])}`;
			}
		}
		else if (typeInfo.kind == "tuple") {
			const tuples: string[] = [];
			for (let nested of typeInfo.nested) {
				tuples.push(this.getTypeTxt(nested));
			}
			result = `[${tuples.join(", ")}]`;
		}
		else if (typeInfo.kind == "conditional") {
			const cond = typeInfo.conditionalType!;
			result = `${this.getTypeTxt(cond.check)} extends ${this.getTypeTxt(cond.extends)} ? ${this.getTypeTxt(cond.true)} : ${this.getTypeTxt(cond.false)}`
		}
		else if (typeInfo.kind == "mappedType") {
			const map = typeInfo.mappedType!;
			result = `{ [${map.parameterName} in ${this.getTypeTxt(map.parameterType)}]${map.modifier ?? ''}: ${this.getTypeTxt(map.type)} }`;
		}
		else if (typeInfo.kind == "indexedAccess") {
			result = `${this.getTypeTxt(typeInfo.nested[0])}[${this.getTypeTxt(typeInfo.nested[1])}]`;
		}
		else if (typeInfo.kind == "infer") {
			result = `infer ${typeInfo.value}]`;
		}
		else if (
			typeInfo.kind == "typeLiteral" ||
			typeInfo.kind == "constructor" ||
			typeInfo.kind == "function"
		) {
			result = typeInfo.value;
		}
		else {
			result = typeInfo.kind;
		}

		if (typeInfo.isArray) {
			result += "[]";
		}
		return result;
	}
}