import { ExecuteCommandParams } from 'vscode-languageserver';
import { AventusExtension } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, rmdirSync, writeFileSync } from 'fs';
import { ProjectManager } from '../../project/ProjectManager';
import { getLanguageIdByUri, uriToPath } from '../../tools';
import { CloseFile } from '../../notification/CloseFile';
import { TextDocument } from 'vscode-languageserver-textdocument';

export class Rename {
	static cmd: string = "aventus.component.rename";

	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments.length > 1) {
			let uri: string = params.arguments[0];
			let newName: string = params.arguments[1];
			this.run(uri, newName);
		}
	}

	private async run(uri: string, newName: string) {
		let logicalFile = FilesManager.getInstance().getByUri(uri);
		if (logicalFile && logicalFile instanceof InternalAventusFile) {
			let filesManager = FilesManager.getInstance();
			let splitted = logicalFile.document.uri.split('/')
			let oldName = splitted[splitted.length - 1]
				.replace(AventusExtension.ComponentLogic, "");

			let oldFolderUri = logicalFile.folderUri;
			let newFolderUri = oldFolderUri.replace(new RegExp(oldName + "$"), newName);

			//#region rename class name
			let regex = new RegExp("(class +)" + oldName + " ");
			let match = regex.exec(logicalFile.content);
			let transformToApply: { [uri: string]: InternalAventusFile } = {}
			if (match) {
				let offset = match.index + match[1].length;
				let position = logicalFile.document.positionAt(offset);
				let transformations = await logicalFile.getRename(position, newName);
				if (transformations && transformations.changes) {
					for (let uri in transformations.changes) {
						if (!transformToApply[uri]) {
							let file = filesManager.getByUri(uri);
							if (!file) continue;

							transformToApply[uri] = file as InternalAventusFile;
						}
						let changes = transformations.changes[uri];
						await transformToApply[uri].applyTextEdits(changes);
					}
				}
			}
			//#endregion

			//#region rename files
			let changesToSend: { oldUri: string, newUri: string }[] = [];

			let checkIfRename = (extension: string) => {
				let oldUri = oldFolderUri + '/' + oldName + extension;
				if (existsSync(uriToPath(oldUri))) {
					let newUri = newFolderUri + '/' + newName + extension;
					changesToSend.push({
						oldUri: oldUri,
						newUri: newUri
					})
				}
			}
			checkIfRename(AventusExtension.ComponentLogic);
			checkIfRename(AventusExtension.ComponentStyle);
			checkIfRename(AventusExtension.ComponentView);


			let textEditsByUri = await ProjectManager.getInstance().onRename(changesToSend);
			for (let uri in textEditsByUri) {
				if (!transformToApply[uri]) {
					let file = filesManager.getByUri(uri);
					if (!file) continue;

					transformToApply[uri] = file as InternalAventusFile;
				}
				await transformToApply[uri].applyTextEdits(textEditsByUri[uri]);
			}

			//#endregion

			// delay writing to be sure that changed is effectiv inside aventus
			setTimeout(() => {
				// use filesystem to avoid editor to open files
				for (let uri in transformToApply) {
					writeFileSync(uriToPath(uri), transformToApply[uri].content);
				}

				mkdirSync(uriToPath(newFolderUri));
				for (let changeToSend of changesToSend) {
					let oldUri = changeToSend.oldUri;
					let newUri = changeToSend.newUri;
					let oldPath = uriToPath(oldUri)
					renameSync(oldPath, uriToPath(newUri));
					CloseFile.send(oldUri);
					let oldFile = filesManager.getByUri(oldUri);
					if (oldFile) {
						filesManager.registerFile(TextDocument.create(newUri, getLanguageIdByUri(newUri), 1, oldFile.content));
						filesManager.onClose(oldFile?.document)
					}
				}
				let oldFolderPath = uriToPath(oldFolderUri);
				let contentFiles = readdirSync(oldFolderPath)
				if (contentFiles.length == 0) {
					rmdirSync(oldFolderPath);
				}
				else if (contentFiles.length == 1 && contentFiles[0].endsWith(".js")) {
					rmSync(oldFolderPath, { recursive: true, force: true });
				}

			}, 500);
		}
	}
}