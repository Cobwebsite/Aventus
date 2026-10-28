import { FilesManager } from '../files/FilesManager';
import { InternalAventusFile } from '../files/AventusFile';
import { writeFileSync } from 'fs';
import { uriToPath } from '../tools';
import { GenericServer } from '../GenericServer';

export class Format {
	static cmd: string = "aventus.format";

	public static async run(uri?: string) {

		let uris: string[] = [];
		if (uri) {
			uris = [uri]
		}
		else {
			uris = FilesManager.getInstance().getUris();
		}
		const failed: string[] = [];
		const stale: string[] = [];
		await GenericServer.showLoadingMessage("Formatting " + uris.length + " files", async () => {
			for (let uriTemp of uris) {
				let file = FilesManager.getInstance().getByUri(uriTemp);
				if (file instanceof InternalAventusFile) {
					try {
						let oldContent = file.contentUser;
						let oldVersion = file.versionUser;
						let textEdits = await file.getFormatting();
						if (file.versionUser !== oldVersion) {
							stale.push(uriToPath(uriTemp));
							continue;
						}
						await file.applyTextEdits(textEdits);
						let newContent = file.contentUser;
						if (oldContent != newContent) {
							writeFileSync(uriToPath(uriTemp), file.contentUser)
						}
					} catch (e) {
						console.error(e)
						failed.push(uriToPath(uriTemp));
					}
				}
			}
		})
		if (failed.length > 0) {
			GenericServer.showErrorMessage(`Formatting failed for ${failed.length} file(s):\n${failed.join('\n')}`);
		}
		if (stale.length > 0) {
			GenericServer.showErrorMessage(`Files changed during formatting; format them again:\n${stale.join('\n')}`);
		}
	}
}
