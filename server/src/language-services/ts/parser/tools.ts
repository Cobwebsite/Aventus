import { ArrayLiteralExpression, Expression, NodeFlags, ObjectLiteralExpression, SyntaxKind } from "typescript";

export const syntaxName = ["Unknown",
    "EndOfFileToken",
    "SingleLineCommentTrivia",
    "MultiLineCommentTrivia",
    "NewLineTrivia",
    "WhitespaceTrivia",
    "ShebangTrivia",
    "ConflictMarkerTrivia",
    "NumericLiteral",
    "BigIntLiteral",
    "StringLiteral",
    "JsxText",
    "JsxTextAllWhiteSpaces",
    "RegularExpressionLiteral",
    "NoSubstitutionTemplateLiteral",
    "TemplateHead",
    "TemplateMiddle",
    "TemplateTail",
    "OpenBraceToken",
    "CloseBraceToken",
    "OpenParenToken",
    "CloseParenToken",
    "OpenBracketToken",
    "CloseBracketToken",
    "DotToken",
    "DotDotDotToken",
    "SemicolonToken",
    "CommaToken",
    "QuestionDotToken",
    "LessThanToken",
    "LessThanSlashToken",
    "GreaterThanToken",
    "LessThanEqualsToken",
    "GreaterThanEqualsToken",
    "EqualsEqualsToken",
    "ExclamationEqualsToken",
    "EqualsEqualsEqualsToken",
    "ExclamationEqualsEqualsToken",
    "EqualsGreaterThanToken",
    "PlusToken",
    "MinusToken",
    "AsteriskToken",
    "AsteriskAsteriskToken",
    "SlashToken",
    "PercentToken",
    "PlusPlusToken",
    "MinusMinusToken",
    "LessThanLessThanToken",
    "GreaterThanGreaterThanToken",
    "GreaterThanGreaterThanGreaterThanToken",
    "AmpersandToken",
    "BarToken",
    "CaretToken",
    "ExclamationToken",
    "TildeToken",
    "AmpersandAmpersandToken",
    "BarBarToken",
    "QuestionToken",
    "ColonToken",
    "AtToken",
    "QuestionQuestionToken",
    /** Only the JSDoc scanner produces BacktickToken. The normal scanner produces NoSubstitutionTemplateLiteral and related kinds. */
    "BacktickToken",
    /** Only the JSDoc scanner produces HashToken. The normal scanner produces PrivateIdentifier. */
    "HashToken",
    "EqualsToken",
    "PlusEqualsToken",
    "MinusEqualsToken",
    "AsteriskEqualsToken",
    "AsteriskAsteriskEqualsToken",
    "SlashEqualsToken",
    "PercentEqualsToken",
    "LessThanLessThanEqualsToken",
    "GreaterThanGreaterThanEqualsToken",
    "GreaterThanGreaterThanGreaterThanEqualsToken",
    "AmpersandEqualsToken",
    "BarEqualsToken",
    "BarBarEqualsToken",
    "AmpersandAmpersandEqualsToken",
    "QuestionQuestionEqualsToken",
    "CaretEqualsToken",
    "Identifier",
    "PrivateIdentifier",
    "BreakKeyword",
    "CaseKeyword",
    "CatchKeyword",
    "ClassKeyword",
    "ConstKeyword",
    "ContinueKeyword",
    "DebuggerKeyword",
    "DefaultKeyword",
    "DeleteKeyword",
    "DoKeyword",
    "ElseKeyword",
    "EnumKeyword",
    "ExportKeyword",
    "ExtendsKeyword",
    "FalseKeyword",
    "FinallyKeyword",
    "ForKeyword",
    "FunctionKeyword",
    "IfKeyword",
    "ImportKeyword",
    "InKeyword",
    "InstanceOfKeyword",
    "NewKeyword",
    "NullKeyword",
    "ReturnKeyword",
    "SuperKeyword",
    "SwitchKeyword",
    "ThisKeyword",
    "ThrowKeyword",
    "TrueKeyword",
    "TryKeyword",
    "TypeOfKeyword",
    "VarKeyword",
    "VoidKeyword",
    "WhileKeyword",
    "WithKeyword",
    "ImplementsKeyword",
    "InterfaceKeyword",
    "LetKeyword",
    "PackageKeyword",
    "PrivateKeyword",
    "ProtectedKeyword",
    "PublicKeyword",
    "StaticKeyword",
    "YieldKeyword",
    "AbstractKeyword",
    "AccessorKeyword",
    "AsKeyword",
    "AssertsKeyword",
    "AssertKeyword",
    "AnyKeyword",
    "AsyncKeyword",
    "AwaitKeyword",
    "BooleanKeyword",
    "ConstructorKeyword",
    "DeclareKeyword",
    "GetKeyword",
    "InferKeyword",
    "IntrinsicKeyword",
    "IsKeyword",
    "KeyOfKeyword",
    "ModuleKeyword",
    "NamespaceKeyword",
    "NeverKeyword",
    "OutKeyword",
    "ReadonlyKeyword",
    "RequireKeyword",
    "NumberKeyword",
    "ObjectKeyword",
    "SatisfiesKeyword",
    "SetKeyword",
    "StringKeyword",
    "SymbolKeyword",
    "TypeKeyword",
    "UndefinedKeyword",
    "UniqueKeyword",
    "UnknownKeyword",
    "FromKeyword",
    "GlobalKeyword",
    "BigIntKeyword",
    "OverrideKeyword",
    "OfKeyword",
    "QualifiedName",
    "ComputedPropertyName",
    "TypeParameter",
    "Parameter",
    "Decorator",
    "PropertySignature",
    "PropertyDeclaration",
    "MethodSignature",
    "MethodDeclaration",
    "ClassStaticBlockDeclaration",
    "Constructor",
    "GetAccessor",
    "SetAccessor",
    "CallSignature",
    "ConstructSignature",
    "IndexSignature",
    "TypePredicate",
    "TypeReference",
    "FunctionType",
    "ConstructorType",
    "TypeQuery",
    "TypeLiteral",
    "ArrayType",
    "TupleType",
    "OptionalType",
    "RestType",
    "UnionType",
    "IntersectionType",
    "ConditionalType",
    "InferType",
    "ParenthesizedType",
    "ThisType",
    "TypeOperator",
    "IndexedAccessType",
    "MappedType",
    "LiteralType",
    "NamedTupleMember",
    "TemplateLiteralType",
    "TemplateLiteralTypeSpan",
    "ImportType",
    "ObjectBindingPattern",
    "ArrayBindingPattern",
    "BindingElement",
    "ArrayLiteralExpression",
    "ObjectLiteralExpression",
    "PropertyAccessExpression",
    "ElementAccessExpression",
    "CallExpression",
    "NewExpression",
    "TaggedTemplateExpression",
    "TypeAssertionExpression",
    "ParenthesizedExpression",
    "FunctionExpression",
    "ArrowFunction",
    "DeleteExpression",
    "TypeOfExpression",
    "VoidExpression",
    "AwaitExpression",
    "PrefixUnaryExpression",
    "PostfixUnaryExpression",
    "BinaryExpression",
    "ConditionalExpression",
    "TemplateExpression",
    "YieldExpression",
    "SpreadElement",
    "ClassExpression",
    "OmittedExpression",
    "ExpressionWithTypeArguments",
    "AsExpression",
    "NonNullExpression",
    "MetaProperty",
    "SyntheticExpression",
    "SatisfiesExpression",
    "TemplateSpan",
    "SemicolonClassElement",
    "Block",
    "EmptyStatement",
    "VariableStatement",
    "ExpressionStatement",
    "IfStatement",
    "DoStatement",
    "WhileStatement",
    "ForStatement",
    "ForInStatement",
    "ForOfStatement",
    "ContinueStatement",
    "BreakStatement",
    "ReturnStatement",
    "WithStatement",
    "SwitchStatement",
    "LabeledStatement",
    "ThrowStatement",
    "TryStatement",
    "DebuggerStatement",
    "VariableDeclaration",
    "VariableDeclarationList",
    "FunctionDeclaration",
    "ClassDeclaration",
    "InterfaceDeclaration",
    "TypeAliasDeclaration",
    "EnumDeclaration",
    "ModuleDeclaration",
    "ModuleBlock",
    "CaseBlock",
    "NamespaceExportDeclaration",
    "ImportEqualsDeclaration",
    "ImportDeclaration",
    "ImportClause",
    "NamespaceImport",
    "NamedImports",
    "ImportSpecifier",
    "ExportAssignment",
    "ExportDeclaration",
    "NamedExports",
    "NamespaceExport",
    "ExportSpecifier",
    "MissingDeclaration",
    "ExternalModuleReference",
    "JsxElement",
    "JsxSelfClosingElement",
    "JsxOpeningElement",
    "JsxClosingElement",
    "JsxFragment",
    "JsxOpeningFragment",
    "JsxClosingFragment",
    "JsxAttribute",
    "JsxAttributes",
    "JsxSpreadAttribute",
    "JsxExpression",
    "CaseClause",
    "DefaultClause",
    "HeritageClause",
    "CatchClause",
    "AssertClause",
    "AssertEntry",
    "ImportTypeAssertionContainer",
    "PropertyAssignment",
    "ShorthandPropertyAssignment",
    "SpreadAssignment",
    "EnumMember",
    "UnparsedPrologue",
    "UnparsedPrepend",
    "UnparsedText",
    "UnparsedInternalText",
    "UnparsedSyntheticReference",
    "SourceFile",
    "Bundle",
    "UnparsedSource",
    "InputFiles",
    "JSDocTypeExpression",
    "JSDocNameReference",
    "JSDocMemberName",
    "JSDocAllType",
    "JSDocUnknownType",
    "JSDocNullableType",
    "JSDocNonNullableType",
    "JSDocOptionalType",
    "JSDocFunctionType",
    "JSDocVariadicType",
    "JSDocNamepathType",
    "JSDoc",
    /** @deprecated Use SyntaxKind.JSDoc */
    "JSDocComment",
    "JSDocText",
    "JSDocTypeLiteral",
    "JSDocSignature",
    "JSDocLink",
    "JSDocLinkCode",
    "JSDocLinkPlain",
    "JSDocTag",
    "JSDocAugmentsTag",
    "JSDocImplementsTag",
    "JSDocAuthorTag",
    "JSDocDeprecatedTag",
    "JSDocClassTag",
    "JSDocPublicTag",
    "JSDocPrivateTag",
    "JSDocProtectedTag",
    "JSDocReadonlyTag",
    "JSDocOverrideTag",
    "JSDocCallbackTag",
    "JSDocEnumTag",
    "JSDocParameterTag",
    "JSDocReturnTag",
    "JSDocThisTag",
    "JSDocTypeTag",
    "JSDocTemplateTag",
    "JSDocTypedefTag",
    "JSDocSeeTag",
    "JSDocPropertyTag",
    "SyntaxList",
    "NotEmittedStatement",
    "PartiallyEmittedExpression",
    "CommaListExpression",
    "MergeDeclarationMarker",
    "EndOfDeclarationMarker",
    "SyntheticReferenceExpression",
    "Count",
    "FirstAssignment",
    "LastAssignment",
    "FirstCompoundAssignment",
    "LastCompoundAssignment",
    "FirstReservedWord",
    "LastReservedWord",
    "FirstKeyword",
    "LastKeyword",
    "FirstFutureReservedWord",
    "LastFutureReservedWord",
    "FirstTypeNode",
    "LastTypeNode",
    "FirstPunctuation",
    "LastPunctuation",
    "FirstToken",
    "LastToken",
    "FirstTriviaToken",
    "LastTriviaToken",
    "FirstLiteralToken",
    "LastLiteralToken",
    "FirstTemplateToken",
    "LastTemplateToken",
    "FirstBinaryOperator",
    "LastBinaryOperator",
    "FirstStatement",
    "LastStatement",
    "FirstNode",
    "FirstJSDocNode",
    "LastJSDocNode",
    "FirstJSDocTagNode",
    "LastJSDocTagNode"]

export function hasFlag(val: NodeFlags, flag: number) {
    return (val & flag) != 0;
}

export function buildJSON(e: ObjectLiteralExpression | ArrayLiteralExpression, obj: any = null) {
    if (e.kind == SyntaxKind.ObjectLiteralExpression) {
        if (obj == null) {
            obj = {};
        }
        for (let prop of e.properties) {
            if (prop.kind == SyntaxKind.PropertyAssignment) {
                if (prop.initializer.kind == SyntaxKind.StringLiteral) {
                    obj[prop.name.getText()] = prop.initializer.getText()
                }
                else if (prop.initializer.kind == SyntaxKind.NumericLiteral) {
                    obj[prop.name.getText()] = Number(prop.initializer.getText());
                }
                else if (prop.initializer.kind == SyntaxKind.FalseKeyword) {
                    obj[prop.name.getText()] = false;
                }
                else if (prop.initializer.kind == SyntaxKind.TrueKeyword) {
                    obj[prop.name.getText()] = true;
                }
                else if (prop.initializer.kind == SyntaxKind.Identifier) {
                    obj[prop.name.getText()] = prop.initializer.getText();
                }
                else if (prop.initializer.kind == SyntaxKind.ObjectLiteralExpression) {
                    let objTemp = {};
                    buildJSON(prop.initializer as ObjectLiteralExpression, objTemp);
                    obj[prop.name.getText()] = objTemp;
                }
                else if (prop.initializer.kind == SyntaxKind.ArrayLiteralExpression) {
                    let objTemp = [];
                    buildJSON(prop.initializer as ArrayLiteralExpression, objTemp);
                    obj[prop.name.getText()] = objTemp;
                }
            }
        }
    }
    else if (e.kind == SyntaxKind.ArrayLiteralExpression) {
        if (obj == null) {
            obj = [];
        }
        for (let element of e.elements) {
            if (element.kind == SyntaxKind.StringLiteral) {
                obj.push(element.getText());
            }
            else if (element.kind == SyntaxKind.NumericLiteral) {
                obj.push(Number(element.getText()));
            }
            else if (element.kind == SyntaxKind.FalseKeyword) {
                obj.push(false);
            }
            else if (element.kind == SyntaxKind.TrueKeyword) {
                obj.push(true);
            }
            else if (element.kind == SyntaxKind.ObjectLiteralExpression) {
                let objTemp = {};
                buildJSON(element as ObjectLiteralExpression, objTemp);
                obj.push(objTemp);
            }
            else if (element.kind == SyntaxKind.ArrayLiteralExpression) {
                let objTemp = [];
                buildJSON(element as ArrayLiteralExpression, objTemp);
                obj.push(objTemp);
            }
        }
    }

    return JSON.stringify(obj);
}

export type ArgType = "string" | 'number' | 'boolean' | 'object' | 'array' | 'identifier' | 'call';
export function getArg(node: Expression): { type: ArgType, value: string } | null {
    if (node.kind == SyntaxKind.StringLiteral) {
        return {
            type: "string",
            value: node.getText()
        }
    }
    else if (node.kind == SyntaxKind.NumericLiteral) {
        return {
            type: "number",
            value: node.getText()
        }
    }
    else if (node.kind == SyntaxKind.FalseKeyword) {
        return {
            type: "boolean",
            value: "false"
        }
    }
    else if (node.kind == SyntaxKind.TrueKeyword) {
        return {
            type: "boolean",
            value: "true"
        }
    }
    else if (node.kind == SyntaxKind.ObjectLiteralExpression) {
        return {
            type: "object",
            value: buildJSON(node as ObjectLiteralExpression)
        }
    }
    else if (node.kind == SyntaxKind.ArrayLiteralExpression) {
        return {
            type: "array",
            value: buildJSON(node as ArrayLiteralExpression)
        }
    }
    else if (node.kind == SyntaxKind.Identifier) {
        return {
            type: "identifier",
            value: node.getText()
        }
    }
    else if (node.kind == SyntaxKind.CallExpression || node.kind == SyntaxKind.ArrowFunction || node.kind == SyntaxKind.FunctionExpression) {
        return {
            type: "call",
            value: node.getText()
        }
    }
   
    return null;
}