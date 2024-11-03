import { ClassDeclaration, forEachChild, SyntaxKind, MethodDeclaration, PropertyDeclaration, HeritageClause, InterfaceDeclaration, ConstructorDeclaration, ExpressionWithTypeArguments, TypeNode, TypeReferenceNode, CallExpression, GetAccessorDeclaration, SetAccessorDeclaration, FunctionBody, PropertySignature, MethodSignature } from "typescript";
import { BaseInfo, InfoType } from "./BaseInfo";
import { MethodInfo } from "./MethodInfo";
import { ParserTs } from "./ParserTs";
import { PropertyInfo } from "./PropertyInfo";
import { ConvertibleDecorator } from './decorators/ConvertibleDecorator';
import { IStoryContentInterface, IStoryContentClass, IStoryContentObject, IStoryContentObjectMethod, IStoryContentReturn, IStoryContentObjectProperty } from '@aventusjs/storybook';
import { TypeInfo } from './TypeInfo';
import { StorybookDecorator } from './decorators/StorybookDecorator';
import * as md5 from 'md5';


export class ClassInfo extends BaseInfo {
	/** always fullname */
	public extends: string[] = [];
	public extendsNpm: string[] = [];
	/** always fullname */
	public implements: string[] = [];
	public parentClass: ClassInfo | null = null;
	public methods: { [methodName: string]: MethodInfo } = {};
	public methodsStatic: { [methodName: string]: MethodInfo } = {};
	public properties: { [propName: string]: PropertyInfo } = {};
	public propertiesStatic: { [propName: string]: PropertyInfo } = {};
	public isInterface: boolean = false;
	public isAbstract: boolean = false;
	private constructorBody: FunctionBody | undefined;
	public parameters: string[] = [];
	private methodParameters: string[] = [];
	public convertibleName: string = '';
	public extendsType?: TypeInfo;
	public implementsType: TypeInfo[] = [];

	public get constructorContent(): string {
		if (!this.constructorBody) {
			return "";
		}
		let txt = this.constructorBody.getText();
		txt = BaseInfo.getContent(txt, this.constructorBody.getStart(), this.constructorBody.getEnd(), this.dependancesLocations, this.compileTransformations);
		return txt;
	}

	public get constructorContentHotReload(): string {
		if (!this.constructorBody) {
			return "";
		}
		let txt = this.constructorBody.getText();
		txt = BaseInfo.getContentHotReload(txt, this.constructorBody.getStart(), this.constructorBody.getEnd(), this.dependancesLocations, this.compileTransformations);
		return txt;
	}

	public get constructorContentNpm(): string {
		if (!this.constructorBody) {
			return "";
		}
		let txt = this.constructorBody.getText();
		txt = BaseInfo.getContentNpm(txt, this.constructorBody.getStart(), this.constructorBody.getEnd(), this.dependancesLocations, this.compileTransformations);
		return txt;
	}

	private node: ClassDeclaration | InterfaceDeclaration;

	constructor(node: ClassDeclaration | InterfaceDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo, false);
		this.node = node;
		this.isInterface = node.kind == SyntaxKind.InterfaceDeclaration;
		this.infoType = this.isInterface ? InfoType.interface : InfoType.class;
		if (node.typeParameters) {
			for (let param of node.typeParameters) {
				this.parameters.push(param.name.getText());
			}
		}
		if (node.modifiers) {
			for (let modifier of node.modifiers) {
				if (modifier.kind == SyntaxKind.AbstractKeyword) {
					this.isAbstract = true;
				}
			}
		}

		if (node.heritageClauses) {
			for (let heritage of node.heritageClauses) {
				this.getClassInheritance(heritage);
			}
		}

		forEachChild(node, x => {
			let isStrong = false;
			let result: PropertyInfo | MethodInfo | null = null;
			if (x.kind == SyntaxKind.Constructor) {
				let cst = x as ConstructorDeclaration;
				if (cst.body) {
					this.constructorBody = cst.body
				}
			}
			else if (x.kind == SyntaxKind.PropertyDeclaration) {
				let propInfo = new PropertyInfo(x as PropertyDeclaration, this.isInterface, this);
				if (propInfo.isStatic) {
					this.propertiesStatic[propInfo.name] = propInfo;
					isStrong = true;
				}
				else {
					this.properties[propInfo.name] = propInfo;
				}
				let prop = x as PropertyDeclaration;
				if (!prop.type) {
					ParserTs.addError(prop.getStart(), prop.getEnd(), "You must define a type for the prop " + propInfo.name);
				}
				result = propInfo;
			}
			else if (x.kind == SyntaxKind.GetAccessor) {
				let prop = x as GetAccessorDeclaration;
				let propInfo = new PropertyInfo(prop, this.isInterface, this);
				if (propInfo.isStatic) {
					this.propertiesStatic[propInfo.name] = propInfo;
				}
				else {
					this.properties[propInfo.name] = propInfo;
				}
				if (!prop.type) {
					ParserTs.addError(prop.getStart(), prop.getEnd(), "You must define a type for the prop " + propInfo.name);
				}
				result = propInfo;
			}
			else if (x.kind == SyntaxKind.SetAccessor) {
				let prop = x as SetAccessorDeclaration;
				let propInfo = new PropertyInfo(prop, this.isInterface, this);
				if (propInfo.isStatic) {
					this.propertiesStatic["°set°" + propInfo.name] = propInfo;
				}
				else {
					this.properties["°set°" + propInfo.name] = propInfo;
				}
				result = propInfo;
			}
			else if (x.kind == SyntaxKind.MethodDeclaration) {
				let method = x as MethodDeclaration;
				if (method.typeParameters) {
					for (let param of method.typeParameters) {
						this.methodParameters.push(param.name.getText());
					}
				}
				let methodInfo = new MethodInfo(x as MethodDeclaration, this);
				if (methodInfo.isStatic) {
					this.methodsStatic[methodInfo.name] = methodInfo;
				}
				else {
					this.methods[methodInfo.name] = methodInfo;
				}
				this.methodParameters = [];
				result = methodInfo;
			}
			else if (x.kind == SyntaxKind.MethodSignature) {
				let method = x as MethodSignature;
				if (method.typeParameters) {
					for (let param of method.typeParameters) {
						this.methodParameters.push(param.name.getText());
					}
				}
				let methodInfo = new MethodInfo(x as MethodDeclaration, this);
				if (methodInfo.isStatic) {
					this.methodsStatic[methodInfo.name] = methodInfo;
				}
				else {
					this.methods[methodInfo.name] = methodInfo;
				}
				this.methodParameters = [];
				result = methodInfo;
			}
			else if (x.kind == SyntaxKind.PropertySignature) {
				let propInfo = new PropertyInfo(x as PropertySignature, this.isInterface, this);
				if (propInfo.isStatic) {
					this.propertiesStatic[propInfo.name] = propInfo;
					isStrong = true;
				}
				else {
					this.properties[propInfo.name] = propInfo;
				}
				let prop = x as PropertyDeclaration;
				if (!prop.type) {
					ParserTs.addError(prop.getStart(), prop.getEnd(), "You must define a type for the prop " + propInfo.name);
				}
				result = propInfo;
			}



			if (result) {
				if (result.accessibilityModifierTransformation) {
					let key = result.accessibilityModifierTransformation.start + "_" + result.accessibilityModifierTransformation.end
					this.compileTransformations[key] = result.accessibilityModifierTransformation
				}
			}
			this.loadOnlyDependancesRecu(x, 0, isStrong);
		});

		this.loadConvertible();

		this.loadDependancesDecorator();
	}
	private getClassInheritance(node: HeritageClause) {
		if (node.token == SyntaxKind.ExtendsKeyword) {
			forEachChild(node, x => {
				if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
					if (this.build.hasStories) {
						this.extendsType = new TypeInfo(x as ExpressionWithTypeArguments);
					}
					this.addDependanceWaitName(x as ExpressionWithTypeArguments, true, (names, namesNpm) => {
						if (names.length > 0) {
							this.extends.push(names[0]);
							if (this.extends.length == 1) {
								// search parent inside local import
								let parent = BaseInfo.getInfoByFullName(names[0], this);
								if (parent && parent instanceof ClassInfo) {
									this.parentClass = parent;

									if (this.parentClass == this) {
										this.parentClass = null;
										throw 'The parent is the child => impossible. Please send it to an admin'
									}
								}
							}
						}
						if (namesNpm.length > 0) {
							this.extendsNpm.push(namesNpm[0]);
						}
					});

					forEachChild(x, y => {
						this.loadOnlyDependancesRecu(y, 0, true);
					})
				}
			})
		}
		else if (node.token == SyntaxKind.ImplementsKeyword) {
			forEachChild(node, x => {
				if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
					if (this.build.hasStories) {
						this.implementsType.push(new TypeInfo(x as ExpressionWithTypeArguments));
					}
					this.addDependanceWaitName(x as ExpressionWithTypeArguments, true, (names) => {
						if (names.length > 0) {
							for (let name of names) {
								this.implements.push(name);
							}
						}
					});

				}
			})
		}
	}

	private loadConvertible() {
		let current: ClassInfo | null = this;
		while (current != null) {
			for (let decorator of current.decorators) {
				let temp = ConvertibleDecorator.is(decorator);
				if (temp) {
					this.convertibleName = temp.name;
					return;
				}
			}
			current = current.parentClass;
		}
	}

	protected addDependanceNameCustomCheck(name: string): boolean {
		if (this.parameters.includes(name) || this.methodParameters.includes(name)) {
			return false;
		}
		return true;
	}

	public hasStaticField(name: string): boolean {
		let classToSearch: ClassInfo | null = this;
		while (classToSearch != null) {
			if (classToSearch.propertiesStatic[name] != undefined) {
				return true;
			}
			classToSearch = classToSearch.parentClass;
		}
		return false;
	}
	public hasField(name: string): boolean {
		return this.getField(name) != null
	}
	public getField(name: string): PropertyInfo | null {
		let classToSearch: ClassInfo | null = this;
		while (classToSearch != null) {
			if (classToSearch.properties[name] != undefined) {
				return classToSearch.properties[name];
			}
			classToSearch = classToSearch.parentClass;
		}
		return null;
	}

	protected defineStoryContent(decorator?: StorybookDecorator): IStoryContentClass | IStoryContentInterface {
		let result: IStoryContentInterface | IStoryContentClass = {
			kind: this.isInterface ? "interface" : "class",
			name: this.name,
		};

		this.setNamespaceForStroy(result);
		this.setDocumentationForStroy(result);
		this.setAccessibilityForStroy(result);

		if (this.isAbstract && result.kind == 'class') {
			result.modifier = "abstract";
		}

		if (this.extendsType) {
			const typeResult = this.transformTypeForStory(this.extendsType, this);
			if (typeResult)
				result.extends = typeResult
		}

		if (this.implementsType.length > 0 && result.kind == 'class') {
			result.implements = [];
			for (let type of this.implementsType) {
				const typeResult = this.transformTypeForStory(type, this);
				if (typeResult)
					result.implements.push(typeResult);
			}
		}

		// generic
		if (this.node.typeParameters) {
			result.generics = [];
			for (let param of this.node.typeParameters) {
				result.generics.push(this.loadGenericForStory(param));
			}
		}

		for (let methodName in this.methods) {
			this.addMethodStoryContent(result, this.methods[methodName]);
		}
		for (let methodName in this.methodsStatic) {
			this.addMethodStoryContent(result, this.methodsStatic[methodName]);
		}

		for (let propName in this.properties) {
			this.addPropertyStoryContent(result, this.properties[propName]);
		}
		for (let propName in this.propertiesStatic) {
			this.addPropertyStoryContent(result, this.propertiesStatic[propName]);
		}


		return result
	}

	protected addMethodStoryContent(result: IStoryContentObject, methodInfo: MethodInfo): void {
		if (!this.canAddToStory(methodInfo)) return;
		// prevent adding generated fct
		let fullname = [this.build.module, this.fullName].join(".");
		if(methodInfo.name.startsWith("__" + md5(fullname) + "method")) {
			return;
		}
		if (!result.methods) {
			result.methods = [];
		}

		const methodInfoResult: IStoryContentObjectMethod = {
			name: methodInfo.name,
			accessibility: methodInfo.isPrivate ? 'private' : methodInfo.isProtected ? 'protected' : 'public',
		}
		result.methods.push(methodInfoResult);

		const addModifier = (mod: 'override' | 'abstract' | 'static') => {
			if (!methodInfoResult.modifiers) {
				methodInfoResult.modifiers = []
			}
			methodInfoResult.modifiers.push(mod);
		}

		if (methodInfo.documentation) {
			methodInfoResult.documentation = methodInfo.documentation.definitions.join("\n");
		}

		if (methodInfo.isAbstract) {
			addModifier('abstract');
		}
		if (methodInfo.isOverride) {
			addModifier('override');
		}
		if (methodInfo.isStatic) {
			addModifier('static')
		}

		// generic
		if (methodInfo.node.typeParameters) {
			methodInfoResult.generics = [];
			for (let param of methodInfo.node.typeParameters) {
				methodInfoResult.generics.push(this.loadGenericForStory(param, methodInfo.documentation));
			}
		}

		// parameters
		if (methodInfo.node.parameters.length > 0) {
			methodInfoResult.parameters = [];
			for (let p of methodInfo.node.parameters) {
				methodInfoResult.parameters.push(this.loadParameterForStory(p, methodInfo.documentation));
			}
		}

		// return type
		if (methodInfo.node.type) {
			const type = new TypeInfo(methodInfo.node.type);
			const typeResult = this.transformTypeForStory(type, this);
			if (typeResult) {
				const returnInfo: IStoryContentReturn = {
					type: typeResult
				}
				if (methodInfo.documentation?.documentationReturn) {
					returnInfo.documentation = methodInfo.documentation?.documentationReturn;
				}
				methodInfoResult.return = returnInfo;
			}
		}

	}

	protected addPropertyStoryContent(result: IStoryContentObject, propInfo: PropertyInfo): void {
		if (!this.canAddToStory(propInfo)) return;

		if (!result.properties) {
			result.properties = [];
		}


		const propertyInfo: IStoryContentObjectProperty = {
			name: propInfo.name,
			accessibility: propInfo.isPrivate ? 'private' : propInfo.isProtected ? 'protected' : 'public',
		}
		result.properties.push(propertyInfo);

		if (propInfo.documentation) {
			propertyInfo.documentation = propInfo.documentation.definitions.join("\n");
		}


		const addModifier = (mod: 'override' | 'abstract' | 'readonly' | 'writeonly' | 'static') => {
			if (!propertyInfo.modifiers) {
				propertyInfo.modifiers = []
			}
			propertyInfo.modifiers.push(mod);
		}
		if (propInfo.isOverride) { addModifier('override') }
		if (propInfo.isAbstract) { addModifier('abstract') }
		if (propInfo.isGet) { addModifier('readonly') }
		if (propInfo.isSet) { addModifier('writeonly') }
		if (propInfo.isStatic) { addModifier('static') }

		const typeResult = this.transformTypeForStory(propInfo.type, this);
		if (typeResult) {
			propertyInfo.type = typeResult;
		}
	}

	protected canAddToStory(info: PropertyInfo | MethodInfo): boolean {
		if (!this.build.buildConfig.stories) return false;
		const format = this.storyType;
		if (format == 'public') {
			if (info.isPrivate || info.isProtected) {
				let decorator = info.decorators.find(p => p.name == "AddToStory");
				return decorator !== undefined;
			}
			else {
				let decorator = info.decorators.find(p => p.name == "NoStory");
				return decorator === undefined;
			}
		}
		else if (format == 'all') {
			let decorator = info.decorators.find(p => p.name == "NoStory");
			return decorator === undefined;
		}
		return false;
	}

	public mergeClassInfo(classInfo: ClassInfo) {

		for (let _extend of classInfo.extends) {
			if (!this.extends.includes(_extend)) {
				this.extends.push(_extend);
			}
		}

		for (let _implement of classInfo.implements) {
			if (!this.implements.includes(_implement)) {
				this.implements.push(_implement);
			}
		}


		this.methods = {
			...classInfo.methods,
			...this.methods
		};
		this.methodsStatic = {
			...classInfo.methodsStatic,
			...this.methodsStatic
		};
		this.properties = {
			...classInfo.properties,
			...this.properties
		};
		this.propertiesStatic = {
			...classInfo.propertiesStatic,
			...this.propertiesStatic
		};
	}
}