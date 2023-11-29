import { ClassDeclaration, Expression, forEachChild, SyntaxKind, Node, MethodDeclaration, PropertyDeclaration, NewExpression, PropertyAccessExpression, HeritageClause, InterfaceDeclaration, ConstructorDeclaration, ExpressionWithTypeArguments, TypeNode, TypeReferenceNode, CallExpression, GetAccessorDeclaration, SetAccessorDeclaration, FunctionBody } from "typescript";
import { BaseInfo, InfoType } from "./BaseInfo";
import { BaseLibInfo } from './BaseLibInfo';
import { DecoratorInfo } from "./DecoratorInfo";
import { MethodInfo } from "./MethodInfo";
import { ParserTs } from "./ParserTs";
import { PropertyInfo } from "./PropertyInfo";
import { TypeInfo } from './TypeInfo';
import { ConvertibleDecorator } from './decorators/ConvertibleDecorator';


export class ClassInfo extends BaseInfo {
	/** always fullname */
	public extends: string[] = [];
	/** always fullname */
	public implements: string[] = [];
	public parentClass: ClassInfo | null = null;
	public methods: { [methodName: string]: MethodInfo } = {};
	public properties: { [propName: string]: PropertyInfo } = {};
	public propertiesStatic: { [propName: string]: PropertyInfo } = {};
	public isInterface: boolean = false;
	public isAbstract: boolean = false;
	public constructorBody: FunctionBody | undefined;
	public parameters: string[] = [];
	private methodParameters: string[] = [];
	public convertibleName: string = '';
	public get constructorContent(): string {
		if (!this.constructorBody) {
			return "";
		}
		let txt = this.constructorBody.getText();
		let transformations: { newText: string, start: number, end: number }[] = [];
		for (let depName in this.dependancesLocations) {
			let replacement = this.dependancesLocations[depName].replacement;
			if (replacement) {
				for (let locationKey in this.dependancesLocations[depName].locations) {
					let location = this.dependancesLocations[depName].locations[locationKey];
					if (location.start >= this.constructorBody.getStart() && location.end <= this.constructorBody.getEnd()) {
						transformations.push({
							newText: replacement,
							start: location.start - this.constructorBody.getStart(),
							end: location.end - this.constructorBody.getStart(),
						})
					}
				}
			}
		}
		transformations.sort((a, b) => b.end - a.end); // order from end file to start file
		for (let transformation of transformations) {
			txt = txt.slice(0, transformation.start) + transformation.newText + txt.slice(transformation.end, txt.length);
		}
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
				}
				else {
					this.properties[propInfo.name] = propInfo;
				}
				let prop = x as PropertyDeclaration;
				if (!prop.type) {
					ParserTs.addError(prop.getStart(), prop.getEnd(), "You must define a type for the prop " + propInfo.name);
				}


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
			}
			else if (x.kind == SyntaxKind.SetAccessor) {
				let prop = x as SetAccessorDeclaration;
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
			}
			else if (x.kind == SyntaxKind.MethodDeclaration) {
				let method = x as MethodDeclaration;
				if (method.typeParameters) {
					for (let param of method.typeParameters) {
						this.methodParameters.push(param.name.getText());
					}
				}
				let methodInfo = new MethodInfo(x as MethodDeclaration, this);
				this.methods[methodInfo.name] = methodInfo;
				this.methodParameters = [];
			}
			else if (this.debug) {
				console.log(SyntaxKind[x.kind]);
				console.log(x.getText());
			}
			this.loadOnlyDependancesRecu(x);
		});

		for (let decorator of this.decorators) {
			let temp = ConvertibleDecorator.is(decorator);
			if (temp) {
				this.convertibleName = temp.name;
			}
		}
		this.loadDependancesDecorator();

	}
	private getClassInheritance(node: HeritageClause) {
		if (node.token == SyntaxKind.ExtendsKeyword) {
			forEachChild(node, x => {
				if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
					let fullName = this.addDependance(x as ExpressionWithTypeArguments, true);
					if (fullName.length > 0) {
						this.extends.push(fullName[0]);
						if (this.extends.length == 1) {
							// search parent inside local import
							let parent = BaseInfo.getInfoByFullName(fullName[0], this);
							if (parent && parent instanceof ClassInfo) {
								this.parentClass = parent;
							}
						}
					}
					forEachChild(x, y => {
						this.loadOnlyDependancesRecu(y, 0, true);
					})
				}
			})
		}
		else if (node.token == SyntaxKind.ImplementsKeyword) {
			forEachChild(node, x => {
				if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
					let fullName = this.addDependance(x as ExpressionWithTypeArguments, true);
					if (fullName.length > 0) {
						this.implements.push(fullName[0]);
					}
				}
			})
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
}