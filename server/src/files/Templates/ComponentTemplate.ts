import { mkdirSync, writeFileSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { pathToUri, reorderList, uriToPath } from '../../tools';
import { BaseTemplate } from './BaseTemplate';
import { AventusExtension, AventusLanguageId } from '../../definition';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { EOL } from 'os';
import { FilesManager } from '../FilesManager';
import { OpenFile } from '../../notification/OpenFile';

export class ComponentTemplate extends BaseTemplate {
	private static componentFormatOptions: SelectItem[] = [
		{ label: "Single", detail: "Single file" },
		{ label: "Multiple", detail: "Splitted file" },
	];

	public name(): string {
		return "Component.Basic";
	}
	public definition(): string {
		return "Create a basic webcomponent";
	}
	public async init(path: string): Promise<void> {
		const name = await GenericServer.Input({
			title: "Provide a name for your Component",
		});
		if (!name) {
			return;
		}
		const resultFormat = await GenericServer.Select(ComponentTemplate.componentFormatOptions, {
			placeHolder: 'How should I setup your component?',
		});
		if (resultFormat) {
			reorderList(ComponentTemplate.componentFormatOptions, resultFormat);
			this.createComponent(name, path, resultFormat.label == "Multiple");
		}
	}

	private createComponent(componentName: string, baseFolderUri: string, isMultiple: boolean) {
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
			defaultTs = this.addNamespace(defaultTs, pathToUri(newScriptPath + AventusExtension.ComponentLogic));
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
}