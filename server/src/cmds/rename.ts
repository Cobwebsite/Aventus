import { pathToUri, uriToPath } from '../tools';
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ProjectManager } from '../project/ProjectManager';
import { SettingsManager } from '../settings/Settings';
import { FilesManager } from '../files/FilesManager';
import { InternalAventusFile } from '../files/AventusFile';


export class Rename {
	static cmd: string = "aventus.rename";

	public static async run(changes: { oldUri: string, newUri: string }[]) {
		if (!SettingsManager.getInstance().settings.updateImportOnRename) {
			return;
		}
		if (!changes) {
			return
		}
		let changesToSend: { oldUri: string, newUri: string }[] = [];
		for (let change of changes) {
			let newUri = change.newUri;
			let oldUri = change.oldUri;
			let newPath = uriToPath(newUri);
			let oldPath = uriToPath(oldUri);
			let pathToUse: string;
			let useNew = true;
			if (existsSync(newPath)) {
				pathToUse = newPath;
			}
			else {
				useNew = false;
				pathToUse = oldPath;
			}
			if (statSync(pathToUse).isDirectory()) {
				const _loop = (tempPath: string) => {
					let contents = readdirSync(tempPath);
					for (let content of contents) {
						let joinPath = join(tempPath, content);
						if (statSync(joinPath).isDirectory()) {
							_loop(joinPath);
						}
						else {
							let tempNewUri = pathToUri(joinPath);
							if (useNew) {
								changesToSend.push({
									newUri: tempNewUri,
									oldUri: tempNewUri.replace(newUri, oldUri)
								})
							}
							else {
								changesToSend.push({
									newUri: tempNewUri.replace(oldUri, newUri),
									oldUri: tempNewUri
								})
							}
						}
					}
				}
				_loop(pathToUse);
			}
			else {
				changesToSend.push({
					oldUri: oldUri,
					newUri: newUri
				})
			}
		}

		let textEditsByUri = await ProjectManager.getInstance().onRename(changesToSend);

		let toWrite: { [path: string]: string } = {}
		let fileManager = FilesManager.getInstance();
		for (let uri in textEditsByUri) {
			let file = fileManager.getByUri(uri);
			if (file) {
				await (file as InternalAventusFile).applyTextEdits(textEditsByUri[uri]);
				toWrite[uriToPath(file.uri)] = file.content;
			}
		}

		// delay writing to be sure that changed is effectiv inside aventus
		setTimeout(() => {
			// use filesystem to avoid editor to open files
			for (let path in toWrite) {
				writeFileSync(path, toWrite[path]);
			}

		}, 500);
	}
}

