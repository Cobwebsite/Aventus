import { FunctionDeclaration, Identifier, ImportDeclaration, SyntaxKind, flattenDiagnosticMessageText, forEachChild } from 'typescript';
import { BaseInfo, InfoType } from './BaseInfo';
import { ParserTs } from './ParserTs';
import { DiagnosticSeverity, Range } from 'vscode-languageserver';
import { AventusExtension, AventusLanguageId } from '../../../definition';
import { getFolder, pathToUri, uriToPath } from '../../../tools';
import { normalize } from 'path';
import { FilesManager } from '../../../files/FilesManager';
import { existsSync, readFileSync } from 'fs';
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
import { TextDocument } from 'vscode-languageserver-textdocument';

type ImportInfoCst1 = {
	parserInfo: ParserTs,
	moduleName: string,
	identifier: Identifier,
	isTypeImport: boolean
}
type ImportInfoCst2 = {
	parserInfo: ParserTs,
	name: string,
	moduleUri: string,
}
export class ImportInfo {

	public static Parse(node: ImportDeclaration, file: AventusFile, parserInfo: ParserTs) {
		if (node.importClause) {
			if (node.importClause.namedBindings) {
				if (node.importClause.namedBindings.kind == SyntaxKind.NamespaceImport) {
					let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
					moduleName = parserInfo.build.project.resolveAlias(moduleName, file);
					if (moduleName.startsWith(".")) {
						parserInfo.errors.push({
							range: Range.create(parserInfo.document.positionAt(node.getStart()), parserInfo.document.positionAt(node.getEnd())),
							severity: DiagnosticSeverity.Error,
							source: AventusLanguageId.TypeScript,
							message: flattenDiagnosticMessageText("error can't use namespace import", '\n')
						})
					}
					else {
						let name = node.importClause.namedBindings.name.getText();
						if (!node.importClause.isTypeOnly) {
							parserInfo.build.npmBuilder.register(parserInfo.document.uri, {
								libName: "*",
								uri: moduleName,
								alias: name
							})
							parserInfo.npmImports[name] = {
								uri: moduleName,
								nameInsideLib: "*"
							};
						}
					}
				}
				else if (node.importClause.namedBindings.kind == SyntaxKind.NamedImports) {
					let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
					moduleName = parserInfo.build.project.resolveAlias(moduleName, file);
					// it's a local import
					if (moduleName.startsWith(".")) {
						for (let element of node.importClause.namedBindings.elements) {
							if (element.propertyName) {
								// it's a rename
								parserInfo.errors.push({
									range: Range.create(parserInfo.document.positionAt(node.getStart()), parserInfo.document.positionAt(node.getEnd())),
									severity: DiagnosticSeverity.Error,
									source: AventusLanguageId.TypeScript,
									message: flattenDiagnosticMessageText("error can't use renamed import", '\n')
								})
							}
							else {
								let isTypeOnly = element.isTypeOnly || node.importClause.isTypeOnly;
								const opts = {
									parserInfo: parserInfo,
									moduleName: moduleName,
									identifier: element.name,
									isTypeImport: isTypeOnly
								}
								let info = new ImportInfo(opts);
								parserInfo.importsLocal[info.name] = info;
							}
						}
					}
					else if (!moduleName.startsWith(".") && moduleName.includes(AventusExtension.Package)) {
						for (let element of node.importClause.namedBindings.elements) {
							if (element.propertyName) {
								// it's a rename
								parserInfo.errors.push({
									range: Range.create(parserInfo.document.positionAt(node.getStart()), parserInfo.document.positionAt(node.getEnd())),
									severity: DiagnosticSeverity.Error,
									source: AventusLanguageId.TypeScript,
									message: flattenDiagnosticMessageText("error can't use renamed import", '\n')
								})
							}
							else {
								let name = element.name.getText();
								let splitted = moduleName.split(":");
								if (splitted.length > 1) {
									let fullname = splitted[1].replace(AventusExtension.Package, "") + "." + name
									parserInfo.packages[name] = {
										fullname
									};
								}
								else {
									parserInfo.errors.push({
										range: Range.create(parserInfo.document.positionAt(node.getStart()), parserInfo.document.positionAt(node.getEnd())),
										severity: DiagnosticSeverity.Error,
										source: AventusLanguageId.TypeScript,
										message: flattenDiagnosticMessageText("The package import is malformated", '\n')
									})
								}
							}
						}
					}
					else {
						for (let element of node.importClause.namedBindings.elements) {
							let name = element.name.getText();
							let nameInsideLib = name;
							if (element.propertyName) {
								nameInsideLib = element.propertyName.getText();
							}
							if (!node.importClause.isTypeOnly && !element.isTypeOnly) {
								parserInfo.build.npmBuilder.register(parserInfo.document.uri, {
									libName: nameInsideLib,
									uri: moduleName,
									alias: name
								})
								parserInfo.npmImports[name] = {
									uri: moduleName,
									nameInsideLib: nameInsideLib
								};
							}

						}
					}
				}
			}
			else if (node.importClause.name) {
				let moduleName = node.moduleSpecifier.getText().replace(/"/g, "").replace(/'/g, "");
				moduleName = parserInfo.build.project.resolveAlias(moduleName, file);

				if (moduleName.startsWith(".")) {
					const opts = {
						parserInfo: parserInfo,
						moduleName: moduleName,
						identifier: node.importClause.name,
						isTypeImport: node.importClause.isTypeOnly
					}
					let info = new ImportInfo(opts);
					parserInfo.importsLocal[info.name] = info;
				}
				else {
					if (!node.importClause.isTypeOnly) {
						// TODO check if only here but it should be a default import
						parserInfo.build.npmBuilder.register(parserInfo.document.uri, {
							libName: 'default',
							uri: moduleName,
							alias: this.name
						})
						parserInfo.npmImports[this.name] = {
							uri: moduleName,
							nameInsideLib: 'default'
						};
					}
				}
			}
		}
	}

	public static ManualLocalImport(from: BaseInfo, fullName: string, uri: string) {
		const parserInfo = from.parserInfo;
		const splitted = fullName.split(".");
		let name = splitted.pop();
		if (!name) return;

		const opts: ImportInfoCst2 = {
			parserInfo: from.parserInfo,
			name: name,
			moduleUri: uri
		}
		let info = new ImportInfo(opts);
		if (parserInfo.manualImportLocal[info.name]) {
			let i = 0;
			let nameTemp = name + i;
			while (parserInfo.manualImportLocal[nameTemp]) {
				i++;
				nameTemp = name + i;
			}
			name = nameTemp;
			info.alias = name;
		}
		parserInfo.manualImportLocal[name] = info;

		return info;
	}



	public nameStart: number = 0;
	public nameEnd: number = 0;
	public name: string = "";
	public info?: BaseInfo;
	/** real name not compiled by typescript */
	public realName?: string;
	public isTypeImport: boolean;
	public alias?: string;

	private _parserInfo: ParserTs;
	public get parserInfo() {
		return this._parserInfo;
	}

	public isCst1(info: ImportInfoCst1 | ImportInfoCst2): info is ImportInfoCst1 {
		if (info['identifier']) return true;
		return false;
	}

	protected constructor(info: ImportInfoCst1 | ImportInfoCst2) {
		this._parserInfo = info.parserInfo;
		let moduleUri: string;
		if (this.isCst1(info)) {
			this.name = info.identifier.getText();
			this.nameStart = info.identifier.getStart();
			this.nameEnd = info.identifier.getEnd();
			this.isTypeImport = info.isTypeImport;
			moduleUri = pathToUri(normalize(getFolder(uriToPath(this.parserInfo.document.uri)) + '/' + info.moduleName));
		}
		else {
			this.name = info.name;
			this.nameStart = 0;
			this.nameEnd = 0;
			this.isTypeImport = false;
			moduleUri = info.moduleUri;
		}
		if (!ParserTs.parsedDoc[moduleUri]) {
			let file = FilesManager.getInstance().getByUri(moduleUri);
			if (file) {
				ParserTs.parse(file, false, this.parserInfo.build);
			}
			else {
				let modulePath = uriToPath(moduleUri);
				let content = existsSync(modulePath) ? readFileSync(modulePath, 'utf8') : '';
				let avFile = new InternalAventusFile(TextDocument.create(moduleUri, AventusLanguageId.TypeScript, 1, content));
				ParserTs.parse(avFile, false, this.parserInfo.build);
			}
		}

		if (ParserTs.parsedDoc[moduleUri]?.result.isReady) {
			let baseInfoLinked = ParserTs.parsedDoc[moduleUri].result.getBaseInfo(this.name);
			if (baseInfoLinked) {
				this.info = baseInfoLinked
			}
			else {
				ParserTs.addError(this.nameStart, this.nameEnd, "Can't load " + moduleUri + " " + this.name + " from " + this.parserInfo.document.uri)
			}
		}
		else {
			if (this.parserInfo.waitingImports[this.name]) {
				return;
			}
			this.parserInfo.waitingImports[this.name] = [];
			ParserTs.parsedDoc[moduleUri].result.onReady(() => {
				this.asyncImportLocal(moduleUri, this.name);
			})
		}
	}

	private asyncImportLocal(moduleUri: string, localName: string) {
		let baseInfoLinked = ParserTs.parsedDoc[moduleUri].result.getBaseInfo(localName);
		if (baseInfoLinked) {
			this.info = baseInfoLinked;
			let types = [this.parserInfo.classes, this.parserInfo.enums, this.parserInfo.aliases, this.parserInfo.functions, this.parserInfo.variables];
			for (let type of types) {
				for (let name in type) {
					let _class = type[name]
					for (let dependance of _class.dependances) {
						if (dependance.uri == "@external" && dependance.fullName == localName) {
							dependance.uri = "@local";
							dependance.fullName = "$namespace$" + baseInfoLinked.fullName;
							//dependance.isStrong = false;
						}
					}
				}
			}
			for (let cb of this.parserInfo.waitingImports[localName]) {
				cb(baseInfoLinked);
			}
			delete this.parserInfo.waitingImports[localName]
		}
		else {
			ParserTs.addError(this.nameStart, this.nameEnd, "Can't load " + moduleUri + " " + localName + " from " + this.parserInfo.document.uri)
		}
	}
}