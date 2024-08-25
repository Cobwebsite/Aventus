import { EOL } from 'os';
import { GenericServer } from '../../GenericServer';
import { AventusExtension, AventusLanguageId } from '../../definition';
import { pathToUri, uriToPath } from '../../tools';
import { BaseTemplate } from './BaseTemplate';
import { writeFileSync } from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { FilesManager } from '../FilesManager';
import { OpenFile } from '../../notification/OpenFile';

export class LibraryTemplate extends BaseTemplate {
	public name(): string {
		return "Data.Library"
	}
	public definition(): string {
		return "Create a basic library class";
	}
	public async init(path: string): Promise<void> {
		const name = await GenericServer.Input({
			title: "Provide a name for your Library",
		});
		if (!name) {
			return;
		}
		this.createLib(name, path);
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

}