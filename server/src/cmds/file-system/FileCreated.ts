import { ExecuteCommandParams, TextEdit } from 'vscode-languageserver';
import { FilesManager } from '../../files/FilesManager';

export class FileCreated {
	static cmd: string = "aventus.filesystem.created";

	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments.length == 1) {
			let uri = params.arguments[0];
			this.run(uri);
		}
	}

	private async run(uri: string) {
		FilesManager.getInstance().onCreatedUri(uri);
	}
}