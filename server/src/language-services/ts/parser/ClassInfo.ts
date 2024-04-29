import { ClassDeclaration, forEachChild, SyntaxKind, MethodDeclaration, PropertyDeclaration, HeritageClause, InterfaceDeclaration, ConstructorDeclaration, ExpressionWithTypeArguments, TypeNode, TypeReferenceNode, CallExpression, GetAccessorDeclaration, SetAccessorDeclaration, FunctionBody } from "typescript";
import { BaseInfo, InfoType } from "./BaseInfo";
import { MethodInfo } from "./MethodInfo";
import { ParserTs } from "./ParserTs";
import { PropertyInfo } from "./PropertyInfo";
import { ConvertibleDecorator } from './decorators/ConvertibleDecorator';
import { AventusTsLanguageService } from '../LanguageService';


export class ClassInfo extends BaseInfo {
	/** always fullname */
	public extends: string[] = [];
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

	constructor(node: ClassDeclaration | InterfaceDeclaration, namespaces: string[], parserInfo: ParserTs) {
		super(node, namespaces, parserInfo, false);

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
					this.addDependanceWaitName(x as ExpressionWithTypeArguments, true, (names) => {
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
}