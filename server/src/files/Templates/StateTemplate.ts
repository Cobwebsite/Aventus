import { writeFileSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { AventusExtension, AventusLanguageId } from '../../definition';
import { pathToUri, uriToPath } from '../../tools';
import { BaseTemplate } from './BaseTemplate'
import { TextDocument } from 'vscode-languageserver-textdocument';
import { FilesManager } from '../FilesManager';
import { OpenFile } from '../../notification/OpenFile';

export class StateTemplate extends BaseTemplate {
	public name(): string {
		return "State.Basic State"
	}
	public definition(): string {
		return "Create a basic state";
	}
	public async init(path: string): Promise<void> {
		const name = await GenericServer.Input({
			title: "Provide a name for your State",
		});
		if (!name) {
			return;
		}
		this.createState(name, path);
	}

	private createState(name: string, baseFolderUri: string) {
		name = name.charAt(0).toUpperCase() + name.slice(1);
		let newScriptPath = uriToPath(baseFolderUri + "/" + name + AventusExtension.State);
		let newScriptUri = pathToUri(newScriptPath);
		let defaultState = "";

		defaultState = `export class ${name} extends Aventus.State implements Aventus.IState {
	/**
	 * @inheritdoc
	 */
	public override get name(): string {
		return ;
	}
}`

		defaultState = this.addNamespace(defaultState, newScriptUri);
		writeFileSync(newScriptPath, defaultState);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultState);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(newScriptUri);
	}

}