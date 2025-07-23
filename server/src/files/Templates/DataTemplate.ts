import { EOL } from 'os';
import { GenericServer } from '../../GenericServer';
import { AventusExtension, AventusLanguageId } from '../../definition';
import { pathToUri, uriToPath } from '../../tools';
import { BaseTemplate } from './BaseTemplate';
import { writeFileSync } from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { FilesManager } from '../FilesManager';
import { OpenFile } from '../../notification/OpenFile';

export class DataTemplate extends BaseTemplate {
	public name(): string {
		return "Data.Basic"
	}
	public definition(): string {
		return "Create a basic data";
	}
	public async init(path: string): Promise<void> {
		const name = await GenericServer.Input({
			title: "Provide a name for your Data",
		});
		if (!name) {
			return;
		}
		this.createData(name, path);
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

}