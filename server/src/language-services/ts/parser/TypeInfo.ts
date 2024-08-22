import { ArrayTypeNode, ConditionalTypeNode, ConstructorTypeNode, ExpressionWithTypeArguments, FunctionTypeNode, IndexSignatureDeclaration, IndexedAccessTypeNode, InferTypeNode, LiteralTypeNode, MappedTypeNode, ParenthesizedTypeNode, PropertySignature, SyntaxKind, TupleTypeNode, TypeLiteralNode, TypeNode, TypeOperatorNode, TypeQueryNode, TypeReferenceNode, UnionTypeNode } from 'typescript';

export type TypeInfoKind = 'notype' | "string" | 'number' | 'boolean' | 'null' | 'undefined' | 'any' | 'never' | 'object' | 'symbol' | 'void' | 'unknown' | 'type' | 'literal' | 'union' | 'mock' | 'function' | 'constructor' | 'typeLiteral' | 'tuple' | 'this' | 'typeOperator' | 'intersection' | 'conditional' | 'indexedAccess' | 'mappedType' | 'infer';

export class TypeInfo {
	public kind: TypeInfoKind = 'mock';
	public value: string = "";
	public isArray: boolean = false;
	public genericValue: TypeInfo[] = [];
	public nested: TypeInfo[] = [];
	public start: number = 0;
	public end: number = 0;
	public endNonGeneric: number = 0;

	public fctType?: {
		parameters: { [name: string]: TypeInfo },
		return: TypeInfo
	}

	public conditionalType?: {
		check: TypeInfo,
		extends: TypeInfo,
		true: TypeInfo,
		false: TypeInfo
	}

	public mappedType?: {
		parameterName: string
		parameterType: TypeInfo,
		type: TypeInfo,
		modifier?: '?' | '+' | '-'
	}

	public readonly node?: TypeNode;

	constructor(node: TypeNode | null | undefined) {
		if (!node) {
			this.kind = "notype";
			return;
		}
		this.node = node;
		this.start = node.getStart();
		this.end = node.getEnd();
		this.endNonGeneric = this.end;
		if (node.kind == SyntaxKind.StringKeyword) {
			this.kind = "string";
		}
		else if (node.kind === SyntaxKind.NumberKeyword) {
			this.kind = "number";
		}
		else if (node.kind === SyntaxKind.BooleanKeyword) {
			this.kind = "boolean";
		}
		else if (node.kind === SyntaxKind.NullKeyword) {
			this.kind = "null";
		}
		else if (node.kind === SyntaxKind.UndefinedKeyword) {
			this.kind = "undefined";
		}
		else if (node.kind === SyntaxKind.AnyKeyword) {
			this.kind = "any";
		}
		else if (node.kind === SyntaxKind.NeverKeyword) {
			this.kind = "never";
		}
		else if (node.kind === SyntaxKind.VoidKeyword) {
			this.kind = "void";
		}
		else if (node.kind === SyntaxKind.UnknownKeyword) {
			this.kind = "unknown";
		}
		else if (node.kind === SyntaxKind.ObjectKeyword) {
			this.kind = "object";
		}
		else if (node.kind === SyntaxKind.SymbolKeyword) {
			this.kind = "symbol";
		}
		else if (node.kind === SyntaxKind.ThisType) {
			this.kind = "this";
		}
		else if (node.kind === SyntaxKind.LiteralType) {
			this.kind = "literal";
			this.value = (node as LiteralTypeNode).literal.getText();
		}
		else if (node.kind === SyntaxKind.TypeReference) {
			this.kind = "type";
			let typeRef = node as TypeReferenceNode;
			this.value = typeRef.typeName.getText();
			this.endNonGeneric = typeRef.typeName.end;
			if (this.value == "const") {
				this.value = "";
				this.kind = "mock";
				return;
			}

			if (typeRef.typeArguments) {
				for (let arg of typeRef.typeArguments) {
					this.genericValue.push(new TypeInfo(arg));
				};
			}
		}
		else if (node.kind === SyntaxKind.ArrayType) {
			let arrayType = node as ArrayTypeNode;
			this.isArray = true;
			let temp = new TypeInfo(arrayType.elementType);
			this.genericValue = temp.genericValue;
			this.nested = temp.nested;
			this.kind = temp.kind;
			this.value = temp.value;
			this.endNonGeneric = temp.endNonGeneric;
		}
		else if (node.kind === SyntaxKind.UnionType) {
			let unionType = node as UnionTypeNode;
			this.kind = "union";
			for (let type of unionType.types) {
				this.nested.push(new TypeInfo(type));
			}
		}
		else if (node.kind === SyntaxKind.IntersectionType) {
			let unionType = node as UnionTypeNode;
			this.kind = "intersection";
			for (let type of unionType.types) {
				this.nested.push(new TypeInfo(type));
			}
		}
		else if (node.kind === SyntaxKind.TypeOperator) {
			let typeOperator = node as TypeOperatorNode;
			this.kind = "typeOperator";
			if (typeOperator.operator == SyntaxKind.KeyOfKeyword) {
				this.value = "keyof"
			}
			else if (typeOperator.operator == SyntaxKind.UniqueKeyword) {
				this.value = "unique"
			}
			else if (typeOperator.operator == SyntaxKind.ReadonlyKeyword) {
				this.value = "readonly"
			}
			this.nested.push(new TypeInfo(typeOperator.type));
		}
		else if (node.kind == SyntaxKind.TypeQuery) {
			// typeof Webcomponent
			let typeQuery = node as TypeQueryNode;
			this.kind = 'typeOperator';
			this.value = "typeof";

			let type = new TypeInfo(null);
			type.kind = 'type';
			type.value = typeQuery.exprName.getText();
			this.nested.push(type);

		}
		else if (node.kind === SyntaxKind.ExpressionWithTypeArguments) {
			let expression = node as ExpressionWithTypeArguments;
			this.kind = "type";
			// TODO this is wrong bc of generic type <,>
			// should be ok MAXB 07.07.2024
			this.value = expression.expression.getText();
			this.endNonGeneric = expression.expression.getEnd();

			if (expression.typeArguments) {
				for (let arg of expression.typeArguments) {
					this.genericValue.push(new TypeInfo(arg));
				};
			}
		}
		else if (node.kind === SyntaxKind.TypeLiteral) {
			let type = node as TypeLiteralNode;
			this.kind = "typeLiteral";
			this.value = type.getText();
			for (let m of type.members) {
				if (m.kind == SyntaxKind.IndexSignature) {
					let temp = m as IndexSignatureDeclaration;
					this.nested.push(new TypeInfo(temp.type));
				}
				else if (m.kind == SyntaxKind.PropertySignature) {
					let temp = m as PropertySignature;
					if (temp.type) {
						this.nested.push(new TypeInfo(temp.type));
					}
				}
			}
		}
		else if (node.kind == SyntaxKind.ParenthesizedType) {
			let type = node as ParenthesizedTypeNode;
			let temp = new TypeInfo(type.type);
			this.genericValue = temp.genericValue;
			this.nested = temp.nested;
			this.kind = temp.kind;
			this.value = temp.value;
			this.isArray = temp.isArray;
			this.endNonGeneric = temp.endNonGeneric;
		}
		else if (node.kind == SyntaxKind.ConstructorType) {
			let fctType = node as ConstructorTypeNode;
			this.kind = "constructor";
			this.value = node.getText();
			const parameters: { [name: string]: TypeInfo } = {};
			for (let param of fctType.parameters) {
				if (param.type) {
					const typeTemp = new TypeInfo(param.type);
					parameters[param.name.getText()] = typeTemp;
					this.nested.push(typeTemp);
				}
			}
			this.fctType = {
				return: new TypeInfo(fctType.type),
				parameters: parameters
			}

			this.nested.push(this.fctType.return);
		}
		else if (node.kind == SyntaxKind.FunctionType) {
			let fctType = node as FunctionTypeNode;
			this.kind = "function";
			this.value = node.getText();
			const parameters: { [name: string]: TypeInfo } = {};
			for (let param of fctType.parameters) {
				if (param.type) {
					const typeTemp = new TypeInfo(param.type);
					parameters[param.name.getText()] = typeTemp;
					this.nested.push(typeTemp);
				}
			}
			this.fctType = {
				return: new TypeInfo(fctType.type),
				parameters: parameters
			}

			this.nested.push(this.fctType.return);
		}
		else if (node.kind == SyntaxKind.TupleType) {
			let tupleType = node as TupleTypeNode;
			this.kind = 'tuple';
			for (let type of tupleType.elements) {
				this.nested.push(new TypeInfo(type));
			}
		}
		else if (node.kind == SyntaxKind.ConditionalType) {
			// T extends string ? string : never
			let conditionalType = node as ConditionalTypeNode;
			this.kind = 'conditional';
			this.conditionalType = {
				check: new TypeInfo(conditionalType.checkType),
				extends: new TypeInfo(conditionalType.extendsType),
				false: new TypeInfo(conditionalType.falseType),
				true: new TypeInfo(conditionalType.trueType),
			}
		}
		else if (node.kind == SyntaxKind.MappedType) {
			// { [Key in keyof T]?: any; }
			this.kind = 'mappedType';
			let mappedType = node as MappedTypeNode;
			if (mappedType.type && mappedType.typeParameter.constraint) {
				mappedType.questionToken
				this.mappedType = {
					parameterName: mappedType.typeParameter.name.getText(),
					parameterType: new TypeInfo(mappedType.typeParameter.constraint),
					type: new TypeInfo(mappedType.type),

				}

				if (mappedType.questionToken?.kind == SyntaxKind.QuestionToken) {
					this.mappedType.modifier = '?';
				}
				else if (mappedType.questionToken?.kind == SyntaxKind.PlusToken) {
					this.mappedType.modifier = '+';
				}
				else if (mappedType.questionToken?.kind == SyntaxKind.MinusToken) {
					this.mappedType.modifier = '-';
				}
			}
			else {
				console.log("you must add the new type : MappedType like " + node.getText())
			}
		}
		else if (node.kind == SyntaxKind.IndexedAccessType) {
			// T[keyof T]
			this.kind = 'indexedAccess';
			let indexedAccessType = node as IndexedAccessTypeNode
			this.nested.push(new TypeInfo(indexedAccessType.objectType))
			this.nested.push(new TypeInfo(indexedAccessType.indexType))
		}
		else if (node.kind == SyntaxKind.InferType) {
			// infer U
			let inferType = node as InferTypeNode;
			this.kind = 'infer';
			this.value = inferType.typeParameter.name.getText()
		}

		else {
			let kind = node.kind;
			let txt = node.getText();
			// debugger;
		}
	}
}