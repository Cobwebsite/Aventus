import { FilesManager } from '../files/FilesManager';
import { InternalAventusFile } from '../files/AventusFile';
import { writeFileSync } from 'fs';
import { uriToPath } from '../tools';

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

		for (let uriTemp of uris) {
			let file = FilesManager.getInstance().getByUri(uriTemp);
			if (file instanceof InternalAventusFile) {
				try {
					let oldContent = file.contentUser;
					let textEdits = await file.getFormatting();
					await file.applyTextEdits(textEdits);
					let newContent = file.contentUser;
					if(oldContent != newContent) {
						console.log(textEdits);
						writeFileSync(uriToPath(uriTemp), file.contentUser)
					}
				} catch (e) {
					console.error(e)
				}
			}
		}
	}
}
