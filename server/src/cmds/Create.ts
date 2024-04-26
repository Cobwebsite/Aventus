import { mkdirSync, writeFileSync } from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { EOL } from 'os';
import { pathToUri, reorderList, uriToPath } from '../tools';
import { AventusExtension, AventusLanguageId } from '../definition';
import { ProjectManager } from '../project/ProjectManager';
import { FilesManager } from '../files/FilesManager';
import { OpenFile } from '../notification/OpenFile';
import { GenericServer } from '../GenericServer';
import { SelectItem } from '../IConnection';
import { normalize } from 'path';


export class Create {
	private static createOptions: SelectItem[] = [
		{ label: "Component", detail: "Create a component" },
		{ label: "Data", detail: "Create a data" },
		{ label: "Library", detail: "Create a library" },
		{ label: "RAM", detail: "Create a RAM" },
		{ label: "State", detail: "Create a state" },
		{ label: "Custom", detail: "Create a custom template" },
	];
	private static componentFormatOptions: SelectItem[] = [
		{ label: "Single", detail: "Single file" },
		{ label: "Multiple", detail: "Splitted file" },
	];
	private static stateOptions: SelectItem[] = [
		{ label: "State", detail: "Create a state" },
		{ label: "Manager", detail: "Create a state manager" },
	]

	static cmd: string = "aventus.create";

	public static async run(uri: string) {
		if (!uri) {
			return;
		}
		let path = normalize(uriToPath(uri));


		if (Create.checkIfProject(uri)) {
			if (!GenericServer.isIDE) {
				let resultTemp = await GenericServer.SelectFolder("Select where to create", path);
				if (!resultTemp) {
					return;
				}
				uri = resultTemp;
				path = uriToPath(uri);
			}

			const result = await GenericServer.Select(Create.createOptions, {
				placeHolder: 'What do you want to create?',
			});
			if (result) {
				const type = result.label;
				reorderList(Create.createOptions, result);
				if (type == "Custom") {
					GenericServer.localTemplateManager?.createTemplate(path);
				}
				else if (type == "RAM") {
					const name = await GenericServer.Input({
						title: "Provide a data name for your " + type,
					});

					if (!name) {
						return;
					}
					const extendsActionResponse = await GenericServer.Select([{
						label: "Yes"
					}, {
						label: "No"
					}], {
						title: "Do you need to add custom methods on " + type
					});
					if (!extendsActionResponse) {
						return;
					}
					let extendsAction = extendsActionResponse.label == "Yes";
					this.createRAM(name, path, extendsAction);
				}
				else if (type == "Component") {
					const name = await GenericServer.Input({
						title: "Provide a name for your " + type,
					});
					if (!name) {
						return;
					}
					const resultFormat = await GenericServer.Select(Create.componentFormatOptions, {
						placeHolder: 'How should I setup your component?',
					});
					if (resultFormat) {
						reorderList(Create.componentFormatOptions, resultFormat);
						this.createComponent(name, path, resultFormat.label == "Multiple");
					}
				}
				else if (type == "Data") {
					const name = await GenericServer.Input({
						title: "Provide a name for your " + type,
					});
					if (!name) {
						return;
					}
					this.createData(name, path);
				}
				else if (type == "Library") {
					const name = await GenericServer.Input({
						title: "Provide a name for your " + type,
					});
					if (!name) {
						return;
					}
					this.createLib(name, path);
				}
				else if (type == "State") {
					const stateType = await GenericServer.Select(Create.stateOptions, {});
					if (!stateType) {
						return;
					}
					const name = await GenericServer.Input({
						title: "Provide a name for your " + type,
					});
					if (!name) {
						return;
					}
					this.createState(name, path, stateType.label);
				}
			}

		}
		else {
			const result = await GenericServer.Select([{
				label: "Init",
				detail: "Create a project"
			}], {
				placeHolder: 'What do you want to create?',
			});
			if (result) {
				await GenericServer.templateManager?.createProject(path);
			}
		}
	}

	private static createRAM(objectName: string, baseFolderUri: string, extendsAction: boolean) {
		objectName = objectName.charAt(0).toUpperCase() + objectName.slice(1);
		let newScriptPath = uriToPath(baseFolderUri + "/" + objectName + AventusExtension.RAM);
		let newScriptUri = pathToUri(newScriptPath);
		// let importPath = this.getImportPath(newScriptPath, objectPath);
		let className = objectName + "RAM";
		let defaultRAM = ''
		if (extendsAction) {
			defaultRAM = `
interface ${objectName}Method {
	// define your methods here
	
}

export type ${objectName}Extended = ${objectName} & ${objectName}Method;

export class ${className} extends Aventus.Ram<${objectName}, ${objectName}Extended> implements Aventus.IRam {

	/**
	 * Create a singleton to store data
	 */
	public static getInstance(): ${className} {
		return Aventus.Instance.get(${className});
	}

	/**
	 * @inheritdoc
	 */
	public override defineIndexKey(): keyof ${objectName} {
		return 'id';
	}
	/**
	 * @inheritdoc
	 */
	protected override getTypeForData(objJson: Aventus.KeysObject<${objectName}> | ${objectName}): new () => ${objectName}Extended {
		return this.add${objectName}Method(${objectName});
	}

	/**
	 * Mixin pattern to add methods
	 */
	private add${objectName}Method<B extends (new (...args: any[]) => ${objectName}) & { className?: string; }>(Base: B) {
		return class Extension extends Base implements ${objectName}Extended {
			public static override get className(): string {
                return Base.className || Base.name;
            }
            public override get className(): string {
                return Base.className || Base.name;
            }

			// code your methods here

			
		};
	}

}`;
		}
		else {
			defaultRAM = `
export class ${className} extends Aventus.Ram<${objectName}> implements Aventus.IRam {

	/**
	 * Create a singleton to store data
	 */
	public static getInstance(): ${className} {
		return Aventus.Instance.get(${className});
	}

	/**
	 * @inheritdoc
	 */
	public override defineIndexKey(): keyof ${objectName} {
		return 'id';
	}
	/**
	 * @inheritdoc
	 */
	protected override getTypeForData(objJson: Aventus.KeysObject<${objectName}> | ${objectName}): new () => ${objectName} {
		return ${objectName};
	}
}`;
		}
		defaultRAM = this.addNamespace(defaultRAM, newScriptUri);
		writeFileSync(newScriptPath, defaultRAM);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultRAM);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(newScriptUri);
	}

	private static createComponent(componentName: string, baseFolderUri: string, isMultiple: boolean) {
		let newFolderPath = uriToPath(baseFolderUri + "/" + componentName);
		componentName = componentName.replace(/_|-([a-z])/g, (match, p1) => p1.toUpperCase());
		let firstUpperName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
		let className = firstUpperName;
		if (isMultiple) {
			mkdirSync(newFolderPath);
			let newScriptPath = newFolderPath + "/" + componentName;
			let defaultTs = `export class ${className} extends Aventus.WebComponent implements Aventus.DefaultComponent {

	//#region static
	
	//#endregion
	
	
	//#region props
	
	//#endregion
	
	
	//#region variables
	
	//#endregion
	
	
	//#region constructor
	
	//#endregion
	
	
	//#region methods
	
	//#endregion
	
}`
			defaultTs = this.addNamespace(defaultTs, pathToUri(newScriptPath + AventusExtension.ComponentLogic), true);
			writeFileSync(newScriptPath + AventusExtension.ComponentLogic, defaultTs);
			let textDocumentTs: TextDocument = TextDocument.create(pathToUri(newScriptPath + AventusExtension.ComponentLogic), AventusLanguageId.TypeScript, 0, defaultTs);

			let defaultSCSS = ":host {" + EOL + "\t" + EOL + "}" + EOL + "";
			writeFileSync(newScriptPath + AventusExtension.ComponentStyle, defaultSCSS);
			let textDocumentSCSS: TextDocument = TextDocument.create(pathToUri(newScriptPath + AventusExtension.ComponentStyle), AventusLanguageId.SCSS, 0, defaultSCSS);

			let defaultHTML = "<slot></slot>";
			writeFileSync(newScriptPath + AventusExtension.ComponentView, defaultHTML);
			let textDocumentHTML: TextDocument = TextDocument.create(pathToUri(newScriptPath + AventusExtension.ComponentView), AventusLanguageId.HTML, 0, defaultHTML);

			FilesManager.getInstance().registerFile(textDocumentHTML);
			FilesManager.getInstance().registerFile(textDocumentSCSS);
			FilesManager.getInstance().registerFile(textDocumentTs);
			OpenFile.send(textDocumentTs.uri);
		}
		else {
			let defaultWc = `<script>
	export class ${className} extends Aventus.WebComponent implements Aventus.DefaultComponent {

	}
</script>

<template>
	<slot></slot>
</template>

<style>
	:host {

	}
</style>
`
			writeFileSync(newFolderPath + AventusExtension.Component, defaultWc);
			let textDocumentTs: TextDocument = TextDocument.create(pathToUri(newFolderPath + AventusExtension.Component), AventusLanguageId.WebComponent, 0, defaultWc);
			FilesManager.getInstance().registerFile(textDocumentTs);
			OpenFile.send(textDocumentTs.uri);
		}


	}

	private static createData(dataName: string, baseFolderUri: string) {
		let newScriptPath = uriToPath(baseFolderUri + "/" + dataName + AventusExtension.Data);
		let newScriptUri = pathToUri(newScriptPath);
		dataName = dataName.replace(/_|-([a-z])/g, (match, p1) => p1.toUpperCase());
		let firstUpperName = dataName.charAt(0).toUpperCase() + dataName.slice(1);
		let className = firstUpperName;
		let defaultTs = `export class ${className} extends Aventus.Data implements Aventus.IData {${EOL}\tpublic id: number = 0;${EOL}}`
		defaultTs = this.addNamespace(defaultTs, newScriptUri);
		writeFileSync(newScriptPath, defaultTs);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultTs);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(textDocument.uri);
	}
	private static createLib(libName: string, baseFolderUri: string) {
		let newScriptPath = uriToPath(baseFolderUri + "/" + libName + AventusExtension.Lib);
		let newScriptUri = pathToUri(newScriptPath);
		libName = libName.replace(/_|-([a-z])/g, (match, p1) => p1.toUpperCase());
		let firstUpperName = libName.charAt(0).toUpperCase() + libName.slice(1);
		let className = firstUpperName;
		let defaultTs = `export class ${className} {${EOL}\t${EOL}}`;
		defaultTs = this.addNamespace(defaultTs, newScriptUri);
		writeFileSync(newScriptPath, defaultTs);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultTs);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(textDocument.uri);
	}

	private static createState(name: string, baseFolderUri: string, format: string) {
		name = name.charAt(0).toUpperCase() + name.slice(1);
		let newScriptPath = uriToPath(baseFolderUri + "/" + name + AventusExtension.State);
		let newScriptUri = pathToUri(newScriptPath);
		let defaultState = "";
		if (format == "State") {
			defaultState = `export class ${name} extends Aventus.State implements Aventus.IState {
	/**
	 * @inheritdoc
	 */
	public override get name(): string {
		return ;
	}
}`
		}
		else {
			if (name.endsWith("Manager")) {
				name.replace("Manager", "");
			}
			defaultState = `export class ${name}StateManager extends Aventus.StateManager implements Aventus.IStateManager {
	/**
	 * Get the instance of the StateManager
	 */
	public static getInstance(): ${name}StateManager {
		return Aventus.Instance.get(${name}StateManager);
	}

}`
		}

		defaultState = this.addNamespace(defaultState, newScriptUri);
		writeFileSync(newScriptPath, defaultState);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultState);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(newScriptUri);
	}


	//#region tools
	private static checkIfProject(uri: string) {
		let uris = ProjectManager.getInstance().getAllConfigFiles();
		let norm = uri.replace(/\\/g, "/");
		for (let uriTemp of uris) {
			if (norm.startsWith(uriTemp.replace("/aventus.conf.avt", ""))) {
				return true;
			}
		}
		return false;
	}
	private static addNamespace(text: string, uri: string, removeParentFolder: boolean = false) {
		let builds = ProjectManager.getInstance().getMatchingBuildsByUri(uri);
		if (builds.length > 0) {
			let namespace = builds[0].getNamespaceForUri(uri, removeParentFolder);
			if (namespace != "") {
				// add tab
				text = "\t" + text.split('\n').join("\n\t");
				text = `namespace ${namespace} {${EOL}${text}${EOL}}`
			}
		}
		return text;
	}

	//#endregion
}