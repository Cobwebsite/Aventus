import { mkdirSync, writeFileSync } from 'fs';
import { ExecuteCommandParams } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { EOL } from 'os';
import { getPathFromCommandArguments, pathToUri, uriToPath } from '../tools';
import { AventusExtension, AventusLanguageId } from '../definition';
import { ProjectManager } from '../project/ProjectManager';
import { FilesManager } from '../files/FilesManager';
import { OpenFile } from '../notification/OpenFile';


export class Create {
	static cmd: string = "aventus.create";
	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments[2]) {
			let type = params.arguments[2].label;
			let baseFolder: string = getPathFromCommandArguments(params);
			if (params.arguments[3]) {

				if (type == "RAM") {
					this.createRAM(params.arguments[3], baseFolder);
				}
				else {
					let name: string = params.arguments[3];
					let format = "Multiple";
					if (params.arguments[4]) {
						format = params.arguments[4].label;
					}
					if (type == "Component") {
						this.createComponent(name, baseFolder, format == "Multiple");
					}
					else if (type == "Data") {
						this.createData(name, baseFolder);
					}
					else if (type == "Library") {
						this.createLib(name, baseFolder);
					}
					else if (type == "Socket") {
						this.createSocket(name, baseFolder);
					}
					else if (type == "State") {
						this.createState(name, baseFolder, format);
					}
				}
			}
		}
	}


	private createRAM(objectName: string, baseFolderUri: string) {
		objectName = objectName.charAt(0).toUpperCase() + objectName.slice(1);
		let newScriptPath = uriToPath(baseFolderUri + "/" + objectName + AventusExtension.RAM);
		let newScriptUri = pathToUri(newScriptPath);
		// let importPath = this.getImportPath(newScriptPath, objectPath);
		let className = objectName + "RAM";
		let defaultRAM = ''
		defaultRAM = `
export class ${className} extends Aventus.Ram<${objectName}> implements Aventus.IRam {

	/**
	 * Create a singleton to store data
	 */
	public static getInstance() {
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
		defaultRAM = this.addNamespace(defaultRAM, newScriptUri);
		writeFileSync(newScriptPath, defaultRAM);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultRAM);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(newScriptUri);
	}

	private createComponent(componentName: string, baseFolderUri: string, isMultiple: boolean) {
		let newFolderPath = uriToPath(baseFolderUri + "/" + componentName);
		componentName = componentName.replace(/_|-([a-z])/g, (match, p1) => p1.toUpperCase());
		let firstUpperName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
		let className = firstUpperName;
		mkdirSync(newFolderPath);
		let newScriptPath = newFolderPath + "/" + componentName;
		if (isMultiple) {
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

			writeFileSync(newScriptPath + AventusExtension.Component, defaultWc);
			let textDocumentTs: TextDocument = TextDocument.create(pathToUri(newScriptPath + AventusExtension.Component), AventusLanguageId.WebComponent, 0, defaultWc);
			FilesManager.getInstance().registerFile(textDocumentTs);
			OpenFile.send(textDocumentTs.uri);
		}


	}

	private createData(dataName: string, baseFolderUri: string) {
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
	private createLib(libName: string, baseFolderUri: string) {
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

	private createSocket(socketName: string, baseFolderUri: string) {
		socketName = socketName.charAt(0).toUpperCase() + socketName.slice(1);
		let newScriptPath = uriToPath(baseFolderUri + "/" + socketName + AventusExtension.Socket);
		let newScriptUri = pathToUri(newScriptPath);
		let defaultSocket = `
export class LoginSocket extends Aventus.Socket implements Aventus.ISocket {

	/**
	 * Get the instance of the websocket
	 */
	public static getInstance() {
		return Aventus.Instance.get(LoginSocket);
	}

	/**
	 * @inheritdoc
	 */
	protected override configure(options: Aventus.SocketOptions): Aventus.SocketOptions {
		
		return options;
	}

}`
		defaultSocket = this.addNamespace(defaultSocket, newScriptUri);
		writeFileSync(newScriptPath, defaultSocket);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultSocket);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(newScriptUri);
	}
	private createState(name: string, baseFolderUri: string, format: string) {
		name = name.charAt(0).toUpperCase() + name.slice(1);
		let newScriptPath = uriToPath(baseFolderUri + "/" + name + AventusExtension.State);
		let newScriptUri = pathToUri(newScriptPath);
		let defaultSocket = "";
		if (format == "State") {
			defaultSocket = `export class ${name} extends Aventus.State {
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
			defaultSocket = `export class ${name}StateManager extends Aventus.StateManager {
	/**
	 * Get the instance of the StateManager
	 */
	public static getInstance() {
		return Aventus.Instance.get(${name}StateManager);
	}

}`
		}

		defaultSocket = this.addNamespace(defaultSocket, newScriptUri);
		writeFileSync(newScriptPath, defaultSocket);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultSocket);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(newScriptUri);
	}


	//#region tools

	private addNamespace(text: string, uri: string, removeParentFolder: boolean = false) {
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