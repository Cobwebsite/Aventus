import { ArrayTypeNode, ClassDeclaration, ConstructorDeclaration, createSourceFile, EntityName, ExpressionWithTypeArguments, forEachChild, HeritageClause, MethodDeclaration, PropertyDeclaration, QualifiedName, ScriptTarget, SyntaxKind, TypeNode, TypeReferenceNode, UnionTypeNode } from 'typescript';
import { BaseInfo } from './BaseInfo';
import { ClassInfo } from './ClassInfo';

export class DefinitionCorrector {
	private static allChanges: {
		start: number,
		end: number,
		value: string
	}[] = [];
	private static currentElement: ClassInfo | null;
	/**
	 * Set back the decorator content
	 * @param txt 
	 * @param element 
	 * @returns 
	 */
	public static correct(txt: string, element: BaseInfo) {
		var node = createSourceFile("sample.ts", txt, ScriptTarget.ESNext, true);
		this.allChanges = []
		if (element instanceof ClassInfo && !this.currentElement) {
			this.currentElement = element;


			forEachChild(node, x => {
				var isInterface = x.kind === SyntaxKind.InterfaceDeclaration;
				var isClass = x.kind === SyntaxKind.ClassDeclaration;
				if (!isInterface && !isClass) {
					return;
				}
				var classInfo: ClassDeclaration = <ClassDeclaration>x;
				for (let decorator of element.decorators) {
					if (decorator.name != "Debugger") {
						this.addChange(decorator.content + "\r\n", classInfo.getStart(), classInfo.getStart());
					}
				}
				if (classInfo.typeParameters) {
					classInfo.typeParameters.forEach(x => {
						if (x.constraint) {
							this.correctType(x.constraint)
						}
					});
				}
				if (classInfo.heritageClauses) {
					for (let heritage of classInfo.heritageClauses) {
						this.correctClassInheritance(heritage);
					}
				}
				forEachChild(classInfo, x => {
					if (x.kind == SyntaxKind.Constructor) {
						this.correctMethod(x as ConstructorDeclaration);
					}
					else if (x.kind == SyntaxKind.MethodDeclaration) {
						this.correctMethod(x as MethodDeclaration);
					}
					else if (x.kind == SyntaxKind.PropertyDeclaration) {
						this.correctProperty(x as PropertyDeclaration);
					}
				});
			})
			this.allChanges.sort((a, b) => b.end - a.end); // order from end file to start file
			for (let change of this.allChanges) {
				txt = txt.slice(0, change.start) + change.value + txt.slice(change.end, txt.length);
			}
			this.currentElement = null;
		}
		return txt;
	}
	private static correctClassInheritance(node: HeritageClause) {
		if (node.token == SyntaxKind.ExtendsKeyword || node.token == SyntaxKind.ImplementsKeyword) {
			forEachChild(node, x => {
				if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
					this.correctType(x as ExpressionWithTypeArguments);
				}
			})
		}
	}

	private static correctMethod(node: MethodDeclaration | ConstructorDeclaration) {
		if (node.type) {
			this.correctType(node.type)
		}

		if (node.typeParameters) {
			node.typeParameters.forEach(x => {
				if (x.constraint) {
					this.correctType(x.constraint)
				}
			});
		}
		node.parameters.forEach(x => {
			this.correctType(<TypeNode>x.type)
		});
	}
	private static correctProperty(node: PropertyDeclaration) {
		if (node.type) {
			this.correctType(node.type);
		}
		if (this.currentElement && this.currentElement.properties[node.name.getText()]) {
			let decorators = this.currentElement.properties[node.name.getText()].decorators;
			for (let decorator of decorators) {
				this.addChange(decorator.content + "\r\n\t", node.getStart(), node.getStart());
			}
		}
	}

	private static addChange(text: string, start: number, end: number) {
		this.allChanges.push({
			start,
			end,
			value: text
		})
	}

	private static addChangeType(name: string, start: number, end: number) {
		if (this.currentElement) {
			let baseInfo = this.currentElement.parserInfo.getBaseInfo(name);
			if (baseInfo && name != baseInfo.fullName) {
				this.addChange(baseInfo.fullName, start, end)
			}
		}
	}

	private static correctType(t: TypeNode): void {
		if (!t) return;
		if (t.kind === SyntaxKind.TypeReference) {
			var tr: TypeReferenceNode = <TypeReferenceNode>t;
			let parsedName = this.parseQualified(tr.typeName);
			if (parsedName) {
				this.addChangeType(parsedName, tr.getStart(), tr.getEnd());

				if (tr.typeArguments) {
					tr.typeArguments.forEach(x => {
						this.correctType(x);
					});
				}
			}
		}
		else if (t.kind === SyntaxKind.ArrayType) {
			var q: ArrayTypeNode = <ArrayTypeNode>t;
			this.correctType(q.elementType);
		}
		else if (t.kind === SyntaxKind.UnionType) {
			var ut: UnionTypeNode = <UnionTypeNode>t;
			for (let type of ut.types) {
				this.correctType(type);
			}
		}
		else if (t.kind === SyntaxKind.ExpressionWithTypeArguments) {
			var tra = <ExpressionWithTypeArguments>t;
			let parsedName = this.parseQualified2(tra.expression);
			if (parsedName) {
				this.addChangeType(parsedName, tra.expression.getStart(), tra.expression.getEnd());
				if (tra.typeArguments) {
					tra.typeArguments.forEach(x => {
						this.correctType(x);
					});
				}
			}
		}
	}

	private static parseQualified2(n: any): string | undefined {
		let preset = "";
		if (n.expression) {
			if (n.expression.kind === SyntaxKind.PropertyAccessExpression) {
				let presetTemp = this.parseQualified2(n.expression);
				if (presetTemp) {
					preset = presetTemp + "."
				}
			}
			else if (n.expression.kind === SyntaxKind.Identifier) {
				preset = n.expression.text + "."
			}
		}

		if (!n.name) {
			return preset + n.text;
		}
		return preset + n.name.text;
	}
	private static parseQualified(n: EntityName): string | undefined {
		if (n.kind === SyntaxKind.Identifier) {
			return n["text"];
		} else {
			var q = <QualifiedName>n;
			return this.parseQualified(q.left) + "." + this.parseQualified(q.right);
		}
	}
}