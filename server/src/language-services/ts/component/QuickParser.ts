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
import { DecoratorInfo } from '../parser/DecoratorInfo';
import { DebuggerDecorator } from '../parser/decorators/DebuggerDecorator';
import { TagNameDecorator } from '../parser/decorators/TagNameDecorator';

export class QuickParser {

	public static parse(content: string, build: Build) {
		return new QuickParser(content, build);
	}

	private AventusDefaultComponent: string = "Aventus.DefaultComponent";

	public end: number = -1;
	private currentNamespace: string[] = []
	public fullname: string = "";
	public className: string = "";
	public tagName: string | null = null;
	public whiteSpaceBefore: number = 0;
	public writeHtml: boolean = false;
	public writeTs: boolean = false;
	private prefixes: string[];
	private isAbstract: boolean = false;

	private constructor(content: string, build: Build) {
		this.currentNamespace.push(build.module);
		if (build.isCoreBuild) {
			this.AventusDefaultComponent = "DefaultComponent";
		}
		this.prefixes = build.getComponentPrefix().split("-")
		this.loadRoot(createSourceFile("sample.ts", content, ScriptTarget.ESNext, true));
	}

	private loadRoot(node: Node): true | undefined {
		if (node.kind == SyntaxKind.ModuleDeclaration) {
			return this.loadNamespace(node as ModuleDeclaration);
		}
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
			let result = this.loadRoot(node.body);
			this.currentNamespace.splice(this.currentNamespace.length - 1, 1);
			return result;
		}
		else if (hasFlag(node.flags, NodeFlags.GlobalAugmentation) && node.body) {
			return this.loadRoot(node.body);
		}
		return undefined;
	}

	private loadClass(node: ClassDeclaration): true | undefined {
		let whiteSpaceBefore = /^(\s)*/.exec(node.getText());
		if (whiteSpaceBefore) {
			this.whiteSpaceBefore = whiteSpaceBefore[0].length;
		}
		if (node.modifiers) {
			for (let modifier of node.modifiers) {
				if (modifier.kind == SyntaxKind.AbstractKeyword) {
					this.isAbstract = true;
				}
			}
		}
		if (node.name && node.heritageClauses) {
			let name = node.name;
			for (let heritage of node.heritageClauses) {
				if (heritage.token == SyntaxKind.ImplementsKeyword) {
					forEachChild(heritage, x => {
						if (x.kind == SyntaxKind.ExpressionWithTypeArguments) {
							if (x.getText() == this.AventusDefaultComponent) {
								this.end = node.getEnd()
								this.fullname = [...this.currentNamespace, name.getText()].join('.')
								this.className = name.getText();

								let decorators = DecoratorInfo.buildDecorator(node);
								for (let decorator of decorators) {
									let debugDeco = DebuggerDecorator.is(decorator);
									if (debugDeco) {
										if (debugDeco.writeHTML) {
											this.writeHtml = true;
										}
										if (debugDeco.writeComponentTs) {
											this.writeTs = true;
										}
										continue;
									}

									if (!this.isAbstract) {
										let tagNameDeco = TagNameDecorator.is(decorator)
										if (tagNameDeco) {
											this.tagName = tagNameDeco.tagName;
										}
									}
								}

								if (!this.isAbstract && this.tagName == null) {
									let splittedName = this.className.match(/([A-Z][a-z]*)|([0-9]+[a-z]*)/g);
									if (splittedName) {
										for (let i = 0; i < this.prefixes.length; i++) {
											let componentPrefix = this.prefixes[i];
											if (componentPrefix.length > 0 && splittedName[i].toLowerCase() != componentPrefix.toLowerCase()) {
												// no special tag => add one
												splittedName.splice(0, 0, this.prefixes.join("-").toLowerCase());
												break;
											}
										}
										this.tagName = splittedName.join("-").toLowerCase();
									}
								}
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