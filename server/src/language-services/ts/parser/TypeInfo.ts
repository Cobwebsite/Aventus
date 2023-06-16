import { ArrayTypeNode, ExpressionWithTypeArguments, FunctionTypeNode, IndexSignatureDeclaration, LiteralTypeNode, ParenthesizedTypeNode, PropertySignature, SyntaxKind, TypeLiteralNode, TypeNode, TypeReferenceNode, UnionTypeNode } from 'typescript';

type TypeInfoKind = "string" | 'number' | 'boolean' | 'null' | 'any' | 'void' | 'type' | 'literal' | 'union' | 'mock' | 'function' | 'typeLiteral';

export class TypeInfo {
	public kind: TypeInfoKind = 'mock';
	public value: string = "";
	public isArray: boolean = false;
	public genericValue: TypeInfo[] = [];
	public nested: TypeInfo[] = [];
	public start: number = 0;
    public end: number = 0;

	constructor(node: TypeNode | null) {
		if (!node) {
			this.kind = "mock";
			return;
		}
		this.start = node.getStart();
        this.end = node.getEnd();
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
		else if (node.kind === SyntaxKind.AnyKeyword) {
			this.kind = "any";
		}
		else if (node.kind === SyntaxKind.VoidKeyword) {
			this.kind = "void";
		}
		else if (node.kind === SyntaxKind.LiteralType) {
			this.kind = "literal";
			this.value = (node as LiteralTypeNode).literal.getText();
		}
		else if (node.kind === SyntaxKind.TypeReference) {
			this.kind = "type";
			let typeRef = node as TypeReferenceNode;
			this.value = typeRef.typeName.getText();
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
		}
		else if (node.kind === SyntaxKind.UnionType) {
			let unionType = node as UnionTypeNode;
			this.kind = "union";
			for (let type of unionType.types) {
				this.nested.push(new TypeInfo(type));
			}
		}
		else if (node.kind === SyntaxKind.ExpressionWithTypeArguments) {
			let expression = node as ExpressionWithTypeArguments;
			this.kind = "type";
			// TODO this is wrong bc of generic type <,>
			this.value = expression.getText();
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
		}
		else if(node.kind == SyntaxKind.FunctionType){
			let fctType = node as FunctionTypeNode;
			this.kind = "function";
			this.value = node.getText();
			
			for(let param of fctType.parameters){
				if(param.type){
					this.nested.push(new TypeInfo(param.type));
				}
			}
			this.nested.push(new TypeInfo(fctType.type));
		}
	}
}