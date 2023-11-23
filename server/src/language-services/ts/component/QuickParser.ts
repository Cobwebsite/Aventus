import { AventusFile } from '../../../files/AventusFile';
import {
	Node,
	forEachChild,
	createSourceFile,
	ScriptTarget,
	SyntaxKind,
	ClassDeclaration,
	ModuleDeclaration,
	NodeFlags
} from "typescript";
import { hasFlag } from '../parser/tools';
import { Build } from '../../../project/Build';

export class QuickParser {

	public static parse(file: AventusFile, build: Build) {
		return new QuickParser(file, build);
	}

	private AventusDefaultComponent: string = "Aventus.DefaultComponent";

	public end: number = -1;
	private currentNamespace: string[] = []
	public fullname:string = "";

	private constructor(file: AventusFile, build: Build) {
		this.currentNamespace.push(build.module);
		if (build.isCoreBuild) {
			this.AventusDefaultComponent = "DefaultComponent";
		}
		this.loadRoot(createSourceFile("sample.ts", file.content, ScriptTarget.ESNext, true));
	}

	private loadRoot(node: Node): true | undefined {
		forEachChild(node, x => {
			if (x.kind == SyntaxKind.ModuleDeclaration) {
				return this.loadNamespace(x as ModuleDeclaration);
			}
			else if (x.kind == SyntaxKind.ClassDeclaration) {
				return this.loadClass(x as ClassDeclaration);
			}
			return undefined;
		})
		if (this.end) {
			return true;
		}
		return undefined
	}

	private loadNamespace(node: ModuleDeclaration): true | undefined {
		if (hasFlag(node.flags, NodeFlags.Namespace) && node.body) {
			this.currentNamespace.push(node.name.getText());
            let result = this.loadRoot(node);
            this.currentNamespace.splice(this.currentNamespace.length - 1, 1);
			return result;
		}
		else if (hasFlag(node.flags, NodeFlags.GlobalAugmentation) && node.body) {
			return this.loadRoot(node);
		}
		return undefined;
	}

	private loadClass(node: ClassDeclaration): true | undefined {
		if (node.name && node.heritageClauses) {
			let name = node.name;
			for (let heritage of node.heritageClauses) {
				if (heritage.token == SyntaxKind.ImplementsKeyword) {
					forEachChild(heritage, x => {
						if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
							if (x.getText() == this.AventusDefaultComponent) {
								this.end = node.getEnd()
								this.fullname = [...this.currentNamespace, name.getText()].join('.')
								return true;
							}
						}
						return undefined;
					})
					if (this.end) {
						return true
					}
				}
			}
		}
		return undefined;
	}
}